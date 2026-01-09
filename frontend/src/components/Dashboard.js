import React from 'react';

const Dashboard = ({ user, onLogout }) => {
  return (
    <div className="dashboard">
      <div className="welcome-text">
        Welcome to VTOP Portal
      </div>
      
      <div className="user-info">
        <h3>User Information</h3>
        <p><strong>Name:</strong> {user.fullName}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>User Type:</strong> {user.userType}</p>
      </div>

      <div className="portal-features">
        <h3>Available Services</h3>
        <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
          <li>Academic Records</li>
          <li>Course Registration</li>
          <li>Attendance Tracking</li>
          <li>Fee Management</li>
          <li>Research Portal</li>
          <li>Support Services</li>
        </ul>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;