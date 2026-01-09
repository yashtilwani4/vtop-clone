import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';

const CoursesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">Manage your enrolled courses</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Courses Page</h3>
          <p className="text-gray-500">Course management functionality will be implemented here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;