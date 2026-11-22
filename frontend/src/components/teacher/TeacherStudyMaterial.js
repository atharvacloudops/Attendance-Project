import React, { useState, useEffect } from 'react';
import { classService, studyMaterialService } from '../../services/api.service';
import Button from '../shared/Button';
import toast from 'react-hot-toast';

const TeacherStudyMaterial = () => {
  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    classService.getAll()
      .then(res => setClasses(res.data.classes || []))
      .catch(err => toast.error('Failed to load classes'));
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedClass || !file || !formData.title) {
      toast.error('Please fill all required fields');
      return;
    }

    const data = new FormData();
    data.append('classId', selectedClass);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('file', file);

    try {
      await studyMaterialService.upload(data);
      toast.success('Material uploaded successfully');
      setFile(null);
      setFormData({ title: '', description: '' });
      // Refresh list
      const res = await studyMaterialService.getByClass(selectedClass);
      setMaterials(res.data.materials || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload material');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await studyMaterialService.delete(id);
      toast.success('Material deleted');
      setMaterials(materials.filter(m => m._id !== id));
    } catch (err) {
      toast.error('Failed to delete material');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="fade-in">
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>📚 Study Material Management</h2>
      
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3>Upload New Material</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px' }}
          >
            <option value="">-- Select Class --</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name} - {c.subject}</option>)}
          </select>

          <input 
            type="text" 
            placeholder="Title *" 
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px' }}
          />

          <textarea 
            placeholder="Description (Optional)" 
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            style={{ padding: '10px', borderRadius: '4px' }}
          />

          <input 
            type="file" 
            accept="application/pdf"
            onChange={e => setFile(e.target.files[0])}
            style={{ padding: '10px' }}
          />

          <Button type="submit" variant="primary">Upload Material</Button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Uploaded Materials {selectedClass && materials.length > 0 && <span className="badge badge-accent">{materials.length}</span>}
        </h3>
        {!selectedClass && <p className="text-muted">Please select a class to view materials.</p>}
        {selectedClass && loading && <p className="text-muted">Loading materials...</p>}
        {selectedClass && !loading && materials.length === 0 && <p className="text-muted">No materials found for this class.</p>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {materials.map(m => (
            <div key={m._id} className="glass-panel glass-panel-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{m.title}</h4>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', color: 'var(--text-secondary)' }}>{m.description}</p>
                <small className="text-muted">Uploaded: {new Date(m.createdAt).toLocaleDateString()}</small>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') + m.fileUrl : `http://localhost:5000${m.fileUrl}`} target="_blank" rel="noreferrer" className="badge badge-info hover-lift">View PDF</a>
                <button onClick={() => handleDelete(m._id)} className="badge badge-danger hover-lift" style={{ border: 'none', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudyMaterial;
