import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentDashboard from '../components/dashboard/StudentDashboard';
import TeacherDashboard from '../components/dashboard/TeacherDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';

const Dashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user info from localStorage
    const userString = localStorage.getItem('user');
    
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      // No user data found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const renderDashboard = () => {
    if (!userRole) {
      return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>;
    }

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
