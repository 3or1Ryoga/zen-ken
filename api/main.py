"""
Face Mosaic API Server
MediaPipe + OpenCV を使用した顔モザイク処理API
"""

import os
import tempfile
import uuid
import subprocess
import json
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI(
    title="Face Mosaic API",
    description="MediaPipe + OpenCV による顔検出・モザイク処理API",
    version="1.0.0"
)

# CORS設定（Next.jsからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# モデルのパス
MODEL_PATH = Path(__file__).parent / "models" / "blaze_face_short_range.tflite"
OUTPUT_DIR = Path(tempfile.gettempdir()) / "face_mosaic_output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Face Detector の初期化
detector: Optional[vision.FaceDetector] = None


def get_video_rotation(video_path: str) -> int:
    """ffprobeを使用して動画の回転メタデータを取得し、0, 90, 180, 270に正規化する"""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'quiet',
            '-select_streams', 'v:0',
            '-show_entries', 'stream_tags=rotate:stream_side_data=rotation',
            '-print_format', 'json',
            video_path
        ], capture_output=True, text=True)

        if result.returncode == 0:
            data = json.loads(result.stdout)
            stream = data.get('streams', [{}])[0]
            
            # 回転情報を取得（tags または side_data から）
            rotation = stream.get('tags', {}).get('rotate', '0')
            side_data = stream.get('side_data_list', [])
            for sd in side_data:
                if 'rotation' in sd:
                    rotation = sd['rotation']
            
            rot_int = int(float(rotation))
            # マイナスの回転（-90など）を正の数（270など）に変換し、360の範囲に収める
            return rot_int % 360
            
    except Exception as e:
        print(f"Error getting video rotation: {e}")
    return 0


def rotate_frame(frame: np.ndarray, rotation: int) -> np.ndarray:
    """
    フレームを指定角度で回転

    スマートフォンの動画は横向きで記録され、メタデータで回転角度が指定される。
    rotation=90 は「90度回転して表示」という意味なので、時計回りに90度回転が必要。

    Args:
        frame: 入力フレーム
        rotation: 回転角度（0, 90, 180, 270, -90など）

    Returns:
        回転後のフレーム
    """
    if rotation == 0:
        return frame
    elif rotation == 90 or rotation == -270:
        # 90度回転 = 時計回りに90度
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    elif rotation == -90 or rotation == 270:
        # -90度/270度回転 = 反時計回りに90度
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif rotation == 180 or rotation == -180:
        return cv2.rotate(frame, cv2.ROTATE_180)
    return frame


def get_detector() -> vision.FaceDetector:
    """Face Detector のシングルトンインスタンスを取得"""
    global detector
    if detector is None:
        if not MODEL_PATH.exists():
            raise HTTPException(
                status_code=500,
                detail=f"モデルファイルが見つかりません: {MODEL_PATH}"
            )

        base_options = python.BaseOptions(model_asset_path=str(MODEL_PATH))
        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=0.3  # 感度を上げる（0.5→0.3）
        )
        detector = vision.FaceDetector.create_from_options(options)
    return detector


def apply_mosaic(image: np.ndarray, x: int, y: int, w: int, h: int, ratio: float = 0.05) -> np.ndarray:
    """
    指定領域にモザイクを適用

    Args:
        image: 入力画像
        x, y: 左上座標
        w, h: 幅と高さ
        ratio: モザイクの粗さ（小さいほど粗い）

    Returns:
        モザイク適用後の画像
    """
    # 領域を切り出し
    face_region = image[y:y+h, x:x+w]

    if face_region.size == 0:
        return image

    # 縮小してから拡大（モザイク効果）
    small_w = max(1, int(w * ratio))
    small_h = max(1, int(h * ratio))

    small = cv2.resize(face_region, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
    mosaic = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)

    # 元画像に適用
    image[y:y+h, x:x+w] = mosaic
    return image


def process_frame(
    frame: np.ndarray,
    face_detector: vision.FaceDetector,
    mosaic_ratio: float = 0.05,
    padding: float = 0.4,
    previous_faces: list = None
) -> tuple[np.ndarray, int, list]:
    """
    1フレームを処理し、顔にモザイクを適用

    Args:
        frame: 入力フレーム (BGR)
        face_detector: MediaPipe Face Detector
        mosaic_ratio: モザイクの粗さ
        padding: 顔周りの余白（%）
        previous_faces: 前フレームで検出された顔の位置（補間用）

    Returns:
        処理後のフレーム、検出された顔の数、顔の位置リスト
    """
    # BGRからRGBに変換（MediaPipeはRGBを期待）
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    # 顔検出
    detection_result = face_detector.detect(mp_image)

    height, width = frame.shape[:2]
    face_count = 0
    current_faces = []

    for detection in detection_result.detections:
        bbox = detection.bounding_box

        # バウンディングボックスの座標を取得
        x = bbox.origin_x
        y = bbox.origin_y
        w = bbox.width
        h = bbox.height

        # パディングを追加（大きめに設定）
        pad_x = int(w * padding)
        pad_y = int(h * padding)

        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(width, x + w + pad_x)
        y2 = min(height, y + h + pad_y)

        # 顔の位置を保存
        current_faces.append((x1, y1, x2, y2))

        # モザイクを適用
        frame = apply_mosaic(frame, x1, y1, x2 - x1, y2 - y1, mosaic_ratio)
        face_count += 1

    # 前フレームで検出された顔が今回検出されなかった場合、補間して適用
    if previous_faces and face_count == 0:
        for (x1, y1, x2, y2) in previous_faces:
            frame = apply_mosaic(frame, x1, y1, x2 - x1, y2 - y1, mosaic_ratio)
        current_faces = previous_faces

    return frame, face_count, current_faces


# def process_video(
#     input_path: str,
#     output_path: str,
#     mosaic_ratio: float = 0.05,
#     padding: float = 0.4
# ) -> dict:
#     """
#     動画全体を処理

#     Args:
#         input_path: 入力動画パス
#         output_path: 出力動画パス
#         mosaic_ratio: モザイクの粗さ
#         padding: 顔周りの余白

#     Returns:
#         処理結果の統計情報
#     """
#     face_detector = get_detector()

#     # 動画の回転メタデータを取得
#     rotation = get_video_rotation(input_path)

#     # --- ここを追加・修正 ---
#     print("\n" + "="*30)
#     print(f"DEBUG: 検出された回転角度: {rotation}")
#     print(f"DEBUG: 入力ファイル: {input_path}")
#     print("="*30 + "\n")
#     # -----------------------

#     print(f"Video rotation: {rotation}")

#     cap = cv2.VideoCapture(input_path)
#     if not cap.isOpened():
#         raise HTTPException(status_code=400, detail="動画ファイルを開けません")

#     # 動画情報を取得
#     fps = int(cap.get(cv2.CAP_PROP_FPS))
#     original_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#     original_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
#     total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

#     # --- ここから修正 ---
#     # 回転後のサイズを計算 (90度または270度の時は幅と高さを入れ替える)
#     if rotation in [90, 270]:
#         output_width = original_height
#         output_height = original_width
#     else:
#         output_width = original_width
#         output_height = original_height

#     # 一時ファイルに出力
#     temp_output = str(output_path).replace('.mp4', '_temp.mp4')
#     # macOS/iOSとの互換性のために 'avc1' (H.264) を指定
#     fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
#     out = cv2.VideoWriter(temp_output, fourcc, fps, (output_width, output_height))
#     # --- ここまで修正 ---

#     processed_frames = 0
#     total_faces_detected = 0
#     previous_faces = None

#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break

#         # 回転を適用
#         if rotation != 0:
#             frame = rotate_frame(frame, rotation)

#         # フレームを処理（前フレームの顔位置を渡して補間）
#         processed_frame, face_count, current_faces = process_frame(
#             frame, face_detector, mosaic_ratio, padding, previous_faces
#         )

#         # 顔が検出された場合は保存（数フレーム補間用）
#         if face_count > 0:
#             previous_faces = current_faces

#         out.write(processed_frame)
#         processed_frames += 1
#         total_faces_detected += face_count

#     cap.release()
#     out.release()

#     # ffmpegでH.264に変換（ブラウザ互換）+ 元動画から音声をコピー
#     # -noautorotate: 自動回転を無効化（既に手動で回転済みのため）
#     try:
#         subprocess.run([
#             'ffmpeg', '-y',
#             '-noautorotate',
#             '-i', temp_output,
#             '-noautorotate',
#             '-i', input_path,
#             '-c:v', 'libx264',
#             '-preset', 'fast',
#             '-crf', '23',
#             '-map', '0:v:0',
#             '-map', '1:a:0?',
#             '-map_metadata', '-1',
#             '-c:a', 'aac',
#             '-movflags', '+faststart',
#             '-metadata:s:v', 'rotate=0',
#             '-shortest',
#             output_path
#         ], check=True, capture_output=True)

#         # 一時ファイルを削除
#         Path(temp_output).unlink(missing_ok=True)
#     except subprocess.CalledProcessError as e:
#         print(f"ffmpeg error: {e.stderr.decode() if e.stderr else 'unknown'}")
#         # ffmpegが失敗した場合は一時ファイルをそのまま使用
#         if Path(temp_output).exists():
#             Path(temp_output).rename(output_path)
#     except FileNotFoundError:
#         # ffmpegがインストールされていない場合
#         if Path(temp_output).exists():
#             Path(temp_output).rename(output_path)

#     return {
#         "processed_frames": processed_frames,
#         "total_frames": total_frames,
#         "total_faces_detected": total_faces_detected,
#         "fps": fps,
#         "width": output_width,
#         "height": output_height,
#         "rotation_applied": rotation
#     }

def process_video(
    input_path: str,
    output_path: str,
    mosaic_ratio: float = 0.05,
    padding: float = 0.4
) -> dict:
    face_detector = get_detector()

    # 1. 元の動画の回転角を確実に取得
    rotation = get_video_rotation(input_path)
    print(f"DEBUG: 最終判定回転角: {rotation}")

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="動画ファイルを開けません")

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # OpenCVでは「回転させず」に、生のサイズで一時保存する
    temp_output = str(output_path).replace('.mp4', '_temp.mp4')
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_output, fourcc, fps, (width, height))

    processed_frames = 0
    total_faces_detected = 0
    previous_faces = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # 生の向きでモザイク処理
        processed_frame, face_count, current_faces = process_frame(
            frame, face_detector, mosaic_ratio, padding, previous_faces
        )
        if face_count > 0:
            previous_faces = current_faces
        out.write(processed_frame)
        processed_frames += 1
        total_faces_detected += face_count

    cap.release()
    out.release()

    # 2. FFmpegで「回転フィルタ」を適用して、向きを物理的に固定する
    # 270度（-90度）の場合 = 反時計回りに90度 (transpose=2)
    # 90度の場合 = 時計回りに90度 (transpose=1)
    # 180度の場合 = 上下左右反転 (transpose=2,transpose=2)
    
    # --- 修正版：回転フィルタの割り当て ---
    vf_filter = "pad=ceil(iw/2)*2:ceil(ih/2)*2" # デフォルト
    
    if rotation == 90:
        # 90度の時に逆さまなら、反時計回り(2)を試す
        vf_filter = "transpose=2" 
    elif rotation == 180:
        vf_filter = "transpose=2,transpose=2"
    elif rotation == 270:
        # 270度（-90度）の時に逆さまなら、時計回り(1)を適用する
        # これが「あと180度回す」ことと同じ効果になります
        vf_filter = "transpose=1" 

    print(f"DEBUG: 適用するフィルタ: {vf_filter}")
    # -----------------------------------

    try:
        subprocess.run([
            'ffmpeg', '-y',
            '-i', temp_output,   # モザイク済み（横向き）
            '-i', input_path,    # 音声用
            '-vf', vf_filter,    # ここで物理的に回転させる！
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-map', '0:v:0',
            '-map', '1:a:0?',
            '-c:a', 'aac',
            '-metadata:s:v', 'rotate=0', # 回転情報をリセット（焼き付け済みのため）
            '-movflags', '+faststart',
            output_path
        ], check=True, capture_output=True)

        Path(temp_output).unlink(missing_ok=True)
    except Exception as e:
        print(f"FFmpeg Error: {e}")
        if Path(temp_output).exists():
            Path(temp_output).rename(output_path)

    return {
        "processed_frames": processed_frames,
        "rotation_fixed": rotation,
        "status": "Success with FFmpeg transpose"
    }

@app.get("/")
async def root():
    """ヘルスチェック"""
    return {"status": "ok", "message": "Face Mosaic API is running"}


@app.get("/health")
async def health_check():
    """詳細なヘルスチェック"""
    model_exists = MODEL_PATH.exists()
    return {
        "status": "healthy" if model_exists else "degraded",
        "model_loaded": model_exists,
        "model_path": str(MODEL_PATH)
    }


@app.post("/api/mosaic/video")
async def process_video_endpoint(
    file: UploadFile = File(...),
    mosaic_ratio: float = Query(0.05, ge=0.01, le=0.2, description="モザイクの粗さ（小さいほど粗い）"),
    padding: float = Query(0.3, ge=0.0, le=1.0, description="顔周りの余白")
):
    """
    動画にモザイク処理を適用

    - **file**: 入力動画ファイル（mp4, mov, webm対応）
    - **mosaic_ratio**: モザイクの粗さ（0.01〜0.2、デフォルト0.05）
    - **padding**: 顔周りの余白（0〜1、デフォルト0.3）
    """
    # ファイル拡張子チェック
    if not file.filename:
        raise HTTPException(status_code=400, detail="ファイル名が必要です")

    ext = Path(file.filename).suffix.lower()
    if ext not in ['.mp4', '.mov', '.webm', '.avi']:
        raise HTTPException(status_code=400, detail="サポートされていない動画形式です")

    # 一時ファイルに保存
    file_id = str(uuid.uuid4())
    input_path = OUTPUT_DIR / f"{file_id}_input{ext}"
    output_path = OUTPUT_DIR / f"{file_id}_output.mp4"

    try:
        # アップロードされたファイルを保存
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        # 動画処理
        stats = process_video(
            str(input_path),
            str(output_path),
            mosaic_ratio,
            padding
        )

        # 入力ファイルを削除
        input_path.unlink(missing_ok=True)

        return {
            "success": True,
            "file_id": file_id,
            "download_url": f"/api/mosaic/download/{file_id}",
            "stats": stats
        }

    except Exception as e:
        # エラー時はファイルをクリーンアップ
        input_path.unlink(missing_ok=True)
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mosaic/download/{file_id}")
async def download_processed_video(file_id: str):
    """処理済み動画をダウンロード"""
    output_path = OUTPUT_DIR / f"{file_id}_output.mp4"

    if not output_path.exists():
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    return FileResponse(
        output_path,
        media_type="video/mp4",
        filename=f"mosaic_{file_id}.mp4"
    )


@app.delete("/api/mosaic/cleanup/{file_id}")
async def cleanup_file(file_id: str):
    """処理済みファイルを削除"""
    output_path = OUTPUT_DIR / f"{file_id}_output.mp4"
    output_path.unlink(missing_ok=True)
    return {"success": True, "message": "ファイルを削除しました"}


@app.post("/api/mosaic/image")
async def process_image_endpoint(
    file: UploadFile = File(...),
    mosaic_ratio: float = Query(0.05, ge=0.01, le=0.2),
    padding: float = Query(0.3, ge=0.0, le=1.0)
):
    """
    画像にモザイク処理を適用

    - **file**: 入力画像ファイル（jpg, png対応）
    - **mosaic_ratio**: モザイクの粗さ
    - **padding**: 顔周りの余白
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="ファイル名が必要です")

    ext = Path(file.filename).suffix.lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
        raise HTTPException(status_code=400, detail="サポートされていない画像形式です")

    face_detector = get_detector()

    # 画像を読み込み
    content = await file.read()
    nparr = np.frombuffer(content, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="画像を読み込めません")

    # 処理
    processed_image, face_count, _ = process_frame(
        image, face_detector, mosaic_ratio, padding, None
    )

    # PNGとしてエンコード
    _, buffer = cv2.imencode('.png', processed_image)

    file_id = str(uuid.uuid4())
    output_path = OUTPUT_DIR / f"{file_id}_output.png"

    with open(output_path, "wb") as f:
        f.write(buffer.tobytes())

    return {
        "success": True,
        "file_id": file_id,
        "download_url": f"/api/mosaic/download/image/{file_id}",
        "faces_detected": face_count
    }


@app.get("/api/mosaic/download/image/{file_id}")
async def download_processed_image(file_id: str):
    """処理済み画像をダウンロード"""
    output_path = OUTPUT_DIR / f"{file_id}_output.png"

    if not output_path.exists():
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    return FileResponse(
        output_path,
        media_type="image/png",
        filename=f"mosaic_{file_id}.png"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
