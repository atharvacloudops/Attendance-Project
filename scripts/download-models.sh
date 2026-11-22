#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# download-models.sh – Downloads required face-api.js model files
# Run from the project root: bash scripts/download-models.sh
# ═══════════════════════════════════════════════════════════════════════

MODEL_DIR="./frontend/public/models"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

echo "📦 Creating models directory at $MODEL_DIR"
mkdir -p "$MODEL_DIR"

MODELS=(
  # Tiny Face Detector
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  # Face Landmark 68 Net
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  # Face Recognition Net
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
  # Face Expression Net
  "face_expression_model-weights_manifest.json"
  "face_expression_model-shard1"
)

echo "⬇️  Downloading models..."
for MODEL in "${MODELS[@]}"; do
  if [ -f "$MODEL_DIR/$MODEL" ]; then
    echo "  ✓ $MODEL (already exists)"
  else
    echo "  ⬇  $MODEL"
    curl -s -o "$MODEL_DIR/$MODEL" "$BASE_URL/$MODEL"
    if [ $? -eq 0 ]; then
      echo "    ✅ Downloaded"
    else
      echo "    ❌ Failed to download $MODEL"
    fi
  fi
done

echo ""
echo "✅ All models downloaded to $MODEL_DIR"
echo "   You can now start the frontend."
