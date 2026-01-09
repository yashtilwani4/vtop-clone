import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useNotification } from '../../contexts/NotificationContext';
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  ClockIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const AdminCourses = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Mock data
  const [courses, setCourses] = useState([
    {
      id: 1,
      courseCode: 'CSE301',
      courseName: 'Data Structures & Algorithms',
      description: 'Comprehensive study of data structures and algorithmic techniques',
      credits: 4,
      department: 'Computer Science',
      semester: 3,
      program: 'B.Tech',
      courseType: 'Core',
      faculty: { id: 1, name: 'Dr. John Smith' },
      maxStudents: 60,
      enrolledStudents: 45,
      isActive: true,
      academicYear: '2024-25'
    },
    {
      id: 2,
      courseCode: 'CSE302',
      courseName: 'Database Management Systems',
      description: 'Introduction to database concepts and SQL',
      credits: 3,
      department: 'Computer Science',
      semester: 3,
      program: 'B.Tech',
      courseType: 'Core',
      faculty: { id: 2, name: 'Dr. Jane Davis' },
      maxStudents: 50,
      enrolledStudents: 38,
      isActive: true,
      academicYear: '2024-25'
    },
    {
      id: 3,
      courseCode: 'ECE201',
      courseName: 'Digital Electronics',
      description: 'Fundamentals of digital circuits and logic design',
      credits: 4,
      department: 'Electronics',
      semester: 2,
      program: 'B.Tech',
      courseType: 'Core',
      faculty: { id: 3, name: 'Prof. Mike Johnson' },
      maxStudents: 55,
      enrolledStudents: 52,
      isActive: true,
      academicYear: '2024-25'
    }
  ]);

  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    description: '',
    credits: 3,
    department: '',
    semester: 1,
    program: 'B.Tech',
    courseType: 'Core',
    faculty: '',
    maxStudents: 60,
    academicYear: '2024-25'
  });

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
  const programs = ['B.Tech', 'M.Tech', 'MBA', 'MCA'];
  const courseTypes = ['Core', 'Elective', 'Lab', 'Project'];
  const facultyList = [
    { id: 1, name: 'Dr. John Smith', department: 'Computer Science' },
    { id: 2, name: 'Dr. Jane Davis', department: 'Computer Science' },
    { id: 3, name: 'Prof. Mike Johnson', department: 'Electronics' },
    { id: 4, name: 'Dr. Sarah Wilson', department: 'Mechanical' }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || course.department === selectedDepartment;
    const matchesSemester = selectedSemester === 'all' || course.semester.toString() === selectedSemester;
    
    return matchesSearch && matchesDepartment && matchesSemester;
  });

  const handleAddCourse = () => {
    if (!newCourse.courseCode || !newCourse.courseName || !newCourse.department || !newCourse.faculty) {
      showError('Please fill in all required fields');
      return;
    }

    const faculty = facultyList.find(f => f.id.toString() === newCourse.faculty);
    const course = {
      id: courses.length + 1,
      ...newCourse,
      faculty: { id: faculty.id, name: faculty.name },
      enrolledStudents: 0,
      isActive: true
    };

    setCourses([...courses, course]);
    setNewCourse({
      courseCode: '',
      courseName: '',
      description: '',
      credits: 3,
      department: '',
      semester: 1,
      program: 'B.Tech',
      courseType: 'Core',
      faculty: '',
      maxStudents: 60,
      academicYear: '2024-25'
    });
    setShowAddModal(false);
    showSuccess(`Course ${course.courseCode} created successfully`);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse({...course, faculty: course.faculty.id.toString()});
    setShowEditModal(true);
  };

  const handleUpdateCourse = () => {
    const faculty = facultyList.find(f => f.id.toString() === selectedCourse.faculty);
    const updatedCourse = {
      ...selectedCourse,
      faculty: { id: faculty.id, name: faculty.name }
    };

    setCourses(courses.map(course => 
      course.id === selectedCourse.id ? updatedCourse : course
    ));
    setShowEditModal(false);
    showSuccess('Course updated successfully');
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      const course = courses.find(c => c.id === courseId);
      setCourses(courses.filter(c => c.id !== courseId));
      showSuccess(`Course ${course.courseCode} deleted successfully`);
    }
  };

  const handleToggleCourseStatus = (courseId) => {
    setCourses(courses.map(course => 
      course.id === courseId ? { ...course, isActive: !course.isActive } : course
    ));
    const course = courses.find(c => c.id === courseId);
    showInfo(`Course ${course.courseCode} ${course.isActive ? 'deactivated' : 'activated'}`);
  };

  const getCourseTypeColor = (type) => {
    switch (type) {
      case 'Core': return 'bg-blue-100 text-blue-800';
      case 'Elective': return 'bg-green-100 text-green-800';
      case 'Lab': return 'bg-purple-100 text-purple-800';
      case 'Project': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-1">Create and manage academic courses</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Course
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input-field"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="input-field"
            >
              <option value="all">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>

            <div className="flex items-center text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4 mr-2" />
              {filteredCourses.length} of {courses.length} courses
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{course.courseCode}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCourseTypeColor(course.courseType)}`}>
                      {course.courseType}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{course.courseName}</h4>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Credits:</span>
                  <span className="font-medium">{course.credits}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium">{course.department}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Semester:</span>
                  <span className="font-medium">{course.semester}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Faculty:</span>
                  <span className="font-medium">{course.faculty.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Enrollment:</span>
                  <span className="font-medium">{course.enrolledStudents}/{course.maxStudents}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {course.isActive ? 'Active' : 'Inactive'}
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Edit Course"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleCourseStatus(course.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title={course.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <ClockIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Course"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Course Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Course</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Course Code (e.g., CSE301)"
                    value={newCourse.courseCode}
                    onChange={(e) => setNewCourse({...newCourse, courseCode: e.target.value.toUpperCase()})}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Course Name"
                    value={newCourse.courseName}
                    onChange={(e) => setNewCourse({...newCourse, courseName: e.target.value})}
                    className="input-field"
                  />
                  <textarea
                    placeholder="Course Description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    className="input-field"
                    rows="3"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({...newCourse, credits: parseInt(e.target.value)})}
                      className="input-field"
                    >
                      {[1,2,3,4,5,6].map(credit => (
                        <option key={credit} value={credit}>{credit} Credits</option>
                      ))}
                    </select>
                    <select
                      value={newCourse.semester}
                      onChange={(e) => setNewCourse({...newCourse, semester: parseInt(e.target.value)})}
                      className="input-field"
                    >
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={newCourse.department}
                    onChange={(e) => setNewCourse({...newCourse, department: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newCourse.program}
                      onChange={(e) => setNewCourse({...newCourse, program: e.target.value})}
                      className="input-field"
                    >
                      {programs.map(program => (
                        <option key={program} value={program}>{program}</option>
                      ))}
                    </select>
                    <select
                      value={newCourse.courseType}
                      onChange={(e) => setNewCourse({...newCourse, courseType: e.target.value})}
                      className="input-field"
                    >
                      {courseTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={newCourse.faculty}
                    onChange={(e) => setNewCourse({...newCourse, faculty: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Faculty</option>
                    {facultyList
                      .filter(f => !newCourse.department || f.department === newCourse.department)
                      .map(faculty => (
                        <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                      ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Max Students"
                    value={newCourse.maxStudents}
                    onChange={(e) => setNewCourse({...newCourse, maxStudents: parseInt(e.target.value)})}
                    className="input-field"
                    min="1"
                    max="200"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCourse}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Add Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Modal */}
        {showEditModal && selectedCourse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Course</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Course Code (e.g., CSE301)"
                    value={selectedCourse.courseCode}
                    onChange={(e) => setSelectedCourse({...selectedCourse, courseCode: e.target.value.toUpperCase()})}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Course Name"
                    value={selectedCourse.courseName}
                    onChange={(e) => setSelectedCourse({...selectedCourse, courseName: e.target.value})}
                    className="input-field"
                  />
                  <textarea
                    placeholder="Course Description"
                    value={selectedCourse.description}
                    onChange={(e) => setSelectedCourse({...selectedCourse, description: e.target.value})}
                    className="input-field"
                    rows="3"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={selectedCourse.credits}
                      onChange={(e) => setSelectedCourse({...selectedCourse, credits: parseInt(e.target.value)})}
                      className="input-field"
                    >
                      {[1,2,3,4,5,6].map(credit => (
                        <option key={credit} value={credit}>{credit} Credits</option>
                      ))}
                    </select>
                    <select
                      value={selectedCourse.semester}
                      onChange={(e) => setSelectedCourse({...selectedCourse, semester: parseInt(e.target.value)})}
                      className="input-field"
                    >
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={selectedCourse.department}
                    onChange={(e) => setSelectedCourse({...selectedCourse, department: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={selectedCourse.program}
                      onChange={(e) => setSelectedCourse({...selectedCourse, program: e.target.value})}
                      className="input-field"
                    >
                      {programs.map(program => (
                        <option key={program} value={program}>{program}</option>
                      ))}
                    </select>
                    <select
                      value={selectedCourse.courseType}
                      onChange={(e) => setSelectedCourse({...selectedCourse, courseType: e.target.value})}
                      className="input-field"
                    >
                      {courseTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={selectedCourse.faculty}
                    onChange={(e) => setSelectedCourse({...selectedCourse, faculty: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Faculty</option>
                    {facultyList
                      .filter(f => !selectedCourse.department || f.department === selectedCourse.department)
                      .map(faculty => (
                        <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                      ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Max Students"
                    value={selectedCourse.maxStudents}
                    onChange={(e) => setSelectedCourse({...selectedCourse, maxStudents: parseInt(e.target.value)})}
                    className="input-field"
                    min="1"
                    max="200"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateCourse}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Update Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCourses;