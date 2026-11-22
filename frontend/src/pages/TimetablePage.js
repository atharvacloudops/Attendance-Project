import React, { useEffect, useState } from 'react';
import StudentTimetable from '../components/student/StudentTimetable';
import TimetableManager from '../components/admin/TimetableManager';
import Layout           from '../components/shared/Layout';
import { userService, classService } from '../services/api.service';

// ── Student timetable page ──────────────────────────────────────────────────
export const StudentTimetablePage = () => (
  <Layout>
    <StudentTimetable />
  </Layout>
);

// ── Admin timetable management page ────────────────────────────────────────
export const AdminTimetablePage = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes,  setClasses]  = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          userService.getAll({ role: 'teacher' }),
          classService.getAll(),
        ]);
        setTeachers(tRes.data.users  || []);
        setClasses(cRes.data.classes || []);
      } catch (e) {
        console.error('Failed to load teachers/classes', e);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <TimetableManager teachers={teachers} classes={classes} />
    </Layout>
  );
};