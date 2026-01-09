import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const CourseRegistrationPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  
  // State management
  const [availableCourses, setAvailableCourses] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  // Credit limits
  const MAX_CREDITS = 24;
  const MIN_CREDITS = 12;
  
  // Calculate total registered credits
  const totalCredits = registeredCourses.reduce((sum, course) => sum + course.credits, 0);
  
  // Fetch course data from API
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        // In real implementation, these would be API calls
        // For now, set empty data since database is cleared
        setAvailableCourses([]);
        setRegisteredCourses([]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchCourseData();
    }
  }, [user]);

  // Filter courses based on selected filters
  const filteredCourses = availableCourses.filter(course => {
    const categoryMatch = selectedCategory === 'all' || course.category === selectedCategory;
    const departmentMatch = selectedDepartment === 'all' || course.department === selectedDepartment;
    return categoryMatch && departmentMatch;
  });

  // Handle course registration
  const handleRegister = (course) => {
    const newTotalCredits = totalCredits + course.credits;
    
    if (newTotalCredits > MAX_CREDITS) {
      showError(`Cannot register. This would exceed the maximum credit limit of ${MAX_CREDITS}.`);
      return;
    }
    
    if (course.enrolledStudents >= course.maxStudents) {
      showError('Cannot register. This course is full.');
      return;
    }
    
    // Add to registered courses
    const newRegisteredCourse = {
      id: course.id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      category: course.category
    };
    
    setRegisteredCourses([...registeredCourses, newRegisteredCourse]);
    
    // Update available courses to reflect registration
    setAvailableCourses(availableCourses.map(c => 
      c.id === course.id 
        ? { ...c, isRegistered: true, enrolledStudents: c.enrolledStudents + 1 }
        : c
    ));
    
    showSuccess(`Successfully registered for ${course.courseCode} - ${course.courseName}`);
  };

  // Handle course drop
  const handleDrop = (course) => {
    const newTotalCredits = totalCredits - course.credits;
    
    if (newTotalCredits < MIN_CREDITS) {
      showWarning(`Warning: Dropping this course will put you below the minimum credit requirement of ${MIN_CREDITS}.`);
    }
    
    // Remove from registered courses
    setRegisteredCourses(registeredCourses.filter(c => c.id !== course.id));
    
    // Update available courses to reflect drop
    setAvailableCourses(availableCourses.map(c => 
      c.id === course.id 
        ? { ...c, isRegistered: false, enrolledStudents: Math.max(0, c.enrolledStudents - 1) }
        : c
    ));
    
    showSuccess(`Successfully dropped ${course.courseCode} - ${course.courseName}`);
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Core': return 'bg-blue-100 text-blue-800';
      case 'Elective': return 'bg-green-100 text-green-800';
      case 'Lab': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if registration is disabled
  const isRegistrationDisabled = (course) => {
    const wouldExceedLimit = (totalCredits + course.credits) > MAX_CREDITS;
    const isFull = course.enrolledStudents >= course.maxStudents;
    return wouldExceedLimit || isFull || course.isRegistered;
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
              <h1 className="text-2xl font-bold mb-2">Course Registration</h1>
              <p className="text-blue-100">Register for courses for the current semester</p>
            </div>
            <div className="hidden md:block">
              <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Credit Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{totalCredits}</div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{MAX_CREDITS - totalCredits}</div>
              <div className="text-sm text-gray-600">Credits Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{registeredCourses.length}</div>
              <div className="text-sm text-gray-600">Courses Registered</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${totalCredits >= MIN_CREDITS ? 'text-green-600' : 'text-red-600'}`}>
                {totalCredits >= MIN_CREDITS ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Min Credits Met</div>
            </div>
          </div>
          
          {/* Credit Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Credit Progress</span>
              <span>{totalCredits} / {MAX_CREDITS}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  totalCredits > MAX_CREDITS ? 'bg-red-500' : 
                  totalCredits >= MIN_CREDITS ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min((totalCredits / MAX_CREDITS) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Min: {MIN_CREDITS}</span>
              <span>Max: {MAX_CREDITS}</span>
            </div>
          </div>

          {/* Warnings */}
          {totalCredits < MIN_CREDITS && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You need at least {MIN_CREDITS - totalCredits} more credits to meet the minimum requirement.
              </span>
            </div>
          )}
          
          {totalCredits > MAX_CREDITS && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm text-red-800">
                You have exceeded the maximum credit limit by {totalCredits - MAX_CREDITS} credits.
              </span>
            </div>
          )}
        </div>

        {/* Registered Courses */}
        {registeredCourses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
              Registered Courses ({registeredCourses.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registeredCourses.map((course) => (
                <div key={course.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{course.courseCode}</h4>
                      <p className="text-sm text-gray-700">{course.courseName}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(course.category)}`}>
                      {course.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{course.credits} Credits</span>
                    <button
                      onClick={() => handleDrop(course)}
                      className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Drop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vtop-blue focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Core">Core</option>
                <option value="Elective">Elective</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vtop-blue focus:border-transparent"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredCourses.length} courses
              </div>
            </div>
          </div>
        </div>

        {/* Available Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BookOpenIcon className="h-5 w-5 mr-2 text-vtop-blue" />
            Available Courses
          </h3>
          
          <div className="space-y-4">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                const isDisabled = isRegistrationDisabled(course);
                const wouldExceedLimit = (totalCredits + course.credits) > MAX_CREDITS;
                const isFull = course.enrolledStudents >= course.maxStudents;
                
                return (
                  <div key={course.id} className={`border rounded-lg p-6 transition-all duration-200 ${
                    course.isRegistered ? 'border-green-200 bg-green-50' : 
                    isDisabled ? 'border-gray-200 bg-gray-50' : 
                    'border-gray-200 hover:border-vtop-blue hover:shadow-md'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">{course.courseCode}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(course.category)}`}>
                            {course.category}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {course.credits} Credits
                          </span>
                          {course.isRegistered && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Registered
                            </span>
                          )}
                        </div>
                        
                        <h5 className="text-md font-medium text-gray-800 mb-2">{course.courseName}</h5>
                        <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            <span>Faculty: {course.faculty}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>{course.schedule}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <InformationCircleIcon className="h-4 w-4 mr-2" />
                            <span>Room: {course.room}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            <span>{course.enrolledStudents}/{course.maxStudents} Students</span>
                          </div>
                        </div>
                        
                        {course.prerequisites.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs text-gray-500">Prerequisites: </span>
                            <span className="text-xs text-gray-700">{course.prerequisites.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-6 flex flex-col items-end space-y-2">
                        {course.isRegistered ? (
                          <button
                            onClick={() => handleDrop(course)}
                            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Drop Course
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(course)}
                            disabled={isDisabled}
                            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              isDisabled
                                ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'border-transparent text-white bg-vtop-blue hover:bg-vtop-lightblue focus:ring-vtop-blue'
                            }`}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Register
                          </button>
                        )}
                        
                        {/* Status indicators */}
                        {wouldExceedLimit && !course.isRegistered && (
                          <span className="text-xs text-red-600">Exceeds credit limit</span>
                        )}
                        {isFull && !course.isRegistered && (
                          <span className="text-xs text-orange-600">Course full</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">No courses available</p>
                <p className="text-gray-400">Course registration will be available when courses are added by admin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseRegistrationPage;