#!/usr/bin/env python3
"""
動画の回転情報をデバッグするスクリプト

使い方:
    python debug_rotation.py <動画ファイルパス>
"""

import sys
import subprocess
import json
import cv2

def get_video_info(video_path: str) -> dict:
    """ffprobeで動画の詳細情報を取得"""
    result = subprocess.run([
        'ffprobe', '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        video_path
    ], capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ffprobe error: {result.stderr}")
        return {}

    return json.loads(result.stdout)

def main():
    if len(sys.argv) < 2:
        print("使い方: python debug_rotation.py <動画ファイルパス>")
        sys.exit(1)

    video_path = sys.argv[1]
    print(f"\n=== 動画情報: {video_path} ===\n")

    # ffprobeで情報取得
    info = get_video_info(video_path)

    if not info:
        print("動画情報を取得できませんでした")
        sys.exit(1)

    # ストリーム情報
    for stream in info.get('streams', []):
        if stream.get('codec_type') == 'video':
            print("【ffprobe情報】")
            print(f"  コーデック: {stream.get('codec_name')}")
            print(f"  解像度: {stream.get('width')} x {stream.get('height')}")
            print(f"  FPS: {stream.get('r_frame_rate')}")

            # rotation タグを確認
            tags = stream.get('tags', {})
            rotation = tags.get('rotate', 'なし')
            print(f"  rotation (tags): {rotation}")

            # side_data_listを確認
            side_data = stream.get('side_data_list', [])
            print(f"  side_data_list: {side_data}")

            # display matrixを確認
            for sd in side_data:
                if 'rotation' in sd:
                    print(f"  rotation (side_data): {sd['rotation']}")

    # OpenCVで情報取得
    print("\n【OpenCV情報】")
    cap = cv2.VideoCapture(video_path)
    if cap.isOpened():
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        print(f"  解像度: {width} x {height}")
        print(f"  FPS: {fps}")
        print(f"  フレーム数: {frame_count}")

        # 最初のフレームを読み込んで実際のサイズを確認
        ret, frame = cap.read()
        if ret:
            print(f"  実際のフレームサイズ: {frame.shape[1]} x {frame.shape[0]}")

        cap.release()
    else:
        print("  OpenCVで動画を開けませんでした")

    print("\n【判定】")
    for stream in info.get('streams', []):
        if stream.get('codec_type') == 'video':
            w = stream.get('width')
            h = stream.get('height')
            rotation = stream.get('tags', {}).get('rotate', '0')

            # side_dataからも確認
            for sd in stream.get('side_data_list', []):
                if 'rotation' in sd:
                    rotation = str(sd['rotation'])

            if w > h:
                print(f"  メタデータ上: 横長 ({w}x{h})")
            else:
                print(f"  メタデータ上: 縦長 ({w}x{h})")

            print(f"  回転メタデータ: {rotation}度")

            if rotation in ['90', '-90', '270', '-270']:
                print("  → 縦向きで撮影された動画です")
                if w > h:
                    print("  → OpenCVは横向きで読み込みます（回転補正が必要）")
            else:
                print("  → 横向きで撮影された動画です")

if __name__ == "__main__":
    main()
