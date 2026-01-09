import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';

const NoticesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600 mt-1">Stay updated with latest announcements</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Notices Page</h3>
          <p className="text-gray-500">Notice board functionality will be implemented here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NoticesPage;