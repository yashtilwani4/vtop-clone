# Notice APIs Documentation

## Overview
This document describes the Notice APIs for the VTOP Academic Portal, providing functionality for administrators to create notices, all users to view notices, and sorting by latest with comprehensive filtering and search capabilities.

## Features
- ✅ **Admin Creates Notices** (Complete notice management with rich content)
- ✅ **All Users Can View Notices** (Public and authenticated access)
- ✅ **Sort by Latest** (Multiple sorting options including latest, priority, category)
- ✅ **Advanced Filtering** (Category, priority, target audience, search)
- ✅ **View Tracking** (Track notice views and engagement)
- ✅ **Rich Content Support** (Attachments, tags, summaries)
- ✅ **Targeted Notifications** (Department, program, semester-specific)

## Authentication
Most endpoints support optional authentication. Authenticated users get personalized content.
```
Authorization: Bearer <jwt_token>
```

## Notice Structure

### Notice Categories
- **Academic**: Academic announcements and updates
- **Examination**: Exam schedules, results, instructions
- **Admission**: Admission-related notices
- **Fee**: Fee payment deadlines and updates
- **Event**: Campus events and activities
- **Holiday**: Holiday announcements
- **Emergency**: Urgent notifications
- **General**: General announcements
- **Placement**: Job placement and career notices
- **Research**: Research opportunities and updates
- **Sports**: Sports events and activities
- **Cultural**: Cultural events and programs

### Priority Levels
- **Low**: Regular announcements
- **Medium**: Standard notices (default)
- **High**: Important notices
- **Urgent**: Critical notifications requiring immediate attention

### Target Audiences
- **All**: Visible to everyone (default)
- **Students**: Only for students
- **Faculty**: Only for faculty members
- **Admin**: Only for administrators

### Notice Status
- **Draft**: Under creation, not visible to users
- **Published**: Active and visible to target audience
- **Archived**: Soft-deleted notices

## API Endpoints

### 1. Create Notice (Admin Only)
**POST** `/api/simple-notices/create`

Create a new notice with rich content and targeting options.

#### Request Body
```json
{
  "title": "Mid-Semester Examination Schedule",
  "content": "The mid-semester examinations for all departments will be conducted from March 15-25, 2024. Students are advised to check their individual timetables on the portal. All examinations will be held in offline mode following COVID-19 safety protocols.",
  "summary": "Mid-semester exams from March 15-25, 2024. Check individual timetables online.",
  "category": "Examination",
  "priority": "High",
  "targetAudience": "Students",
  "targetDepartments": ["CSE", "ECE", "MECH"],
  "targetPrograms": ["B.Tech", "M.Tech"],
  "targetSemesters": [2, 4, 6, 8],
  "expiryDate": "2024-03-30T23:59:59.000Z",
  "attachments": [
    {
      "fileName": "exam_schedule.pdf",
      "fileUrl": "https://example.com/files/exam_schedule.pdf",
      "fileSize": 245760,
      "fileType": "pdf"
    }
  ],
  "tags": ["examination", "schedule", "mid-semester", "offline"],
  "status": "Published"
}
```

#### Response
```json
{
  "success": true,
  "message": "Notice created successfully",
  "data": {
    "notice": {
      "id": "notice_id",
      "title": "Mid-Semester Examination Schedule",
      "content": "The mid-semester examinations for all departments...",
      "summary": "Mid-semester exams from March 15-25, 2024. Check individual timetables online.",
      "category": "Examination",
      "priority": "High",
      "targetAudience": "Students",
      "targetDepartments": ["CSE", "ECE", "MECH"],
      "targetPrograms": ["B.Tech", "M.Tech"],
      "targetSemesters": [2, 4, 6, 8],
      "status": "Published",
      "publishedDate": "2024-01-15T10:00:00.000Z",
      "expiryDate": "2024-03-30T23:59:59.000Z",
      "attachments": [
        {
          "fileName": "exam_schedule.pdf",
          "fileUrl": "https://example.com/files/exam_schedule.pdf",
          "fileSize": 245760,
          "fileType": "pdf",
          "uploadedAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "tags": ["examination", "schedule", "mid-semester", "offline"],
      "slug": "mid-semester-examination-schedule",
      "viewCount": 0,
      "readingTime": 1,
      "publishedBy": {
        "_id": "admin_id",
        "name": "Admin User",
        "email": "admin@university.edu"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### 2. Get All Notices (Public with Optional Auth)
**GET** `/api/simple-notices/all`

Fetch all notices sorted by latest with filtering options. Supports both public and authenticated access.

#### Query Parameters
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `category` (optional) - Filter by category
- `priority` (optional) - Filter by priority
- `search` (optional) - Search in title, content, and tags
- `sortBy` (optional) - Sort order: `latest`, `priority`, `category`, `views` (default: `latest`)

#### Response
```json
{
  "success": true,
  "data": {
    "notices": [
      {
        "id": "notice_id",
        "title": "Mid-Semester Examination Schedule",
        "summary": "Mid-semester exams from March 15-25, 2024. Check individual timetables online.",
        "category": "Examination",
        "priority": "High",
        "targetAudience": "Students",
        "publishedDate": "2024-01-15T10:00:00.000Z",
        "expiryDate": "2024-03-30T23:59:59.000Z",
        "viewCount": 245,
        "tags": ["examination", "schedule", "mid-semester", "offline"],
        "slug": "mid-semester-examination-schedule",
        "readingTime": 1,
        "daysSincePublished": 5,
        "isViewed": false,
        "publisherName": "Admin User",
        "publisherEmail": "admin@university.edu",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": "notice_id_2",
        "title": "Cultural Fest Registration Open",
        "summary": "Annual cultural fest registration is now open. Submit your entries by February 20th.",
        "category": "Cultural",
        "priority": "Medium",
        "targetAudience": "All",
        "publishedDate": "2024-01-14T15:30:00.000Z",
        "expiryDate": "2024-02-25T23:59:59.000Z",
        "viewCount": 156,
        "tags": ["cultural", "fest", "registration", "events"],
        "slug": "cultural-fest-registration-open",
        "readingTime": 2,
        "daysSincePublished": 6,
        "isViewed": true,
        "publisherName": "Event Coordinator",
        "publisherEmail": "events@university.edu",
        "createdAt": "2024-01-14T15:30:00.000Z",
        "updatedAt": "2024-01-14T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "category": null,
      "priority": null,
      "search": null,
      "sortBy": "latest"
    }
  }
}
```

---

### 3. Get Notice by ID
**GET** `/api/simple-notices/:id`

Fetch a specific notice by ID or slug. Tracks views for authenticated users.

#### Response
```json
{
  "success": true,
  "data": {
    "notice": {
      "id": "notice_id",
      "title": "Mid-Semester Examination Schedule",
      "content": "The mid-semester examinations for all departments will be conducted from March 15-25, 2024. Students are advised to check their individual timetables on the portal. All examinations will be held in offline mode following COVID-19 safety protocols.\n\nImportant Instructions:\n1. Carry your ID card and admit card\n2. Arrive 30 minutes before exam time\n3. Mobile phones are strictly prohibited\n4. Follow all safety protocols",
      "summary": "Mid-semester exams from March 15-25, 2024. Check individual timetables online.",
      "category": "Examination",
      "priority": "High",
      "targetAudience": "Students",
      "targetDepartments": ["CSE", "ECE", "MECH"],
      "targetPrograms": ["B.Tech", "M.Tech"],
      "targetSemesters": [2, 4, 6, 8],
      "status": "Published",
      "publishedDate": "2024-01-15T10:00:00.000Z",
      "expiryDate": "2024-03-30T23:59:59.000Z",
      "attachments": [
        {
          "fileName": "exam_schedule.pdf",
          "fileUrl": "https://example.com/files/exam_schedule.pdf",
          "fileSize": 245760,
          "fileType": "pdf",
          "uploadedAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "tags": ["examination", "schedule", "mid-semester", "offline"],
      "slug": "mid-semester-examination-schedule",
      "viewCount": 246,
      "readingTime": 2,
      "daysSincePublished": 5,
      "isExpired": false,
      "isCurrent": true,
      "publishedBy": {
        "id": "admin_id",
        "name": "Admin User",
        "email": "admin@university.edu"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### 4. Update Notice (Admin Only)
**PUT** `/api/simple-notices/:id`

Update an existing notice.

#### Request Body
```json
{
  "title": "Updated: Mid-Semester Examination Schedule",
  "content": "Updated examination schedule with new timings...",
  "priority": "Urgent",
  "expiryDate": "2024-04-15T23:59:59.000Z",
  "tags": ["examination", "schedule", "mid-semester", "updated"]
}
```

#### Response
```json
{
  "success": true,
  "message": "Notice updated successfully",
  "data": {
    "notice": {
      "id": "notice_id",
      "title": "Updated: Mid-Semester Examination Schedule",
      "content": "Updated examination schedule with new timings...",
      "summary": "Updated examination schedule with new timings...",
      "category": "Examination",
      "priority": "Urgent",
      "targetAudience": "Students",
      "status": "Published",
      "publishedDate": "2024-01-15T10:00:00.000Z",
      "expiryDate": "2024-04-15T23:59:59.000Z",
      "tags": ["examination", "schedule", "mid-semester", "updated"],
      "slug": "updated-mid-semester-examination-schedule",
      "viewCount": 246,
      "version": 2,
      "publishedBy": {
        "_id": "admin_id",
        "name": "Admin User",
        "email": "admin@university.edu"
      },
      "lastModifiedBy": "admin_id",
      "updatedAt": "2024-01-20T14:30:00.000Z"
    }
  }
}
```

---

### 5. Delete Notice (Admin Only)
**DELETE** `/api/simple-notices/:id`

Soft delete a notice by archiving it.

#### Response
```json
{
  "success": true,
  "message": "Notice deleted successfully",
  "data": {
    "deletedNotice": {
      "id": "notice_id",
      "title": "Mid-Semester Examination Schedule",
      "status": "Archived",
      "deletedAt": "2024-01-20T15:00:00.000Z"
    }
  }
}
```

---

### 6. Admin Notice Management
**GET** `/api/simple-notices/admin/manage`

Get all notices for admin management with advanced filtering.

#### Query Parameters
- `page` (optional) - Page number
- `limit` (optional) - Items per page
- `status` (optional) - Filter by status (Draft/Published/Archived)
- `category` (optional) - Filter by category
- `priority` (optional) - Filter by priority
- `search` (optional) - Search query
- `sortBy` (optional) - Sort order: `latest`, `published`, `priority`, `views`

#### Response
```json
{
  "success": true,
  "data": {
    "notices": [
      {
        "id": "notice_id",
        "title": "Mid-Semester Examination Schedule",
        "summary": "Mid-semester exams from March 15-25, 2024...",
        "category": "Examination",
        "priority": "High",
        "targetAudience": "Students",
        "status": "Published",
        "isActive": true,
        "publishedDate": "2024-01-15T10:00:00.000Z",
        "expiryDate": "2024-03-30T23:59:59.000Z",
        "viewCount": 246,
        "tags": ["examination", "schedule"],
        "slug": "mid-semester-examination-schedule",
        "version": 1,
        "readingTime": 2,
        "daysSincePublished": 5,
        "isExpired": false,
        "isCurrent": true,
        "publishedBy": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@university.edu"
        },
        "lastModifiedBy": null,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "status": "Published",
      "category": null,
      "priority": null,
      "search": null,
      "sortBy": "latest"
    }
  }
}
```

---

### 7. Search Notices
**GET** `/api/simple-notices/search`

Search notices using text search with relevance scoring.

#### Query Parameters
- `q` (required) - Search query (minimum 2 characters)
- `page` (optional) - Page number
- `limit` (optional) - Items per page
- `category` (optional) - Filter by category
- `priority` (optional) - Filter by priority

#### Response
```json
{
  "success": true,
  "data": {
    "query": "examination schedule",
    "results": [
      {
        "id": "notice_id",
        "title": "Mid-Semester Examination Schedule",
        "summary": "Mid-semester exams from March 15-25, 2024...",
        "category": "Examination",
        "priority": "High",
        "publishedDate": "2024-01-15T10:00:00.000Z",
        "viewCount": 246,
        "tags": ["examination", "schedule", "mid-semester"],
        "slug": "mid-semester-examination-schedule",
        "score": 2.5,
        "publisherName": "Admin User",
        "readingTime": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3
    }
  }
}
```

---

### 8. Get Notice Statistics (Admin Only)
**GET** `/api/simple-notices/stats`

Get comprehensive notice statistics and analytics.

#### Query Parameters
- `startDate` (optional) - Start date for filtering
- `endDate` (optional) - End date for filtering

#### Response
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalNotices": 45,
      "publishedNotices": 32,
      "draftNotices": 8,
      "archivedNotices": 5,
      "totalViews": 2456,
      "avgViewsPerNotice": 54.58
    },
    "categoryDistribution": [
      {
        "_id": "Academic",
        "count": 12,
        "totalViews": 856,
        "avgViews": 71.33
      },
      {
        "_id": "Examination",
        "count": 8,
        "totalViews": 1245,
        "avgViews": 155.63
      },
      {
        "_id": "Event",
        "count": 6,
        "totalViews": 234,
        "avgViews": 39.0
      }
    ],
    "priorityDistribution": [
      {
        "_id": "Medium",
        "count": 20,
        "totalViews": 1200
      },
      {
        "_id": "High",
        "count": 15,
        "totalViews": 1100
      },
      {
        "_id": "Urgent",
        "count": 5,
        "totalViews": 156
      }
    ],
    "additionalMetrics": {
      "recentNotices": 8,
      "expiredNotices": 3,
      "topViewedNotices": [
        {
          "_id": "notice_id",
          "title": "Final Semester Results",
          "viewCount": 456,
          "publishedDate": "2024-01-10T10:00:00.000Z",
          "category": "Academic",
          "publishedBy": {
            "_id": "admin_id",
            "name": "Admin User"
          }
        }
      ]
    },
    "filters": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }
}
```

---

### 9. Publish Notice (Admin Only)
**PUT** `/api/simple-notices/:id/publish`

Publish a draft notice to make it visible to users.

#### Response
```json
{
  "success": true,
  "message": "Notice published successfully",
  "data": {
    "notice": {
      "id": "notice_id",
      "title": "Mid-Semester Examination Schedule",
      "status": "Published",
      "publishedDate": "2024-01-20T16:00:00.000Z",
      "version": 2
    }
  }
}
```

## Sorting Options

### Available Sort Orders
1. **latest** (default) - Sort by published date (newest first)
2. **priority** - Sort by priority level (Urgent → High → Medium → Low)
3. **category** - Sort alphabetically by category
4. **views** - Sort by view count (most viewed first)

### Example Usage
```javascript
// Get latest notices
GET /api/simple-notices/all?sortBy=latest

// Get notices by priority
GET /api/simple-notices/all?sortBy=priority

// Get most viewed notices
GET /api/simple-notices/all?sortBy=views&limit=5
```

## Filtering Options

### Category Filtering
```javascript
// Get only examination notices
GET /api/simple-notices/all?category=Examination

// Get academic notices sorted by priority
GET /api/simple-notices/all?category=Academic&sortBy=priority
```

### Priority Filtering
```javascript
// Get only urgent notices
GET /api/simple-notices/all?priority=Urgent

// Get high priority notices
GET /api/simple-notices/all?priority=High
```

### Combined Filtering
```javascript
// Get urgent examination notices
GET /api/simple-notices/all?category=Examination&priority=Urgent

// Search in academic notices
GET /api/simple-notices/all?category=Academic&search=semester
```

## Targeting System

### Target Audience Options
- **All**: Visible to everyone (public notices)
- **Students**: Only visible to students
- **Faculty**: Only visible to faculty members
- **Admin**: Only visible to administrators

### Advanced Targeting
```json
{
  "targetAudience": "Students",
  "targetDepartments": ["CSE", "ECE"],
  "targetPrograms": ["B.Tech"],
  "targetSemesters": [2, 4, 6, 8]
}
```

This notice will only be visible to B.Tech students in CSE and ECE departments who are in semesters 2, 4, 6, or 8.

## View Tracking

### Automatic View Tracking
- Views are automatically tracked for authenticated users
- Each user can only be counted once per notice
- View count is updated in real-time
- IP addresses are logged for analytics

### View Statistics
```json
{
  "viewCount": 246,
  "views": [
    {
      "userId": "user_id",
      "viewedAt": "2024-01-15T14:30:00.000Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

## Rich Content Features

### Attachments Support
```json
{
  "attachments": [
    {
      "fileName": "exam_schedule.pdf",
      "fileUrl": "https://example.com/files/exam_schedule.pdf",
      "fileSize": 245760,
      "fileType": "pdf",
      "uploadedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### Tags and SEO
```json
{
  "tags": ["examination", "schedule", "mid-semester", "offline"],
  "slug": "mid-semester-examination-schedule"
}
```

### Auto-generated Content
- **Summary**: Auto-generated from content if not provided
- **Slug**: Auto-generated from title for SEO-friendly URLs
- **Reading Time**: Calculated based on content length
- **Days Since Published**: Automatically calculated

## Usage Examples

### Admin Creating a Notice
```javascript
const createNotice = async () => {
  const noticeData = {
    title: 'Holiday Notice - Republic Day',
    content: 'The university will remain closed on January 26th, 2024 on account of Republic Day. Regular classes will resume on January 27th, 2024.',
    category: 'Holiday',
    priority: 'Medium',
    targetAudience: 'All',
    expiryDate: '2024-01-27T23:59:59.000Z',
    tags: ['holiday', 'republic-day', 'closure'],
    status: 'Published'
  };

  const response = await fetch('/api/simple-notices/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(noticeData)
  });

  const result = await response.json();
  console.log('Notice created:', result);
};
```

### Fetching Latest Notices
```javascript
const getLatestNotices = async () => {
  const response = await fetch('/api/simple-notices/all?sortBy=latest&limit=5');
  const result = await response.json();
  
  console.log('Latest notices:', result.data.notices);
  result.data.notices.forEach(notice => {
    console.log(`${notice.title} - ${notice.daysSincePublished} days ago`);
  });
};
```

### Searching Notices
```javascript
const searchNotices = async (query) => {
  const response = await fetch(`/api/simple-notices/search?q=${encodeURIComponent(query)}`);
  const result = await response.json();
  
  console.log(`Found ${result.data.results.length} results for "${query}"`);
  result.data.results.forEach(notice => {
    console.log(`${notice.title} (Score: ${notice.score})`);
  });
};
```

## Frontend Integration Examples

### Notice List Component
```javascript
const NoticeList = ({ notices, onNoticeClick }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50';
      case 'High': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-blue-600 bg-blue-50';
      case 'Low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Academic': '📚',
      'Examination': '📝',
      'Event': '🎉',
      'Holiday': '🏖️',
      'Emergency': '🚨',
      'General': '📢'
    };
    return icons[category] || '📄';
  };

  return (
    <div className="notice-list space-y-4">
      {notices.map(notice => (
        <div 
          key={notice.id} 
          className="notice-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNoticeClick(notice)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getCategoryIcon(notice.category)}</span>
              <span className="text-sm text-gray-500">{notice.category}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                {notice.priority}
              </span>
              {!notice.isViewed && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {notice.title}
          </h3>
          
          <p className="text-gray-600 mb-3 line-clamp-2">
            {notice.summary}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>👁️ {notice.viewCount} views</span>
              <span>⏱️ {notice.readingTime} min read</span>
              <span>📅 {notice.daysSincePublished} days ago</span>
            </div>
            <span>By {notice.publisherName}</span>
          </div>
          
          {notice.tags && notice.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {notice.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  #{tag}
                </span>
              ))}
              {notice.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{notice.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Notice Filters Component
```javascript
const NoticeFilters = ({ filters, onFilterChange }) => {
  const categories = [
    'Academic', 'Examination', 'Event', 'Holiday', 
    'Emergency', 'General', 'Placement', 'Research'
  ];
  
  const priorities = ['Urgent', 'High', 'Medium', 'Low'];
  const sortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'priority', label: 'By Priority' },
    { value: 'category', label: 'By Category' },
    { value: 'views', label: 'Most Viewed' }
  ];

  return (
    <div className="notice-filters bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select 
            value={filters.category || ''} 
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select 
            value={filters.priority || ''} 
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select 
            value={filters.sortBy || 'latest'} 
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search notices..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
};
```

### Notice Detail Modal
```javascript
const NoticeDetailModal = ({ notice, isOpen, onClose }) => {
  if (!isOpen || !notice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                  {notice.category}
                </span>
                <span className={`px-2 py-1 text-sm rounded ${
                  notice.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                  notice.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {notice.priority}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {notice.title}
              </h2>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span>📅 {new Date(notice.publishedDate).toLocaleDateString()}</span>
                <span>👁️ {notice.viewCount} views</span>
                <span>⏱️ {notice.readingTime} min read</span>
                <span>By {notice.publishedBy?.name}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-700">
              {notice.content}
            </div>
          </div>
          
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Attachments</h3>
              <div className="space-y-2">
                {notice.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-2xl">📎</span>
                    <div>
                      <div className="font-medium">{attachment.fileName}</div>
                      <div className="text-sm text-gray-500">
                        {attachment.fileType?.toUpperCase()} • {Math.round(attachment.fileSize / 1024)} KB
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {notice.tags && notice.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {notice.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Error Handling

### Common Error Responses

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Title is required",
    "Content cannot exceed 5000 characters",
    "Expiry date must be after published date"
  ]
}
```

#### Authorization Error
```json
{
  "success": false,
  "message": "Admin access required"
}
```

#### Not Found Error
```json
{
  "success": false,
  "message": "Notice not found"
}
```

#### Search Error
```json
{
  "success": false,
  "message": "Search query must be at least 2 characters long"
}
```

## Security Features

### 1. Role-Based Access Control
- **Admin**: Full notice management capabilities
- **Faculty**: Can create notices (if enabled)
- **Students**: Read-only access to published notices
- **Public**: Access to notices marked as "All"

### 2. Content Validation
- Title length limits (200 characters)
- Content length limits (5000 characters)
- File size validation for attachments
- XSS protection through content sanitization

### 3. Targeting Security
- Users only see notices targeted to their profile
- Department/program/semester filtering
- Expired notice automatic hiding

### 4. View Tracking Privacy
- Anonymous view tracking for public users
- User-specific tracking for authenticated users
- IP address logging for analytics

## Performance Optimizations

### Database Efficiency
- Text indexes for fast search
- Compound indexes for filtering
- Pagination for large datasets
- Aggregation pipelines for statistics

### Caching Strategies
- Cache frequently accessed notices
- Cache search results
- Cache user-specific notice lists
- Invalidate cache on updates

### API Performance
- Selective field projection
- Efficient population of references
- Optimized aggregation queries
- Minimal data transfer

## File Locations

- **Schema**: `server/models/SimpleNotice.js`
- **Routes**: `server/routes/simpleNotices.js`
- **Documentation**: `server/NOTICE_API_DOCS.md`

## Integration Notes

1. **Database Relationships**: Notices reference SimpleUser model for publishers
2. **Search Functionality**: Full-text search with relevance scoring
3. **Real-time Features**: View tracking and engagement metrics
4. **SEO Optimization**: Auto-generated slugs and meta information
5. **Content Management**: Rich content support with attachments and tags

The Notice API system provides comprehensive functionality for academic announcements with advanced filtering, search capabilities, and user engagement tracking. It supports both public and authenticated access with role-based content targeting and real-time analytics.