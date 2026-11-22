/**
 * useFaceRecognition.js
 * Models are loaded globally in index.js — this hook just uses them.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const MATCH_THRESHOLD = 0.6;

// Check real model state — never trust React useState for this
const areModelsLoaded = () =>
  faceapi.nets.tinyFaceDetector.isLoaded &&
  faceapi.nets.faceLandmark68Net.isLoaded &&
  faceapi.nets.faceRecognitionNet.isLoaded;

export const useFaceRecognition = () => {
  const [isDetecting,     setIsDetecting]     = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [faceGuidance,    setFaceGuidance]    = useState(null);

  // Expose these for components that check loading state
  const modelsLoaded = areModelsLoaded();
  const modelError   = null;

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => () => stopCamera(), []); // eslint-disable-line

  // ── Wait for models (polls faceapi directly, not React state) ────────────────
  const waitForModels = async (timeoutMs = 30000) => {
    if (areModelsLoaded()) return true;
    console.log('Waiting for models to load...');
    const deadline = Date.now() + timeoutMs;
    while (!areModelsLoaded() && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 300));
    }
    const loaded = areModelsLoaded();
    console.log('Models loaded:', loaded);
    return loaded;
  };

  // ── Start camera ──────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      }).catch(() =>
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      );

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Video element not mounted yet');

      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => video.play().then(resolve).catch(resolve);
        setTimeout(resolve, 4000);
      });

      // Let camera auto-exposure settle
      await new Promise(r => setTimeout(r, 1200));

      console.log('Camera ready:', video.videoWidth, 'x', video.videoHeight);
      return true;
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError' ? 'Camera permission denied. Allow camera in browser settings.' :
        err.name === 'NotFoundError'   ? 'No camera found. Connect a webcam.' :
        `Camera error: ${err.message}`;
      throw new Error(msg);
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current)   { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)    videoRef.current.srcObject = null;
    setIsDetecting(false);
    setFaceGuidance(null);
  }, []);

  // ── Detect one face, return descriptor ────────────────────────────────────────
  const detectOnce = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return null;
    if (!areModelsLoaded()) return null;

    try {
      const result = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 160,
          scoreThreshold: 0.1,
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (result?.descriptor) {
        setFaceGuidance({ status: 'ok', message: '✅ Face detected!' });
        return Array.from(result.descriptor);
      }
      setFaceGuidance({ status: 'error', message: '👤 No face — look at camera' });
      return null;
    } catch (err) {
      console.error('detectOnce error:', err);
      return null;
    }
  }, []);

  // ── Capture with retries ──────────────────────────────────────────────────────
  const captureDescriptor = useCallback(async (timeoutMs = 15000) => {
    // Wait for models first
    const ok = await waitForModels(20000);
    if (!ok) { console.error('Models not loaded'); return null; }

    const video = videoRef.current;
    if (!video) return null;

    // Wait for video to be ready
    const readyDeadline = Date.now() + 5000;
    while (Date.now() < readyDeadline) {
      if (video.readyState >= 2 && video.videoWidth > 0 && !video.paused) break;
      if (video.paused && video.srcObject) {
        try { await video.play(); } catch(e) { /* ignore */ }
      }
      await new Promise(r => setTimeout(r, 300));
    }

    const deadline = Date.now() + timeoutMs;
    let attempt = 0;
    while (Date.now() < deadline) {
      attempt++;
      const desc = await detectOnce();
      if (desc?.length === 128) {
        console.log(`✅ Captured on attempt ${attempt}`);
        return desc;
      }
      await new Promise(r => setTimeout(r, 600));
    }
    console.warn(`Timed out after ${attempt} attempts`);
    return null;
  }, [detectOnce]); // eslint-disable-line

  // ── Multi-sample enrollment capture ──────────────────────────────────────────
  const captureMultipleSamples = useCallback(async (count = 3, onProgress) => {
    const ok = await waitForModels(20000);
    if (!ok) return null;

    const descriptors = [];
    await new Promise(r => setTimeout(r, 600));

    for (let i = 0; i < count; i++) {
      setFaceGuidance({ status: 'warning', message: `📸 Sample ${i + 1} of ${count}...` });
      console.log(`=== Sample ${i + 1}/${count} ===`);

      const d = await captureDescriptor(12000);
      if (d?.length === 128) {
        descriptors.push(d);
        onProgress?.(descriptors.length, count);
        console.log(`Sample ${descriptors.length}/${count} OK`);
      } else {
        console.warn(`Sample ${i + 1} failed`);
      }
      await new Promise(r => setTimeout(r, 400));
    }

    console.log(`Captured ${descriptors.length}/${count} total`);
    if (descriptors.length === 0) return null;

    // Average all samples
    return Array.from({ length: 128 }, (_, idx) =>
      descriptors.reduce((sum, d) => sum + d[idx], 0) / descriptors.length
    );
  }, [captureDescriptor]); // eslint-disable-line

  // ── Continuous recognition for attendance ────────────────────────────────────
  const startRecognition = useCallback(async (storedDescriptors, onMatch) => {
    const ok = await waitForModels(20000);
    if (!ok || !videoRef.current) return;

    setIsDetecting(true);
    setDetectionResult(null);

    const labeled = storedDescriptors.map(s =>
      new faceapi.LabeledFaceDescriptors(s.studentId, [new Float32Array(s.descriptor)])
    );
    if (!labeled.length) {
      setDetectionResult({ error: 'No registered faces found.' });
      setIsDetecting(false);
      return;
    }

    const matcher = new faceapi.FaceMatcher(labeled, MATCH_THRESHOLD);

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 });
        const detections = await faceapi
          .detectAllFaces(video, opts)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (canvasRef.current && video.videoWidth) {
          const dims    = faceapi.matchDimensions(canvasRef.current, video, true);
          const resized = faceapi.resizeResults(detections, dims);
          const ctx     = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resized);
        }

        if (!detections.length) {
          setFaceGuidance({ status: 'error', message: '👤 No face detected' });
          return;
        }
        setFaceGuidance({ status: 'ok', message: '✅ Scanning...' });

        for (const det of detections) {
          const best = matcher.findBestMatch(det.descriptor);
          if (best.label !== 'unknown') {
            const matched = storedDescriptors.find(s => s.studentId === best.label);
            if (matched) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              setIsDetecting(false);
              const result = {
                studentId:  matched.studentId,
                userId:     matched.userId,
                name:       matched.name,
                rollNumber: matched.rollNumber,
                confidence: 1 - best.distance,
                distance:   best.distance,
              };
              setDetectionResult(result);
              onMatch?.(result);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Recognition loop error:', err);
      }
    }, 700);
  }, []); // eslint-disable-line

  const stopRecognition = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsDetecting(false);
  }, []);

  return {
    modelsLoaded, modelError,
    isDetecting, detectionResult,
    faceGuidance,
    videoRef, canvasRef,
    startCamera, stopCamera,
    startRecognition, stopRecognition,
    captureDescriptor, captureMultipleSamples,
    detectOnce,
    setDetectionResult,
  };
};