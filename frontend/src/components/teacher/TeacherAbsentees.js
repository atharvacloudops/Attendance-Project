import React, { useState, useEffect } from 'react';
import { classService, attendanceService } from '../../services/api.service';
import toast from 'react-hot-toast';

const TeacherAbsentees = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [absentees, setAbsentees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classService.getAll()
      .then(res => setClasses(res.data.classes || []))
      .catch(err => toast.error('Failed to load classes'));
  }, []);

  useEffect(() => {
    if (!selectedClassId || !selectedDate) {
      setAbsentees([]);
      return;
    }

    setLoading(true);
    
    // Fetch class details and attendance for the specific date
    Promise.all([
      classService.getById(selectedClassId),
      attendanceService.getByClass(selectedClassId, { dateString: selectedDate })
    ])
    .then(([classRes, attRes]) => {
      const students = classRes.data.class?.students || [];
      const records = attRes.data.records || []; // Records could be filtered by API if backend supports dateString param, else we filter here.
      
      // Filter records for the selected date (in case API doesn't filter perfectly)
      const dateRecords = records.filter(r => r.dateString === selectedDate);
      
      // Find students who are present or late
      const presentStudentIds = new Set(
        dateRecords
          .filter(r => r.status === 'present' || r.status === 'late')
          .map(r => (r.studentId._id ? r.studentId._id.toString() : r.studentId.toString()))
      );
      
      // Absentees are students NOT in the present set
      const absenteeList = students.filter(s => !presentStudentIds.has(s._id.toString()));
      setAbsentees(absenteeList);
    })
    .catch(err => {
      toast.error('Failed to calculate absentees');
    })
    .finally(() => setLoading(false));

  }, [selectedClassId, selectedDate]);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }} className="fade-in">
      <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>❌ Absent Students</h2>
      
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <select 
          value={selectedClassId} 
          onChange={e => setSelectedClassId(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', flex: 1, minWidth: '200px' }}
        >
          <option value="">-- Select Class --</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name} - {c.subject}</option>)}
        </select>
        
        <input 
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px' }}
        />
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Absentees on {selectedDate} {selectedClassId && absentees.length > 0 && <span className="badge badge-danger">{absentees.length}</span>}
        </h3>
        
        {!selectedClassId && <p>Please select a class and date to view absentees.</p>}
        {selectedClassId && loading && <p>Fetching attendance...</p>}
        {selectedClassId && !loading && absentees.length === 0 && <p>No absentees! Everyone was present.</p>}
        
        {selectedClassId && !loading && absentees.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {absentees.map(s => (
                  <tr key={s._id}>
                    <td>{s.rollNumber}</td>
                    <td>{s.userId?.name}</td>
                    <td><span className="badge badge-danger">Absent</span></td>
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

export default TeacherAbsentees;
