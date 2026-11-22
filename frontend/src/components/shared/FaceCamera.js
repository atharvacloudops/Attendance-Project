import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { studentService, attendanceService } from '../../services/api.service';
import toast from 'react-hot-toast';
import Button from './Button';

// Always use direct faceapi check — never rely on React state for model status
const modelsReady = () => faceapi.nets.tinyFaceDetector.isLoaded;

const MATCH_THRESHOLD = 0.6;
const SCAN_TIMEOUT_S  = 45;

const FaceCamera = ({ classId, onSuccess, onCancel, onManualFallback }) => {
  const [phase,          setPhase]          = useState('init'); // init|scanning|matched|done|error
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [errorMsg,       setErrorMsg]       = useState('');
  const [marking,        setMarking]        = useState(false);
  const [elapsed,        setElapsed]        = useState(0);
  const [statusMsg,      setStatusMsg]      = useState('Starting camera...');

  // Refs — never lose these across renders
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);
  const timerRef    = useRef(null);
  const matchedRef  = useRef(false); // prevent double-match

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []); // eslint-disable-line

  const stopAll = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timerRef.current)    { clearInterval(timerRef.current);    timerRef.current    = null; }
    if (streamRef.current)   {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // ── Main flow — starts when video element is ready ────────────────────────────
  const startFlow = useCallback(async () => {
    try {
      setStatusMsg('Starting camera...');

      // 1. Start camera stream
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element not available');

      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => video.play().then(resolve).catch(resolve);
        setTimeout(resolve, 4000);
      });

      await new Promise(r => setTimeout(r, 1000)); // let camera settle

      // 2. Wait for face-api models
      setStatusMsg('Loading face recognition...');
      const modelDeadline = Date.now() + 20000;
      while (!modelsReady() && Date.now() < modelDeadline) {
        await new Promise(r => setTimeout(r, 400));
      }
      if (!modelsReady()) throw new Error('Face recognition models failed to load. Run: node scripts/download-models.js');

      // 3. Load all registered face descriptors from server
      setStatusMsg('Loading registered faces...');
      const res = await studentService.getAllDescriptors();
      const descriptors = res.data.descriptors || [];
      if (!descriptors.length) {
        throw new Error('No registered faces found. Students must register their face first.');
      }

      // 4. Build matcher
      const labeled = descriptors.map(s =>
        new faceapi.LabeledFaceDescriptors(s.studentId, [new Float32Array(s.descriptor)])
      );
      const matcher = new faceapi.FaceMatcher(labeled, MATCH_THRESHOLD);

      // 5. Start scanning
      setPhase('scanning');
      setStatusMsg('Look at the camera...');
      matchedRef.current = false;

      // Elapsed timer
      let secs = 0;
      timerRef.current = setInterval(() => {
        secs++;
        setElapsed(secs);
        if (secs >= SCAN_TIMEOUT_S) {
          clearInterval(timerRef.current);
          clearInterval(intervalRef.current);
          setPhase('error');
          setErrorMsg('Face not recognised within 45 seconds. Please try again or use manual attendance.');
          stopAll();
        }
      }, 1000);

      // Detection loop
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 });

      intervalRef.current = setInterval(async () => {
        if (matchedRef.current) return;
        const v = videoRef.current;
        if (!v || v.readyState < 2) return;

        try {
          const detections = await faceapi
            .detectAllFaces(v, opts)
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (!detections.length) {
            setStatusMsg('👤 No face detected — look at the camera');
            return;
          }

          setStatusMsg('✅ Face detected — matching...');

          for (const det of detections) {
            const best = matcher.findBestMatch(det.descriptor);
            console.log('Best match:', best.label, 'distance:', best.distance.toFixed(3));

            if (best.label !== 'unknown' && !matchedRef.current) {
              const matched = descriptors.find(s => s.studentId === best.label);
              if (matched) {
                matchedRef.current = true;
                clearInterval(intervalRef.current);
                clearInterval(timerRef.current);
                intervalRef.current = null;
                timerRef.current    = null;

                const result = {
                  studentId:  matched.studentId,
                  userId:     matched.userId,
                  name:       matched.name,
                  rollNumber: matched.rollNumber,
                  confidence: Math.round((1 - best.distance) * 100),
                };
                setMatchedStudent(result);
                setPhase('matched');
                return;
              }
            }
          }
        } catch (err) {
          console.error('Detection error:', err);
        }
      }, 700);

    } catch (err) {
      console.error('FaceCamera startFlow error:', err);
      setErrorMsg(err.message || 'Failed to start camera');
      setPhase('error');
      stopAll();
    }
  }, []); // eslint-disable-line

  // ── Trigger startFlow once video element is mounted ───────────────────────────
  // We use a callback ref pattern — fires when the <video> element mounts
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && phase === 'init') {
      // Small delay so React finishes rendering
      setTimeout(() => startFlow(), 100);
    }
  }, [phase, startFlow]);

  // ── Confirm and save attendance ───────────────────────────────────────────────
  const handleMark = async () => {
    if (!matchedStudent) return;
    try {
      setMarking(true);
      await attendanceService.mark({
        studentId:  matchedStudent.studentId,
        classId:    classId || undefined,
        confidence: matchedStudent.confidence / 100,
        method:     'face_recognition',
      });
      stopAll();
      setPhase('done');
      toast.success(`✅ Attendance marked for ${matchedStudent.name}`);
      onSuccess && onSuccess(matchedStudent);
    } catch (err) {
      if (err.response?.status === 409) {
        toast('Attendance already marked for today ✓', { icon: 'ℹ️' });
        stopAll();
        setPhase('done');
        onSuccess && onSuccess(matchedStudent);
      } else {
        toast.error(err.response?.data?.message || 'Failed to mark attendance');
        setErrorMsg(err.response?.data?.message || 'Failed to mark attendance');
        setPhase('error');
      }
    } finally {
      setMarking(false);
    }
  };

  const handleRetry = () => {
    stopAll();
    matchedRef.current = false;
    setPhase('init');
    setMatchedStudent(null);
    setErrorMsg('');
    setElapsed(0);
    setStatusMsg('Starting camera...');
  };

  const handleCancel = () => {
    stopAll();
    onCancel && onCancel();
  };

  const confColor =
    matchedStudent?.confidence >= 75 ? 'var(--success)' :
    matchedStudent?.confidence >= 55 ? 'var(--warning)' : 'var(--danger)';

  const showCamera = ['init', 'scanning', 'matched'].includes(phase);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      maxWidth: 700, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📸</span>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Face Recognition Attendance</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {phase === 'init'    && statusMsg}
              {phase === 'scanning'&& `Scanning... ${elapsed}s — ${statusMsg}`}
              {phase === 'matched' && 'Face matched! Confirm to record'}
              {phase === 'done'    && 'Attendance recorded ✓'}
              {phase === 'error'   && 'Recognition failed'}
            </p>
          </div>
        </div>
        <button onClick={handleCancel} style={{
          background: 'var(--bg-hover)', border: '1px solid var(--border)',
          color: 'var(--text-muted)', width: 28, height: 28, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '0.9rem',
        }}>✕</button>
      </div>

      {/* ── Video element — ALWAYS rendered so ref is available ── */}
      <div style={{
        position: 'relative', background: '#000',
        // Hide until scanning starts — but keep in DOM
        display: showCamera ? 'block' : 'none',
      }}>
        <video
          ref={setVideoRef}
          autoPlay muted playsInline
          style={{ width: '100%', display: 'block', maxHeight: 380, objectFit: 'cover' }}
        />

        {/* Rectangle scan guide */}
        {phase === 'scanning' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 260, height: 320,
              border: '3px solid #3b82f6',
              borderRadius: '12px',
              boxShadow: '0 0 0 2000px rgba(0,0,0,0.4), 0 0 24px rgba(59,130,246,0.5)',
              position: 'relative',
            }}>
              {[
                { top:-3, left:-3,  borderTop:'5px solid #3b82f6', borderLeft:'5px solid #3b82f6',  borderRadius:'10px 0 0 0' },
                { top:-3, right:-3, borderTop:'5px solid #3b82f6', borderRight:'5px solid #3b82f6', borderRadius:'0 10px 0 0' },
                { bottom:-3, left:-3,  borderBottom:'5px solid #3b82f6', borderLeft:'5px solid #3b82f6',  borderRadius:'0 0 0 10px' },
                { bottom:-3, right:-3, borderBottom:'5px solid #3b82f6', borderRight:'5px solid #3b82f6', borderRadius:'0 0 10px 0' },
              ].map((s,i) => <div key={i} style={{ position:'absolute', width:32, height:32, ...s }} />)}
            </div>
          </div>
        )}

        {/* Timeout progress bar */}
        {phase === 'scanning' && (
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'rgba(255,255,255,0.1)' }}>
            <div style={{
              height:'100%',
              background: elapsed < 20 ? '#3b82f6' : elapsed < 35 ? '#f59e0b' : '#ef4444',
              width: `${(elapsed / SCAN_TIMEOUT_S) * 100}%`,
              transition: 'width 1s linear, background 0.5s',
            }} />
          </div>
        )}

        {/* Loading overlay on top of video */}
        {phase === 'init' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '1rem',
          }}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p style={{ color: 'white', fontSize: '0.875rem' }}>{statusMsg}</p>
          </div>
        )}

        {/* Status bar */}
        {['scanning', 'matched'].includes(phase) && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.82)', padding: '0.65rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: phase === 'matched' ? '#10b981' : '#3b82f6',
              animation: 'pulseDot 1.2s ease infinite',
            }} />
            <span style={{ color: 'white', fontSize: '0.82rem' }}>
              {phase === 'scanning' && statusMsg}
              {phase === 'matched'  && `✅ Matched: ${matchedStudent?.name}`}
            </span>
          </div>
        )}
      </div>

      {/* Match result card */}
      {phase === 'matched' && matchedStudent && (
        <div style={{
          padding: '1.1rem 1.5rem',
          background: 'rgba(16,185,129,0.08)',
          borderTop: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'rgba(16,185,129,0.2)', border: '2px solid rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.4rem', color: 'var(--success)',
          }}>
            {matchedStudent.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--success)' }}>
              {matchedStudent.name}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Roll: <strong>{matchedStudent.rollNumber}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: 90 }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Confidence
            </p>
            <p style={{ fontSize: '2.2rem', fontWeight: 900, color: confColor, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {matchedStudent.confidence}%
            </p>
          </div>
        </div>
      )}

      {/* Manual fallback after 15s */}
      {phase === 'scanning' && elapsed >= 15 && onManualFallback && (
        <div style={{
          padding: '0.75rem 1.5rem', background: 'var(--warning-bg)',
          borderTop: '1px solid rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--warning)', flex: 1 }}>
            Taking too long? Switch to manual attendance.
          </span>
          <Button variant="secondary" size="sm" onClick={onManualFallback}>Use Manual</Button>
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '3.5rem' }}>🎉</div>
          <h3 style={{ color: 'var(--success)' }}>Attendance Marked!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <strong>{matchedStudent?.name}</strong> — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Confidence: {matchedStudent?.confidence}%
          </p>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>❌</div>
          <p style={{ color: 'var(--danger)', fontWeight: 600, maxWidth: 400 }}>{errorMsg}</p>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '0.9rem 1.1rem',
            fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 400, width: '100%', textAlign: 'left',
          }}>
            <p style={{ fontWeight: 700, marginBottom: '0.4rem' }}>💡 Common fixes:</p>
            {[
              'Register your face first (if not done)',
              'Improve lighting — avoid sitting against a window',
              'Move closer or centred to the camera',
              'Re-register face in better lighting conditions',
            ].map(t => <p key={t} style={{ marginBottom: 3 }}>• {t}</p>)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap',
      }}>
        {phase === 'matched' && (
          <>
            <Button variant="secondary" onClick={handleRetry}>Retry Scan</Button>
            <Button variant="success" loading={marking} onClick={handleMark}
              style={{ boxShadow: '0 0 16px rgba(16,185,129,0.3)' }}>
              ✓ Confirm Attendance
            </Button>
          </>
        )}
        {phase === 'error' && (
          <>
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
            <Button variant="primary" onClick={handleRetry}>Try Again</Button>
          </>
        )}
        {phase === 'done' && (
          <Button variant="primary" onClick={handleCancel}>Close</Button>
        )}
        {['init', 'scanning'].includes(phase) && (
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
        )}
      </div>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
      `}</style>
    </div>
  );
};

export default FaceCamera;