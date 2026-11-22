import React, { useState, useEffect } from 'react';
import { classService, studyMaterialService } from '../../services/api.service';
import toast from 'react-hot-toast';

const StudentStudyMaterial = () => {
  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classService.getMy()
      .then(res => setClasses(res.data.classes || []))
      .catch(err => toast.error('Failed to load enrolled classes'));
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setLoading(true);
      studyMaterialService.getByClass(selectedClass)
        .then(res => setMaterials(res.data.materials || []))
        .catch(err => toast.error('Failed to load materials'))
        .finally(() => setLoading(false));
    } else {
      setMaterials([]);
    }
  }, [selectedClass]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="fade-in">
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>📚 Subjects / Study Material</h2>
      
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <select 
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', width: '100%', maxWidth: '400px' }}
        >
          <option value="">-- Select a subject to view materials --</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name} - {c.subject}</option>)}
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Available Materials {selectedClass && materials.length > 0 && <span className="badge badge-accent">{materials.length}</span>}
        </h3>
        {!selectedClass && <p className="text-muted">Please select a subject to view materials.</p>}
        {selectedClass && loading && <p className="text-muted">Loading materials...</p>}
        {selectedClass && !loading && materials.length === 0 && <p className="text-muted">No materials found for this subject.</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {materials.map(m => (
            <div key={m._id} className="glass-panel glass-panel-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{m.title}</h4>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>{m.description}</p>
                <small className="text-muted">Uploaded by: {m.uploadedBy?.name || 'Teacher'} on {new Date(m.createdAt).toLocaleDateString()}</small>
              </div>
              <div>
                <a href={process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') + m.fileUrl : `http://localhost:5000${m.fileUrl}`} target="_blank" rel="noreferrer" className="badge badge-accent hover-lift">Download PDF</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentStudyMaterial;
