import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useNotification } from '../../contexts/NotificationContext';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const AdminUsers = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock data - in real app, this would come from API
  const [users, setUsers] = useState([
    {
      id: 1,
      userId: '2024CSE0001',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@student.vitbhopal.ac.in',
      role: 'student',
      department: 'Computer Science',
      program: 'B.Tech',
      semester: 3,
      isActive: true,
      lastLogin: '2024-01-08T10:30:00Z',
      createdAt: '2024-08-15T09:00:00Z'
    },
    {
      id: 2,
      userId: 'FACCSE0001',
      firstName: 'Dr. John',
      lastName: 'Smith',
      email: 'john.smith@vitbhopal.ac.in',
      role: 'faculty',
      department: 'Computer Science',
      designation: 'Professor',
      specialization: 'Machine Learning',
      isActive: true,
      lastLogin: '2024-01-08T08:15:00Z',
      createdAt: '2023-06-10T14:30:00Z'
    },
    {
      id: 3,
      userId: '2024ECE0015',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@student.vitbhopal.ac.in',
      role: 'student',
      department: 'Electronics',
      program: 'B.Tech',
      semester: 2,
      isActive: true,
      lastLogin: '2024-01-07T16:45:00Z',
      createdAt: '2024-08-15T11:20:00Z'
    },
    {
      id: 4,
      userId: 'FACECE0002',
      firstName: 'Dr. Sarah',
      lastName: 'Davis',
      email: 'sarah.davis@vitbhopal.ac.in',
      role: 'faculty',
      department: 'Electronics',
      designation: 'Associate Professor',
      specialization: 'Digital Signal Processing',
      isActive: false,
      lastLogin: '2024-01-05T12:00:00Z',
      createdAt: '2023-03-22T10:15:00Z'
    },
    {
      id: 5,
      userId: 'ADM0001',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@vitbhopal.ac.in',
      role: 'admin',
      department: 'Administration',
      isActive: true,
      lastLogin: '2024-01-08T09:00:00Z',
      createdAt: '2022-01-15T08:00:00Z'
    }
  ]);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    department: '',
    program: '',
    semester: 1,
    designation: '',
    specialization: ''
  });

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Administration'];
  const programs = ['B.Tech', 'M.Tech', 'MBA', 'MCA'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleAddUser = () => {
    // Validate form
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.department) {
      showError('Please fill in all required fields');
      return;
    }

    // Generate user ID based on role
    const generateUserId = () => {
      const year = new Date().getFullYear();
      const dept = newUser.department.substring(0, 3).toUpperCase();
      const count = users.filter(u => u.department === newUser.department && u.role === newUser.role).length + 1;
      
      switch (newUser.role) {
        case 'student':
          return `${year}${dept}${count.toString().padStart(4, '0')}`;
        case 'faculty':
          return `FAC${dept}${count.toString().padStart(4, '0')}`;
        case 'admin':
          return `ADM${count.toString().padStart(4, '0')}`;
        default:
          return `USR${count.toString().padStart(4, '0')}`;
      }
    };

    const user = {
      id: users.length + 1,
      userId: generateUserId(),
      ...newUser,
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    };

    setUsers([...users, user]);
    setNewUser({
      firstName: '',
      lastName: '',
      email: '',
      role: 'student',
      department: '',
      program: '',
      semester: 1,
      designation: '',
      specialization: ''
    });
    setShowAddModal(false);
    showSuccess(`User ${user.firstName} ${user.lastName} added successfully`);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = () => {
    setUsers(users.map(user => 
      user.id === selectedUser.id ? selectedUser : user
    ));
    setShowEditModal(false);
    showSuccess('User updated successfully');
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
    const user = users.find(u => u.id === userId);
    showInfo(`User ${user.firstName} ${user.lastName} ${user.isActive ? 'deactivated' : 'activated'}`);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const user = users.find(u => u.id === userId);
      setUsers(users.filter(u => u.id !== userId));
      showSuccess(`User ${user.firstName} ${user.lastName} deleted successfully`);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'faculty': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage students, faculty, and administrators</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrators</option>
            </select>

            {/* Department Filter */}
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

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4 mr-2" />
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Last Login</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.userId}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      {user.role === 'student' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.program} - Sem {user.semester}
                        </div>
                      )}
                      {user.role === 'faculty' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.designation}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{user.department}</div>
                      {user.specialization && (
                        <div className="text-xs text-gray-500">{user.specialization}</div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {user.lastLogin ? formatDate(user.lastLogin, 'MMM dd, yyyy') : 'Never'}
                      </div>
                      {user.lastLogin && (
                        <div className="text-xs text-gray-500">
                          {formatDate(user.lastLogin, 'HH:mm')}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit User"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="input-field"
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="input-field"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  
                  {newUser.role === 'student' && (
                    <>
                      <select
                        value={newUser.program}
                        onChange={(e) => setNewUser({...newUser, program: e.target.value})}
                        className="input-field"
                      >
                        <option value="">Select Program</option>
                        {programs.map(program => (
                          <option key={program} value={program}>{program}</option>
                        ))}
                      </select>
                      <select
                        value={newUser.semester}
                        onChange={(e) => setNewUser({...newUser, semester: parseInt(e.target.value)})}
                        className="input-field"
                      >
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </>
                  )}
                  
                  {newUser.role === 'faculty' && (
                    <>
                      <input
                        type="text"
                        placeholder="Designation"
                        value={newUser.designation}
                        onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                        className="input-field"
                      />
                      <input
                        type="text"
                        placeholder="Specialization"
                        value={newUser.specialization}
                        onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                        className="input-field"
                      />
                    </>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Add User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={selectedUser.firstName}
                      onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={selectedUser.lastName}
                      onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                    className="input-field"
                  />
                  <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                    className="input-field"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <select
                    value={selectedUser.department}
                    onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  
                  {selectedUser.role === 'student' && (
                    <>
                      <select
                        value={selectedUser.program || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, program: e.target.value})}
                        className="input-field"
                      >
                        <option value="">Select Program</option>
                        {programs.map(program => (
                          <option key={program} value={program}>{program}</option>
                        ))}
                      </select>
                      <select
                        value={selectedUser.semester || 1}
                        onChange={(e) => setSelectedUser({...selectedUser, semester: parseInt(e.target.value)})}
                        className="input-field"
                      >
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </>
                  )}
                  
                  {selectedUser.role === 'faculty' && (
                    <>
                      <input
                        type="text"
                        placeholder="Designation"
                        value={selectedUser.designation || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, designation: e.target.value})}
                        className="input-field"
                      />
                      <input
                        type="text"
                        placeholder="Specialization"
                        value={selectedUser.specialization || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, specialization: e.target.value})}
                        className="input-field"
                      />
                    </>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Update User
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

export default AdminUsers;