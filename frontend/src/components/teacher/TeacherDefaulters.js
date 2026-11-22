import React, { useState, useEffect } from 'react';
import { classService, attendanceService } from '../../services/api.service';
import toast from 'react-hot-toast';

const TeacherDefaulters = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classService.getAll()
      .then(res => setClasses(res.data.classes || []))
      .catch(err => toast.error('Failed to load classes'));
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setDefaulters([]);
      return;
    }

    setLoading(true);
    
    // Fetch class details (for student info) and attendance records
    Promise.all([
      classService.getById(selectedClassId),
      attendanceService.getByClass(selectedClassId)
    ])
    .then(([classRes, attRes]) => {
      const students = classRes.data.class?.students || [];
      const records = attRes.data.records || [];
      
      // Calculate total unique sessions
      const uniqueDates = new Set(records.map(r => r.dateString));
      const totalSessions = uniqueDates.size;
      
      if (totalSessions === 0) {
        setDefaulters([]);
        return;
      }
      
      // Group attendance by student
      const attendanceMap = {};
      records.forEach(r => {
        const sid = r.studentId._id || r.studentId;
        if (!attendanceMap[sid]) attendanceMap[sid] = 0;
        if (r.status === 'present') {
          attendanceMap[sid] += 1;
        }
      });
      
      // Calculate percentage and filter
      const defaulterList = students.map(student => {
        const sid = student._id;
        const presentCount = attendanceMap[sid] || 0;
        const percentage = Math.round((presentCount / totalSessions) * 100);
        return {
          ...student,
          presentCount,
          totalSessions,
          percentage
        };
      }).filter(s => s.percentage < 75);
      
      setDefaulters(defaulterList);
    })
    .catch(err => {
      toast.error('Failed to calculate defaulters');
    })
    .finally(() => setLoading(false));

  }, [selectedClassId]);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      <h2 className="text-gradient-accent" style={{ marginBottom: '1.5rem' }}>⚠️ Defaulter Students (&lt; 75% Attendance)</h2>
      
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
          Defaulters {selectedClassId && defaulters.length > 0 && <span className="badge badge-danger">{defaulters.length}</span>}
        </h3>
        
        {!selectedClassId && <p>Please select a class to view defaulters.</p>}
        {selectedClassId && loading && <p>Calculating attendance...</p>}
        {selectedClassId && !loading && defaulters.length === 0 && <p>No defaulters found in this class! Everyone has &gt;= 75% attendance.</p>}
        
        {selectedClassId && !loading && defaulters.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Attendance %</th>
                  <th>Present / Total</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map(s => (
                  <tr key={s._id}>
                    <td>{s.rollNumber}</td>
                    <td>{s.userId?.name}</td>
                    <td><span className="badge badge-danger">{s.percentage}%</span></td>
                    <td><span className="badge badge-warning">{s.presentCount} / {s.totalSessions}</span></td>
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

export default TeacherDefaulters;
