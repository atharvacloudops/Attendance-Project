import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as faceapi from 'face-api.js';

// Load face-api models ONCE at app startup — before anything else renders
// This guarantees models are available to ALL components
const MODEL_URL = '/models';

const loadModels = async () => {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    console.log('✅ face-api models loaded globally');
  } catch (err) {
    console.error('❌ Failed to load face-api models:', err);
    console.error('Run: node scripts/download-models.js');
  }
};

// Load models then render app
loadModels().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});