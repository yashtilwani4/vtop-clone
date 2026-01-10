import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { apiGet } from '../utils/api';
import {
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ResultsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showInfo } = useNotification();
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [gpaData, setGpaData] = useState({});

  // VIT Grade point mapping
  const gradePoints = {
    'S': 10,
    'A': 9,
    'B': 8,
    'C': 7,
    'D': 6,
    'E': 5,
    'F': 0,
    'P': 0, // Pass (no grade points)
    'I': 0, // Incomplete
    'W': 0  // Withdrawn
  };

  // Fetch results data from API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        
        // Fetch student's results
        const endpoint = selectedSemester === 'all' 
          ? '/simple-results/my-results'
          : `/simple-results/my-results?semester=${selectedSemester}`;
          
        console.log('Fetching results from:', endpoint);
        const data = await apiGet(endpoint);
        console.log('API Response:', data); // Debug log
        
        setResultsData(data.data.allResults || []);
        setGpaData({
          currentGPA: data.data.cgpa?.cgpa || 0,
          totalCredits: data.data.cgpa?.totalCredits || 0,
          averageMarks: data.data.allResults ? 
            Math.round(data.data.allResults.reduce((sum, r) => sum + r.totalMarks, 0) / data.data.allResults.length) : 0,
          completedCourses: data.data.allResults?.length || 0
        });
      } catch (error) {
        console.error('Error fetching results:', error);
        setResultsData([]);
        setGpaData({
          currentGPA: 0,
          totalCredits: 0,
          averageMarks: 0,
          completedCourses: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedSemester]);

  // Get grade color for VIT grading system
  const getGradeColor = (grade) => {
    const gradeColors = {
      'S': 'text-green-600 bg-green-100 border-green-300',
      'A': 'text-green-600 bg-green-100 border-green-300',
      'B': 'text-blue-600 bg-blue-100 border-blue-300',
      'C': 'text-yellow-600 bg-yellow-100 border-yellow-300',
      'D': 'text-orange-600 bg-orange-100 border-orange-300',
      'E': 'text-red-600 bg-red-100 border-red-300',
      'F': 'text-red-600 bg-red-100 border-red-300',
      'P': 'text-green-600 bg-green-100 border-green-300',
      'I': 'text-gray-600 bg-gray-100 border-gray-300',
      'W': 'text-gray-600 bg-gray-100 border-gray-300'
    };
    return gradeColors[grade] || 'text-gray-600 bg-gray-100 border-gray-300';
  };

  // Get GPA color
  const getGPAColor = (gpa) => {
    if (gpa >= 9.0) return 'text-green-600';
    if (gpa >= 8.0) return 'text-blue-600';
    if (gpa >= 7.0) return 'text-yellow-600';
    if (gpa >= 6.0) return 'text-orange-600';
    return 'text-red-600';
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    showInfo('Generating PDF... This feature will be implemented with a PDF library.');
    // In real implementation, this would generate and download a PDF
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
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
        <div className="bg-gradient-to-r from-vtop-blue to-vtop-lightblue rounded-xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="w-full sm:flex-1">
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Academic Results</h1>
              <p className="text-blue-100 text-sm sm:text-base">View your grades, GPA, and academic performance</p>
            </div>
            <div className="hidden sm:block mt-4 sm:mt-0">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* GPA and Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current GPA</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-1 ${getGPAColor(gpaData.currentGPA)}`}>
                  {gpaData.currentGPA}
                </p>
                <p className="text-xs text-gray-500 mt-1">Out of 10.0</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{gpaData.totalCredits}</p>
                <p className="text-xs text-blue-600 mt-1">Completed</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Marks</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{gpaData.averageMarks}%</p>
                <p className="text-xs text-green-600 mt-1">Overall performance</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <StarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Courses Completed</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{gpaData.completedCourses}</p>
                <p className="text-xs text-purple-600 mt-1">This semester</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Semester Results</h3>
              <p className="text-sm text-gray-600">Select semester to view detailed results</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vtop-blue focus:border-transparent text-sm"
              >
                <option value="all">All Semesters</option>
                <option value="1">Interim Semester</option>
                <option value="2">Winter Semester 2024-25</option>
                <option value="3">Fall Semester 2025-26</option>
              </select>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center justify-center px-4 py-2 bg-vtop-blue text-white rounded-lg hover:bg-vtop-lightblue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vtop-blue transition-colors text-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        {resultsData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(
                resultsData.reduce((acc, result) => {
                  acc[result.grade] = (acc[result.grade] || 0) + 1;
                  return acc;
                }, {})
              ).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg border-2 ${getGradeColor(grade)} font-bold text-lg mb-2`}>
                    {grade}
                  </div>
                  <div className="text-sm text-gray-600">{count} course{count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-vtop-blue" />
              Course-wise Results
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header text-left">Course</th>
                  <th className="table-header text-center">Credits</th>
                  <th className="table-header text-center">Academic Year</th>
                  <th className="table-header text-center">Total Marks</th>
                  <th className="table-header text-center">Grade</th>
                  <th className="table-header text-center">Grade Points</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Published</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resultsData.length > 0 ? (
                  resultsData.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <div className="font-semibold text-gray-900">{result.course.code}</div>
                          <div className="text-sm text-gray-600">{result.course.name}</div>
                          <div className="text-xs text-gray-500">
                            {result.semester === 1 ? 'Interim Semester' : 
                             result.semester === 2 ? 'Winter Semester 2024-25' : 
                             result.semester === 3 ? 'Fall Semester 2025-26' :
                             `Semester ${result.semester}`}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {result.course.credits}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-xs text-gray-600">
                          Academic Year: {result.academicYear}
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <div className="text-lg font-semibold text-gray-900">{result.totalMarks}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              result.totalMarks >= 90 ? 'bg-green-500' :
                              result.totalMarks >= 80 ? 'bg-blue-500' :
                              result.totalMarks >= 70 ? 'bg-yellow-500' :
                              result.totalMarks >= 60 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(result.totalMarks, 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg border-2 text-lg font-bold ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="text-lg font-semibold text-gray-900">{result.gradePoints}</div>
                        <div className="text-xs text-gray-500">out of 10</div>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.status === 'Pass' ? 'bg-green-100 text-green-800' :
                          result.status === 'Fail' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.status === 'Pass' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                          {result.status === 'Fail' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                          {result.status}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="text-sm text-gray-900">{formatDate(result.publishedAt || new Date())}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.publishedAt || new Date()).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-xl text-gray-500 mb-2">No results found</p>
                      <p className="text-gray-400">Your academic results will appear here once published</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GPA Calculation Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-vtop-blue" />
            GPA Calculation
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Grade Point Scale</h4>
              <div className="space-y-2">
                {Object.entries(gradePoints).map(([grade, points]) => (
                  <div key={grade} className="flex items-center justify-between py-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getGradeColor(grade)}`}>
                      {grade}
                    </span>
                    <span className="font-medium text-gray-900">{points} points</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Current Semester Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Total Credit Hours:</span>
                  <span className="font-semibold text-gray-900">{gpaData.totalCredits}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Total Grade Points:</span>
                  <span className="font-semibold text-gray-900">
                    {resultsData.reduce((sum, result) => sum + (result.gradePoints * result.course.credits), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Semester GPA:</span>
                  <span className={`font-bold text-xl ${getGPAColor(gpaData.currentGPA)}`}>
                    {gpaData.currentGPA}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Formula:</strong> GPA = Total Grade Points ÷ Total Credit Hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        {resultsData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {resultsData.filter(result => result.grade === 'S' || result.grade === 'A').length}
                </div>
                <div className="text-sm text-green-800">Excellent Grades (S/A)</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {resultsData.filter(result => result.totalMarks >= 80).length}
                </div>
                <div className="text-sm text-blue-800">Courses Above 80%</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {gpaData.currentGPA >= 8.5 ? 'Dean\'s List' : gpaData.currentGPA >= 7.5 ? 'Honor Roll' : 'Good Standing'}
                </div>
                <div className="text-sm text-purple-800">Academic Standing</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResultsPage;