import React, { useState } from 'react';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';

const Dashboard = () => {
  const [userRole] = useState('admin'); // Change to 'teacher' or 'admin' to test

  const renderDashboard = () => {
    switch (userRole) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderDashboard()}</div>;
};

export default Dashboard;
