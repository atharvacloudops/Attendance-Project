import React, { useState, useEffect } from 'react';
import { classService } from '../../services/api.service';
import toast from 'react-hot-toast';

const TeacherStudentsList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classService.getAll()
      .then(res => setClasses(res.data.classes || []))
      .catch(err => toast.error('Failed to load classes'));
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      setLoading(true);
      classService.getById(selectedClassId)
        .then(res => {
          setStudents(res.data.class?.students || []);
        })
        .catch(err => toast.error('Failed to load students'))
        .finally(() => setLoading(false));
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>👥 All Students</h2>
      
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <select 
          value={selectedClassId} 
          onChange={e => setSelectedClassId(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', width: '100%', maxWidth: '400px' }}
        >
          <option value="">-- Select Class --</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name} - {c.subject}</option>)}
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Enrolled Students {selectedClassId && students.length > 0 && <span className="badge badge-accent">{students.length}</span>}
        </h3>
        
        {!selectedClassId && <p>Please select a class to view enrolled students.</p>}
        {selectedClassId && loading && <p>Loading students...</p>}
        {selectedClassId && !loading && students.length === 0 && <p>No students enrolled in this class.</p>}
        
        {selectedClassId && !loading && students.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Face Registered</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td>{s.rollNumber}</td>
                    <td>{s.userId?.name}</td>
                    <td>{s.userId?.email}</td>
                    <td>
                      {s.faceRegistered ? <span className="badge badge-success">Yes</span> : <span className="badge badge-danger">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStudentsList;
