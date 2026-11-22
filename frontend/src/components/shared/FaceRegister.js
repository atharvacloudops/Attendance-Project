import React, { useState, useCallback, useEffect } from 'react';
import { useFaceRecognition } from '../../hooks/useFaceRecognition';
import { studentService }     from '../../services/api.service';
import { useAuth }            from '../../context/AuthContext';
import toast                  from 'react-hot-toast';
import Button                 from './Button';

const SAMPLE_COUNT = 3;

const FaceRegister = ({ onSuccess, onCancel }) => {
  const { updateStudentProfile } = useAuth();
  const [phase,     setPhase]     = useState('idle');
  const [errorMsg,  setErrorMsg]  = useState('');
  const [captured,  setCaptured]  = useState(0);
  const [countdown, setCountdown] = useState(3);

  const {
    modelsLoaded, modelError,
    videoRef, canvasRef,
    faceGuidance,
    startCamera, stopCamera,
    captureMultipleSamples,
  } = useFaceRecognition();

  // Auto-proceed once models load
  useEffect(() => {
    if (phase === 'waitModels' && modelsLoaded) openCamera();
  }, [modelsLoaded, phase]); // eslint-disable-line

  const openCamera = useCallback(async () => {
    try {
      setPhase('camera');
      setErrorMsg('');
      await startCamera();
      console.log('Camera opened. videoRef:', videoRef.current?.videoWidth);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  }, [startCamera, videoRef]);

  const handleOpenClick = () => {
    if (!modelsLoaded) setPhase('waitModels');
    else openCamera();
  };

  // ── Countdown using setTimeout (NOT setInterval — avoids closure/ref issues) ──
  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);

    const tick = (n) => {
      setCountdown(n);
      if (n <= 0) {
        doCapture();
      } else {
        setTimeout(() => tick(n - 1), 1000);
      }
    };
    setTimeout(() => tick(2), 1000); // start at 3 (already set), go to 2, 1, 0
  }, []); // eslint-disable-line

  const doCapture = useCallback(async () => {
    try {
      setPhase('capturing');
      setCaptured(0);

      console.log('=== doCapture started ===');
      console.log('videoRef.current:', videoRef.current);
      console.log('videoRef dimensions:', videoRef.current?.videoWidth, videoRef.current?.videoHeight);
      console.log('videoRef readyState:', videoRef.current?.readyState);
      console.log('modelsLoaded:', modelsLoaded);

      const avgDescriptor = await captureMultipleSamples(SAMPLE_COUNT, (done) => {
        setCaptured(done);
      });

      console.log('captureMultipleSamples result:', avgDescriptor ? `Array[${avgDescriptor.length}]` : null);

      if (!avgDescriptor || avgDescriptor.length !== 128) {
        throw new Error(
          'Face could not be captured. Please check:\n' +
          '• You are in a well-lit room\n' +
          '• Your face is clearly visible\n' +
          '• You are looking at the camera'
        );
      }

      setPhase('saving');
      const res = await studentService.registerFaceJSON({ faceDescriptor: avgDescriptor });
      updateStudentProfile(res.data.student);
      stopCamera();
      setPhase('done');
      toast.success('Face registered successfully! 🎉');
      onSuccess && onSuccess(res.data.student);

    } catch (err) {
      console.error('doCapture error:', err);
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setErrorMsg(msg);
      setPhase('error');
      toast.error('Face registration failed');
    }
  }, [captureMultipleSamples, stopCamera, updateStudentProfile, onSuccess, videoRef, modelsLoaded]);

  const handleRetry = () => {
    stopCamera();
    setPhase('idle');
    setErrorMsg('');
    setCaptured(0);
    setCountdown(3);
  };

  const cameraActive = ['camera', 'countdown', 'capturing'].includes(phase);

  const borderColor =
    faceGuidance?.status === 'ok'      ? '#10b981' :
    faceGuidance?.status === 'warning' ? '#f59e0b' :
    faceGuidance?.status === 'error'   ? '#ef4444' : '#3b82f6';

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      maxWidth: 640, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🔐</span>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Register Your Face</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              One-time setup · {SAMPLE_COUNT} samples needed
            </p>
          </div>
        </div>
        {onCancel && (
          <button onClick={onCancel} style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer',
          }}>✕</button>
        )}
      </div>

      {modelError && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.82rem' }}>
          ⚠ {modelError}
        </div>
      )}

      {/* Idle */}
      {phase === 'idle' && (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'var(--accent-glow)', border: '2px dashed var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem', margin: '0 auto 1.5rem',
          }}>🤳</div>
          <h4 style={{ marginBottom: '0.5rem' }}>Set Up Face Recognition</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 380, margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
            Sit in a <strong>well-lit area</strong>, look directly at the camera, and click <strong>Open Camera</strong>.
          </p>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1rem', maxWidth: 300, margin: '0 auto',
            textAlign: 'left',
          }}>
            {['💡 Good lighting (face the light source)', '👁 Look straight at camera lens', '😐 Neutral expression', '🚫 Remove glasses if possible'].map(t => (
              <p key={t} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{t}</p>
            ))}
          </div>
        </div>
      )}

      {/* Waiting for models */}
      {phase === 'waitModels' && (
        <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
          <p style={{ fontWeight: 600 }}>Loading face recognition engine...</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Only happens once — 10–30 seconds</p>
        </div>
      )}

      {/* Camera view */}
      {cameraActive && (
        <div style={{ position: 'relative', background: '#000' }}>
          {/* THE VIDEO ELEMENT — this is critical */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'cover' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />

          {/* Rectangle guide */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 260, height: 320,
              border: `3px solid ${borderColor}`,
              borderRadius: '12px',
              boxShadow: `0 0 0 2000px rgba(0,0,0,0.5), 0 0 30px ${borderColor}66`,
              transition: 'border-color 0.3s, box-shadow 0.3s',
              position: 'relative',
            }}>
              {[
                { top: -3, left: -3, borderTop: `5px solid ${borderColor}`, borderLeft: `5px solid ${borderColor}`, borderRadius: '10px 0 0 0' },
                { top: -3, right: -3, borderTop: `5px solid ${borderColor}`, borderRight: `5px solid ${borderColor}`, borderRadius: '0 10px 0 0' },
                { bottom: -3, left: -3, borderBottom: `5px solid ${borderColor}`, borderLeft: `5px solid ${borderColor}`, borderRadius: '0 0 0 10px' },
                { bottom: -3, right: -3, borderBottom: `5px solid ${borderColor}`, borderRight: `5px solid ${borderColor}`, borderRadius: '0 0 10px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s }} />
              ))}
            </div>
          </div>

          {/* Countdown */}
          {phase === 'countdown' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{
                fontSize: '8rem', fontWeight: 900, color: 'white',
                fontFamily: 'var(--font-display)',
                textShadow: `0 0 60px ${borderColor}`,
                lineHeight: 1,
              }}>{countdown}</span>
            </div>
          )}

          {/* Status bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.85)', padding: '0.7rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: borderColor, animation: 'pulseDot 1.2s ease infinite',
            }} />
            <span style={{ color: 'white', fontSize: '0.85rem', flex: 1 }}>
              {phase === 'countdown'  && `Hold still... ${countdown}`}
              {phase === 'capturing'  && `Capturing ${captured} of ${SAMPLE_COUNT} samples...`}
              {phase === 'camera'     && (faceGuidance?.message || '📷 Centre your face in the rectangle then click Capture')}
            </span>
            {phase === 'capturing' && (
              <div style={{ width: 80, height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: borderColor,
                  width: `${(captured / SAMPLE_COUNT) * 100}%`, transition: 'width 0.3s ease',
                }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saving */}
      {phase === 'saving' && (
        <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
          <p style={{ fontWeight: 600 }}>Saving your face data...</p>
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '3.5rem' }}>✅</div>
          <h3 style={{ color: 'var(--success)' }}>Face Registered!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 300 }}>
            You can now mark attendance using face recognition.
          </p>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>❌</div>
          <p style={{ color: 'var(--danger)', fontWeight: 600, maxWidth: 400, whiteSpace: 'pre-line' }}>{errorMsg}</p>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1rem',
            maxWidth: 400, width: '100%', textAlign: 'left',
          }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--warning)' }}>Try these fixes:</p>
            {[
              '1. Turn on more lights or open window blinds',
              '2. Move the camera to eye level',
              '3. Look directly at the camera lens (not the screen)',
              '4. Remove glasses, hat, or anything covering your face',
              '5. Make sure nothing is blocking the camera',
            ].map(t => (
              <p key={t} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{t}</p>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{
        padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
      }}>
        {phase === 'idle' && (
          <>
            {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
            <Button variant="primary" onClick={handleOpenClick}>📷 Open Camera</Button>
          </>
        )}
        {phase === 'waitModels' && (
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        )}
        {phase === 'camera' && (
          <>
            <Button variant="secondary" onClick={handleRetry}>← Back</Button>
            <Button variant="success" onClick={startCountdown}>📸 Capture Face</Button>
          </>
        )}
        {['countdown', 'capturing', 'saving'].includes(phase) && (
          <Button variant="ghost" disabled>Please wait...</Button>
        )}
        {phase === 'error' && (
          <>
            {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
            <Button variant="primary" onClick={handleRetry}>🔄 Try Again</Button>
          </>
        )}
        {phase === 'done' && (
          <Button variant="success" onClick={onCancel || (() => {})}>✓ Done</Button>
        )}
      </div>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
      `}</style>
    </div>
  );
};

export default FaceRegister;