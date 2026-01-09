import React, { useState } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { useNotification } from '../../contexts/NotificationContext';
import {
  SpeakerWaveIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const AdminNotices = () => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Mock data
  const [notices, setNotices] = useState([
    {
      id: 1,
      title: 'Mid-Term Examination Schedule Released',
      content: 'The mid-term examination schedule for all courses has been published. Students are advised to check their individual timetables and prepare accordingly. The examinations will be conducted from March 15-25, 2024.',
      category: 'Examination',
      priority: 'High',
      targetAudience: {
        roles: ['student', 'faculty'],
        departments: [],
        programs: [],
        semesters: []
      },
      publishedBy: 'Admin',
      publishedDate: '2024-01-07T10:30:00Z',
      isPublished: true,
      isDraft: false,
      views: 245,
      acknowledgments: 189
    },
    {
      id: 2,
      title: 'Library Hours Extended During Exam Period',
      content: 'To support students during the examination period, the library will remain open from 7:00 AM to 11:00 PM. Additional study spaces have been arranged in the conference halls.',
      category: 'General',
      priority: 'Medium',
      targetAudience: {
        roles: ['student'],
        departments: [],
        programs: [],
        semesters: []
      },
      publishedBy: 'Admin',
      publishedDate: '2024-01-06T14:15:00Z',
      isPublished: true,
      isDraft: false,
      views: 156,
      acknowledgments: 98
    },
    {
      id: 3,
      title: 'New Course Registration Opens',
      content: 'Registration for elective courses for the next semester will open on January 15, 2024. Students can register through the VTOP portal.',
      category: 'Academic',
      priority: 'High',
      targetAudience: {
        roles: ['student'],
        departments: ['Computer Science', 'Electronics'],
        programs: ['B.Tech'],
        semesters: [3, 4, 5, 6]
      },
      publishedBy: 'Admin',
      publishedDate: '2024-01-05T09:00:00Z',
      isPublished: false,
      isDraft: true,
      views: 0,
      acknowledgments: 0
    }
  ]);

  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    targetAudience: {
      roles: ['all'],
      departments: [],
      programs: [],
      semesters: []
    },
    scheduledPublishDate: '',
    expiryDate: '',
    requiresAcknowledgment: false
  });

  const categories = ['Academic', 'Examination', 'Admission', 'Fee', 'Event', 'Holiday', 'Emergency', 'General', 'Placement', 'Research'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const roles = ['all', 'student', 'faculty', 'admin'];
  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
  const programs = ['B.Tech', 'M.Tech', 'MBA', 'MCA'];

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || notice.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.content) {
      showError('Please fill in title and content');
      return;
    }

    const notice = {
      id: notices.length + 1,
      ...newNotice,
      publishedBy: 'Admin',
      publishedDate: new Date().toISOString(),
      isPublished: false,
      isDraft: true,
      views: 0,
      acknowledgments: 0
    };

    setNotices([...notices, notice]);
    setNewNotice({
      title: '',
      content: '',
      category: 'General',
      priority: 'Medium',
      targetAudience: {
        roles: ['all'],
        departments: [],
        programs: [],
        semesters: []
      },
      scheduledPublishDate: '',
      expiryDate: '',
      requiresAcknowledgment: false
    });
    setShowAddModal(false);
    showSuccess('Notice created successfully');
  };

  const handleEditNotice = (notice) => {
    setSelectedNotice(notice);
    setShowEditModal(true);
  };

  const handleUpdateNotice = () => {
    setNotices(notices.map(notice => 
      notice.id === selectedNotice.id ? selectedNotice : notice
    ));
    setShowEditModal(false);
    showSuccess('Notice updated successfully');
  };

  const handleDeleteNotice = (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      const notice = notices.find(n => n.id === noticeId);
      setNotices(notices.filter(n => n.id !== noticeId));
      showSuccess(`Notice "${notice.title}" deleted successfully`);
    }
  };

  const handlePublishNotice = (noticeId) => {
    setNotices(notices.map(notice => 
      notice.id === noticeId ? { 
        ...notice, 
        isPublished: true, 
        isDraft: false,
        publishedDate: new Date().toISOString()
      } : notice
    ));
    const notice = notices.find(n => n.id === noticeId);
    showSuccess(`Notice "${notice.title}" published successfully`);
  };

  const handleUnpublishNotice = (noticeId) => {
    setNotices(notices.map(notice => 
      notice.id === noticeId ? { ...notice, isPublished: false, isDraft: true } : notice
    ));
    const notice = notices.find(n => n.id === noticeId);
    showInfo(`Notice "${notice.title}" unpublished`);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Examination': 'bg-purple-100 text-purple-800',
      'General': 'bg-gray-100 text-gray-800',
      'Emergency': 'bg-red-100 text-red-800',
      'Event': 'bg-green-100 text-green-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notice Management</h1>
            <p className="text-gray-600 mt-1">Create and manage system notices</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Notice
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input-field"
            >
              <option value="all">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>

            <div className="flex items-center text-sm text-gray-500">
              <SpeakerWaveIcon className="h-4 w-4 mr-2" />
              {filteredNotices.length} of {notices.length} notices
            </div>
          </div>
        </div>

        {/* Notices List */}
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                      {notice.priority}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(notice.category)}`}>
                      {notice.category}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      notice.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {notice.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-2">{notice.content}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span>Published: {formatDate(notice.publishedDate, 'MMM dd, yyyy HH:mm')}</span>
                    <span className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {notice.views} views
                    </span>
                    {notice.requiresAcknowledgment && (
                      <span className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {notice.acknowledgments} acknowledged
                      </span>
                    )}
                    <span>Target: {notice.targetAudience.roles.join(', ')}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditNotice(notice)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Edit Notice"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  
                  {notice.isPublished ? (
                    <button
                      onClick={() => handleUnpublishNotice(notice.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Unpublish Notice"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublishNotice(notice.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Publish Notice"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Notice"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Notice Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Notice</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Notice Title"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                    className="input-field"
                  />
                  
                  <textarea
                    placeholder="Notice Content"
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                    className="input-field"
                    rows="6"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newNotice.category}
                      onChange={(e) => setNewNotice({...newNotice, category: e.target.value})}
                      className="input-field"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    
                    <select
                      value={newNotice.priority}
                      onChange={(e) => setNewNotice({...newNotice, priority: e.target.value})}
                      className="input-field"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <div className="space-y-2">
                      <select
                        multiple
                        value={newNotice.targetAudience.roles}
                        onChange={(e) => setNewNotice({
                          ...newNotice, 
                          targetAudience: {
                            ...newNotice.targetAudience,
                            roles: Array.from(e.target.selectedOptions, option => option.value)
                          }
                        })}
                        className="input-field"
                        size="3"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requiresAcknowledgment"
                      checked={newNotice.requiresAcknowledgment}
                      onChange={(e) => setNewNotice({...newNotice, requiresAcknowledgment: e.target.checked})}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requiresAcknowledgment" className="ml-2 block text-sm text-gray-900">
                      Requires Acknowledgment
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNotice}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Create Notice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Notice Modal */}
        {showEditModal && selectedNotice && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Notice</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Notice Title"
                    value={selectedNotice.title}
                    onChange={(e) => setSelectedNotice({...selectedNotice, title: e.target.value})}
                    className="input-field"
                  />
                  
                  <textarea
                    placeholder="Notice Content"
                    value={selectedNotice.content}
                    onChange={(e) => setSelectedNotice({...selectedNotice, content: e.target.value})}
                    className="input-field"
                    rows="6"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={selectedNotice.category}
                      onChange={(e) => setSelectedNotice({...selectedNotice, category: e.target.value})}
                      className="input-field"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedNotice.priority}
                      onChange={(e) => setSelectedNotice({...selectedNotice, priority: e.target.value})}
                      className="input-field"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                    <div className="space-y-2">
                      <select
                        multiple
                        value={selectedNotice.targetAudience.roles}
                        onChange={(e) => setSelectedNotice({
                          ...selectedNotice, 
                          targetAudience: {
                            ...selectedNotice.targetAudience,
                            roles: Array.from(e.target.selectedOptions, option => option.value)
                          }
                        })}
                        className="input-field"
                        size="3"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editRequiresAcknowledgment"
                      checked={selectedNotice.requiresAcknowledgment}
                      onChange={(e) => setSelectedNotice({...selectedNotice, requiresAcknowledgment: e.target.checked})}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editRequiresAcknowledgment" className="ml-2 block text-sm text-gray-900">
                      Requires Acknowledgment
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateNotice}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Update Notice
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

export default AdminNotices;