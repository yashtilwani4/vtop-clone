import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { apiGet } from '../utils/api';
import {
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  SpeakerWaveIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowRightIcon,
  BellIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../utils/helpers';

const DashboardPage = () => {
  const { user } = useAuth();
  const { showInfo } = useNotification();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sample data - in real app, this would come from API
  const [studentData, setStudentData] = useState({
    registeredCourses: 0,
    cgpa: 0,
    upcomingClasses: [],
    recentNotices: []
  });

  // Faculty-specific data
  const [facultyData, setFacultyData] = useState({
    assignedCourses: [],
    totalStudents: 0,
    classesToday: 0,
    pendingEvaluations: 0,
    noticesPosted: []
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // For now, just set empty data since database is cleared
        // In real implementation, these would be API calls
        if (user?.role === 'student') {
          // Fetch student's academic data
          try {
            console.log('Fetching student data from API...');
            const data = await apiGet('/simple-results/my-results');
            console.log('Dashboard API Response:', data);
            
            setStudentData({
              registeredCourses: data.data.totalResults || 0,
              cgpa: data.data.cgpa?.cgpa || 0,
              upcomingClasses: [],
              recentNotices: []
            });
          } catch (error) {
            console.error('Error fetching student data:', error);
            setStudentData({
              registeredCourses: 0,
              cgpa: 0,
              upcomingClasses: [],
              recentNotices: []
            });
          }
        } else if (user?.role === 'faculty') {
          setFacultyData({
            assignedCourses: [],
            totalStudents: 0,
            classesToday: 0,
            pendingEvaluations: 0,
            noticesPosted: []
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getClassStatus = (classItem) => {
    const now = new Date();
    const classTime = new Date();
    const [hours, minutes] = classItem.time.split(':');
    const period = classItem.time.includes('PM') ? 'PM' : 'AM';
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    classTime.setHours(hour24, parseInt(minutes.replace(/[^\d]/g, '')), 0, 0);
    
    if (now < classTime) return 'upcoming';
    return 'ongoing';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAttendanceEntry = (courseId, courseCode) => {
    showInfo(`Opening attendance entry for ${courseCode}...`);
    // In real app, navigate to attendance entry page
  };

  const handleUploadMarks = (courseId, courseCode) => {
    showInfo(`Opening marks upload for ${courseCode}...`);
    // In real app, navigate to marks upload page
  };

  const handleCreateNotice = () => {
    showInfo('Opening notice creation form...');
    // In real app, navigate to notice creation page
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'not-started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'partial': return 'In Progress';
      case 'pending': return 'Pending';
      case 'not-started': return 'Not Started';
      default: return 'Unknown';
    }
  };

  // Render Faculty Dashboard
  if (user?.role === 'faculty') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-vtop-blue to-vtop-lightblue rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="w-full sm:flex-1">
                <h1 className="text-xl sm:text-2xl font-bold mb-2">
                  {getGreeting()}, Prof. {user?.name}! 👨‍🏫
                </h1>
                <p className="text-blue-100 mb-1 text-sm sm:text-base">
                  Welcome to your Faculty Dashboard
                </p>
                <p className="text-blue-200 text-xs sm:text-sm">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="hidden sm:block mt-4 sm:mt-0">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Faculty Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Courses</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{facultyData.assignedCourses.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Active this semester</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{facultyData.totalStudents}</p>
                  <p className="text-xs text-green-600 mt-1">Across all courses</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Classes Today</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{facultyData.classesToday}</p>
                  <p className="text-xs text-purple-600 mt-1">Scheduled sessions</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Evaluations</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{facultyData.pendingEvaluations}</p>
                  <p className="text-xs text-orange-600 mt-1">Require attention</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Courses Handled - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-vtop-blue" />
                  My Courses
                </h3>
                <Link 
                  to="/courses" 
                  className="text-sm text-vtop-blue hover:text-vtop-lightblue font-medium flex items-center"
                >
                  Manage All Courses
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {facultyData.assignedCourses.length > 0 ? (
                  facultyData.assignedCourses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{course.courseCode}</h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {course.credits} Credits
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Sem {course.semester}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{course.courseName}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-1" />
                              {course.enrolledStudents}/{course.maxStudents} Students
                            </span>
                            <span className="flex items-center">
                              <CalendarDaysIcon className="h-4 w-4 mr-1" />
                              Next: {course.nextClass.day}, {course.nextClass.time}
                            </span>
                            <span className="flex items-center">
                              📍 {course.nextClass.room}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Attendance:</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.attendanceStatus)}`}>
                              {getStatusText(course.attendanceStatus)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Marks:</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.marksStatus)}`}>
                              {getStatusText(course.marksStatus)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAttendanceEntry(course.id, course.courseCode)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtop-blue"
                          >
                            <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                            Mark Attendance
                          </button>
                          <button
                            onClick={() => handleUploadMarks(course.id, course.courseCode)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-vtop-blue hover:bg-vtop-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtop-blue"
                          >
                            <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                            Upload Marks
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No courses assigned</p>
                    <p className="text-sm text-gray-400">Courses will appear here once assigned by admin</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notices Posted - Takes 1 column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <SpeakerWaveIcon className="h-5 w-5 mr-2 text-vtop-blue" />
                  My Notices
                </h3>
                <button
                  onClick={handleCreateNotice}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-vtop-blue hover:bg-vtop-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtop-blue"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Notice
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {facultyData.noticesPosted.length > 0 ? (
                  facultyData.noticesPosted.map((notice) => (
                    <div key={notice.id} className="border-l-4 border-vtop-blue bg-gray-50 p-4 rounded-r-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {notice.courseCode}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center text-xs text-gray-500">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            {notice.views}
                          </span>
                          <button className="text-gray-400 hover:text-vtop-blue">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {notice.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="capitalize">{notice.category}</span>
                        <span>{formatDate(notice.publishedDate, 'MMM dd')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <SpeakerWaveIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">No notices posted</p>
                    <p className="text-sm text-gray-400">Your posted notices will appear here</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link 
                  to="/notices" 
                  className="text-sm text-vtop-blue hover:text-vtop-lightblue font-medium flex items-center justify-center"
                >
                  View All Notices
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions for Faculty */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              <Link 
                to="/faculty/attendance" 
                className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
              >
                <ClipboardDocumentCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Mark Attendance</span>
              </Link>
              
              <Link 
                to="/faculty/results" 
                className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
              >
                <DocumentArrowUpIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Upload Marks</span>
              </Link>
              
              <Link 
                to="/courses" 
                className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
              >
                <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">My Courses</span>
              </Link>
              
              <Link 
                to="/timetable" 
                className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
              >
                <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Schedule</span>
              </Link>
              
              <button
                onClick={handleCreateNotice}
                className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
              >
                <SpeakerWaveIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Post Notice</span>
              </button>
              
              <Link 
                to="/profile" 
                className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
              >
                <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Student Dashboard (existing code)
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-vtop-blue to-vtop-lightblue rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="w-full sm:flex-1">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">
                {getGreeting()}, {user?.name}! 👋
              </h1>
              <p className="text-blue-100 mb-1 text-sm sm:text-base">
                Welcome back to your VTOP dashboard
              </p>
              <p className="text-blue-200 text-xs sm:text-sm">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <div className="hidden sm:block mt-4 sm:mt-0">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Registered Courses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered Courses</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{studentData.registeredCourses}</p>
                <p className="text-xs text-green-600 mt-1">Active this semester</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          {/* CGPA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall CGPA</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-1 ${
                  studentData.cgpa >= 8.5 ? 'text-green-600' :
                  studentData.cgpa >= 7.0 ? 'text-blue-600' :
                  studentData.cgpa >= 6.0 ? 'text-yellow-600' :
                  studentData.cgpa >= 5.0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {studentData.cgpa.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Out of 10.0</p>
              </div>
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center ${
                studentData.cgpa >= 8.5 ? 'bg-green-500' :
                studentData.cgpa >= 7.0 ? 'bg-blue-500' :
                studentData.cgpa >= 6.0 ? 'bg-yellow-500' :
                studentData.cgpa >= 5.0 ? 'bg-orange-500' : 'bg-red-500'
              }`}>
                <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Performance Summary - Only for students */}
        {user?.role === 'student' && studentData.cgpa > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="w-full sm:flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-2">Academic Performance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">{studentData.cgpa.toFixed(2)}</div>
                    <div className="text-sm text-purple-100">Overall CGPA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">{studentData.registeredCourses}</div>
                    <div className="text-sm text-purple-100">Courses Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold">
                      {studentData.cgpa >= 8.5 ? 'Excellent' :
                       studentData.cgpa >= 7.0 ? 'Very Good' :
                       studentData.cgpa >= 6.0 ? 'Good' :
                       studentData.cgpa >= 5.0 ? 'Average' : 'Below Average'}
                    </div>
                    <div className="text-sm text-purple-100">Performance Level</div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block mt-4 sm:mt-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <TrophyIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Upcoming Classes - Takes 2 columns on desktop, full width on mobile */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2 sm:mb-0">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-vtop-blue" />
                Today's Classes
              </h3>
              <Link 
                to="/timetable" 
                className="text-sm text-vtop-blue hover:text-vtop-lightblue font-medium flex items-center"
              >
                View Full Timetable
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {studentData.upcomingClasses.length > 0 ? (
                studentData.upcomingClasses.map((classItem) => {
                  const status = getClassStatus(classItem);
                  return (
                    <div key={classItem.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{classItem.courseCode}</h4>
                            <div className="flex flex-wrap gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                classItem.type === 'Lab' ? 'bg-purple-100 text-purple-800' :
                                classItem.type === 'Tutorial' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {classItem.type}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{classItem.courseName}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                            <span className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {classItem.time} - {classItem.endTime}
                            </span>
                            <span className="flex items-center">
                              📍 {classItem.room}
                            </span>
                            <span className="flex items-center">
                              👨‍🏫 {classItem.faculty}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            status.status === 'starting-soon' ? 'bg-red-100 text-red-800' :
                            status.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                            status.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {status.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No classes scheduled for today</p>
                  <p className="text-sm text-gray-400">Your class schedule will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Notices - Takes 1 column on desktop, full width on mobile */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2 sm:mb-0">
                <SpeakerWaveIcon className="h-5 w-5 mr-2 text-vtop-blue" />
                Recent Notices
              </h3>
              <Link 
                to="/notices" 
                className="text-sm text-vtop-blue hover:text-vtop-lightblue font-medium flex items-center"
              >
                View All
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {studentData.recentNotices.length > 0 ? (
                studentData.recentNotices.map((notice) => (
                  <div key={notice.id} className="border-l-4 border-vtop-blue bg-gray-50 p-4 rounded-r-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {notice.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            New
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                          {notice.priority}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {notice.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {notice.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{notice.category}</span>
                      <span>{formatDate(notice.publishedDate, 'MMM dd')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <SpeakerWaveIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No recent notices</p>
                  <p className="text-sm text-gray-400">Important notices will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            <Link 
              to="/courses" 
              className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
            >
              <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">My Courses</span>
            </Link>
            
            <Link 
              to="/course-registration" 
              className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
            >
              <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Register Courses</span>
            </Link>
            
            <Link 
              to="/attendance" 
              className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
            >
              <ClipboardDocumentCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Attendance</span>
            </Link>
            
            <Link 
              to="/results" 
              className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
            >
              <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Results</span>
            </Link>
            
            <Link 
              to="/timetable" 
              className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
            >
              <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Timetable</span>
            </Link>
            
            <Link 
              to="/notices" 
              className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
            >
              <BellIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Notices</span>
            </Link>
            
            <Link 
              to="/profile" 
              className="flex flex-col items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-vtop-blue hover:text-white hover:border-vtop-blue transition-all duration-200 group"
            >
              <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-vtop-blue group-hover:text-white mb-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-white text-center">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;