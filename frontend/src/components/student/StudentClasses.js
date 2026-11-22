import React, { useState, useEffect } from 'react';
import { classService } from '../../services/api.service';
import toast from 'react-hot-toast';

const StudentClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classService.getMy()
      .then(res => setClasses(res.data.classes || []))
      .catch(err => toast.error('Failed to load enrolled classes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>📚 My Enrolled Classes</h2>
      
      {loading ? (
        <p className="text-muted">Loading classes...</p>
      ) : classes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <p>You are not enrolled in any classes yet.</p>
          <p className="text-muted">Go to Dashboard or Classrooms to join a class using a Join Code.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {classes.map(c => (
            <div key={c._id} className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{c.name}</h3>
              <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Subject:</strong> {c.subject}</p>
              <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Teacher:</strong> {c.teacher?.name}</p>
              <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Dept:</strong> {c.department}</p>
              <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                Semester: {c.semester} | Div: {c.division || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentClasses;
