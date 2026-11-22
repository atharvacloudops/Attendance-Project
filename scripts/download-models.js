/**
 * download-models.js
 * Cross-platform Node.js script to download face-api.js model weights
 * Run: node scripts/download-models.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(__dirname, '..', 'frontend', 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const MODELS = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  // Face Landmark 68
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  // Face Recognition Net
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  // Face Expression Net
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  ✓ ${path.basename(dest)} (exists, skipped)`);
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`  ✅ ${path.basename(dest)}`);
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });

async function main() {
  console.log('\n📦 face-api.js Model Downloader');
  console.log('================================\n');

  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
    console.log(`📁 Created: ${MODEL_DIR}\n`);
  }

  let ok = 0;
  let fail = 0;

  for (const model of MODELS) {
    const url = `${BASE_URL}/${model}`;
    const dest = path.join(MODEL_DIR, model);
    try {
      await download(url, dest);
      ok++;
    } catch (err) {
      console.error(`  ❌ Failed: ${model} — ${err.message}`);
      fail++;
    }
  }

  console.log(`\n✅ Done: ${ok} downloaded, ${fail} failed`);
  if (fail > 0) {
    console.log('\n⚠️  Some models failed. Try running the script again.');
    process.exit(1);
  } else {
    console.log('\n🎉 All models ready! Start your frontend now.\n');
  }
}

main();
