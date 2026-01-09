import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const AttendancePage = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [overallStats, setOverallStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    totalAttended: 0,
    overallPercentage: 0,
    coursesAboveThreshold: 0,
    coursesBelowThreshold: 0
  });

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        // In real implementation, these would be API calls
        // For now, set empty data since database is cleared
        setAttendanceData([]);
        setOverallStats({
          totalCourses: 0,
          totalClasses: 0,
          totalAttended: 0,
          overallPercentage: 0,
          coursesAboveThreshold: 0,
          coursesBelowThreshold: 0
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchAttendanceData();
    }
  }, [selectedSemester, user]);

  // Get status color for percentage
  const getStatusColor = (percentage, required = 75) => {
    if (percentage >= required + 10) return 'text-green-600 bg-green-100';
    if (percentage >= required) return 'text-green-600 bg-green-100';
    if (percentage >= required - 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get progress bar color
  const getProgressBarColor = (percentage, required = 75) => {
    if (percentage >= required + 10) return 'bg-green-500';
    if (percentage >= required) return 'bg-green-500';
    if (percentage >= required - 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vtop-blue"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-vtop-blue to-vtop-lightblue rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Attendance Tracker</h1>
              <p className="text-blue-100">Monitor your class attendance and maintain required percentages</p>
            </div>
            <div className="hidden md:block">
              <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.overallPercentage}%</p>
                <p className="text-xs text-gray-500 mt-1">{overallStats.totalAttended}/{overallStats.totalClasses} classes</p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                overallStats.overallPercentage >= 75 ? 'bg-green-500' : 
                overallStats.overallPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.totalCourses}</p>
                <p className="text-xs text-blue-600 mt-1">Registered courses</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Above Threshold</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.coursesAboveThreshold}</p>
                <p className="text-xs text-green-600 mt-1">≥75% attendance</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Below Threshold</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overallStats.coursesBelowThreshold}</p>
                <p className="text-xs text-red-600 mt-1">&lt;75% attendance</p>
              </div>
              <div className="h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Semester Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vtop-blue focus:border-transparent"
            >
              <option value="current">Current Semester</option>
              <option value="previous">Previous Semester</option>
              <option value="all">All Semesters</option>
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header text-left">Course</th>
                  <th className="table-header text-center">Classes</th>
                  <th className="table-header text-center">Attended</th>
                  <th className="table-header text-center">Percentage</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Recent Attendance</th>
                  <th className="table-header text-center">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.length > 0 ? (
                  attendanceData.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <div className="font-semibold text-gray-900">{course.courseCode}</div>
                          <div className="text-sm text-gray-600">{course.courseName}</div>
                          <div className="text-xs text-gray-500">{course.faculty}</div>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="text-lg font-semibold text-gray-900">{course.totalClasses}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="text-lg font-semibold text-gray-900">{course.attendedClasses}</div>
                        <div className="text-xs text-gray-500">Present</div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="space-y-2">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(course.percentage, course.requiredPercentage)}`}>
                            {course.percentage.toFixed(1)}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(course.percentage, course.requiredPercentage)}`}
                              style={{ width: `${Math.min(course.percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Required: {course.requiredPercentage}%
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {getStatusIcon(course.status)}
                          <span className={`text-sm font-medium ${
                            course.status === 'good' ? 'text-green-600' :
                            course.status === 'warning' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {course.status === 'good' ? 'Good' :
                             course.status === 'warning' ? 'Warning' : 'Critical'}
                          </span>
                        </div>
                        {course.status === 'critical' && (
                          <div className="text-xs text-red-600 mt-1">
                            Need {Math.ceil((course.requiredPercentage * course.totalClasses / 100) - course.attendedClasses)} more
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex justify-center space-x-1">
                          {course.recentAttendance.slice(0, 5).map((attendance, index) => (
                            <div
                              key={index}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                attendance.status === 'present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                              title={`${formatDate(attendance.date)} - ${attendance.status}`}
                            >
                              {attendance.status === 'present' ? 'P' : 'A'}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Last 5 classes</div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="text-sm text-gray-900">
                          {formatDate(course.lastUpdated)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(course.lastUpdated).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-500 mb-2">No attendance records found</p>
                      <p className="text-gray-400">Attendance data will appear here once courses are assigned and classes begin</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Guidelines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-vtop-blue" />
            Attendance Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">Good Standing</h4>
                <p className="text-sm text-gray-600">≥75% attendance maintained. You're eligible for examinations.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-gray-600">70-74% attendance. Improve attendance to avoid restrictions.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-800">Critical</h4>
                <p className="text-sm text-gray-600">&lt;70% attendance. May not be eligible for examinations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendancePage;