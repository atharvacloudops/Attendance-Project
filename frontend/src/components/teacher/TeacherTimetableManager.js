import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { classService } from '../../services/api.service';
import TimetableManager from '../admin/TimetableManager';
import toast from 'react-hot-toast';

const TeacherTimetableManager = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classService.getAll()
      .then(res => {
        setClasses(res.data.classes || []);
      })
      .catch(err => {
        toast.error('Failed to fetch classes');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading timetable setup...</div>;

  // The teacher can only assign themselves to their own classes
  const teachers = [user];

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <TimetableManager teachers={teachers} classes={classes} />
    </div>
  );
};

export default TeacherTimetableManager;
