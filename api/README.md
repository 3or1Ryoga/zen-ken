# Face Mosaic API

MediaPipe + OpenCV を使用した顔検出・モザイク処理APIサーバー

## セットアップ

### 1. Python環境の準備

Python 3.9以上が必要です。

```bash
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. サーバー起動

```bash
python main.py
```

サーバーが http://localhost:8000 で起動します。

## API エンドポイント

### ヘルスチェック

```
GET /health
```

### 動画にモザイク処理

```
POST /api/mosaic/video
```

パラメータ:
- `file`: 動画ファイル (mp4, mov, webm, avi)
- `mosaic_ratio`: モザイクの粗さ (0.01〜0.2、デフォルト: 0.05)
- `padding`: 顔周りの余白 (0〜1、デフォルト: 0.3)

### 処理済み動画のダウンロード

```
GET /api/mosaic/download/{file_id}
```

### 画像にモザイク処理

```
POST /api/mosaic/image
```

## 技術仕様

- **顔検出**: MediaPipe BlazeFace (Short Range)
- **モザイク処理**: OpenCV による縮小→拡大（INTER_NEAREST）
- **対応フォーマット**: mp4, mov, webm, avi, jpg, png, webp
