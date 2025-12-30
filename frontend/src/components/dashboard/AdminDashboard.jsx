import React from 'react';
import CollegeAdminDashboard from '../college/CollegeAdminDashboard';

const AdminDashboard = ({ institution, onLogout, onBack }) => {
  // Admin dashboard uses CollegeAdminDashboard which has:
  // Separate sidebar with: Overview, Branding, Announcements, Students, Teachers, Academic Structure, Invite People
  return (
    <CollegeAdminDashboard
      institution={institution}
      onLogout={onLogout}
      onBack={onBack}
    />
  );
};

export default AdminDashboard;
