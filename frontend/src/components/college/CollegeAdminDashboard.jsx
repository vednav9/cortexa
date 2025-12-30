// CollegeAdminDashboard.jsx
import React from "react";

const CollegeAdminDashboard = ({ institution, onLogout, onBack }) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {institution?.name || "College"} Admin Dashboard
      </h1>

      <button
        onClick={onBack}
        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        ← Back
      </button>
    </div>
  );
};

export default CollegeAdminDashboard;
