import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon,
  MapPinIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const TimetablePage = () => {
  const { user } = useAuth();
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState('current');

  // Time slots for the timetable
  const timeSlots = [
    { id: 1, time: '08:00', displayTime: '8:00 AM', endTime: '8:50 AM' },
    { id: 2, time: '09:00', displayTime: '9:00 AM', endTime: '9:50 AM' },
    { id: 3, time: '10:00', displayTime: '10:00 AM', endTime: '10:50 AM' },
    { id: 4, time: '11:00', displayTime: '11:00 AM', endTime: '11:50 AM' },
    { id: 5, time: '12:00', displayTime: '12:00 PM', endTime: '12:50 PM' },
    { id: 6, time: '13:00', displayTime: '1:00 PM', endTime: '1:50 PM' },
    { id: 7, time: '14:00', displayTime: '2:00 PM', endTime: '2:50 PM' },
    { id: 8, time: '15:00', displayTime: '3:00 PM', endTime: '3:50 PM' },
    { id: 9, time: '16:00', displayTime: '4:00 PM', endTime: '4:50 PM' },
    { id: 10, time: '17:00', displayTime: '5:00 PM', endTime: '5:50 PM' }
  ];

  // Days of the week
  const daysOfWeek = [
    { id: 'monday', name: 'Monday', short: 'Mon' },
    { id: 'tuesday', name: 'Tuesday', short: 'Tue' },
    { id: 'wednesday', name: 'Wednesday', short: 'Wed' },
    { id: 'thursday', name: 'Thursday', short: 'Thu' },
    { id: 'friday', name: 'Friday', short: 'Fri' },
    { id: 'saturday', name: 'Saturday', short: 'Sat' }
  ];

  // Fetch timetable data from API
  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        setLoading(true);
        // In real implementation, this would be an API call
        // For now, set empty data since database is cleared
        setTimetableData({});
        setLoading(false);
      } catch (error) {
        console.error('Error fetching timetable data:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchTimetableData();
    }
  }, [currentWeek, user]);

  // Get current date info
  const getCurrentWeekInfo = () => {
    const today = new Date();
    const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return {
      currentDay: currentDay.toLowerCase(),
      weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  const weekInfo = getCurrentWeekInfo();

  // Get class for current day/time
  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    return timeSlots.find(slot => {
      const slotHour = parseInt(slot.time.split(':')[0]);
      const slotTime = slotHour * 60;
      return currentTime >= slotTime && currentTime < slotTime + 50;
    });
  };

  const currentTimeSlot = getCurrentTimeSlot();

  // Check if a cell is the current time slot
  const isCurrentTimeSlot = (day, timeSlot) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return day === today && currentTimeSlot && timeSlot.time === currentTimeSlot.time;
  };

  // Get total classes for the week
  const getTotalClasses = () => {
    let total = 0;
    Object.values(timetableData).forEach(day => {
      total += Object.keys(day).length;
    });
    return total;
  };

  // Get unique courses
  const getUniqueCourses = () => {
    const courses = new Set();
    Object.values(timetableData).forEach(day => {
      Object.values(day).forEach(classItem => {
        courses.add(classItem.courseCode);
      });
    });
    return courses.size;
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
              <h1 className="text-2xl font-bold mb-2">Weekly Timetable</h1>
              <p className="text-blue-100">
                Week of {weekInfo.weekStart} - {weekInfo.weekEnd}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{getTotalClasses()}</p>
                <p className="text-xs text-blue-600 mt-1">This week</p>
              </div>
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{getUniqueCourses()}</p>
                <p className="text-xs text-green-600 mt-1">Different subjects</p>
              </div>
              <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Day</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 capitalize">{weekInfo.currentDay}</p>
                <p className="text-xs text-purple-600 mt-1">Today's schedule</p>
              </div>
              <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Schedule View</h3>
            <select
              value={currentWeek}
              onChange={(e) => setCurrentWeek(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vtop-blue focus:border-transparent"
            >
              <option value="current">Current Week</option>
              <option value="next">Next Week</option>
              <option value="previous">Previous Week</option>
            </select>
          </div>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-vtop-blue" />
              Weekly Schedule
            </h3>
          </div>
          
          {/* Desktop Timetable */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Time
                  </th>
                  {daysOfWeek.map((day) => (
                    <th
                      key={day.id}
                      className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                        day.id === weekInfo.currentDay
                          ? 'bg-vtop-blue text-white'
                          : 'text-gray-500'
                      }`}
                    >
                      <div>{day.name}</div>
                      <div className="text-xs font-normal mt-1 opacity-75">{day.short}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((timeSlot) => (
                  <tr key={timeSlot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                      <div className="text-center">
                        <div className="font-semibold">{timeSlot.displayTime}</div>
                        <div className="text-xs text-gray-500">{timeSlot.endTime}</div>
                      </div>
                    </td>
                    {daysOfWeek.map((day) => {
                      const classData = timetableData[day.id]?.[timeSlot.time];
                      const isCurrentSlot = isCurrentTimeSlot(day.id, timeSlot);
                      
                      return (
                        <td
                          key={`${day.id}-${timeSlot.time}`}
                          className={`px-2 py-2 text-center relative ${
                            isCurrentSlot ? 'bg-yellow-50 ring-2 ring-yellow-300' : ''
                          }`}
                        >
                          {classData ? (
                            <div className={`p-3 rounded-lg border-2 ${classData.color} hover:shadow-md transition-shadow cursor-pointer`}>
                              <div className="font-semibold text-sm mb-1">
                                {classData.courseCode}
                              </div>
                              <div className="text-xs mb-2 line-clamp-2">
                                {classData.courseName}
                              </div>
                              <div className="flex items-center justify-center text-xs mb-1">
                                <UserIcon className="h-3 w-3 mr-1" />
                                <span className="truncate">{classData.faculty}</span>
                              </div>
                              <div className="flex items-center justify-center text-xs">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                <span>{classData.room}</span>
                              </div>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-white bg-opacity-50">
                                  {classData.type}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-24 flex items-center justify-center text-gray-400">
                              <span className="text-xs">Free</span>
                            </div>
                          )}
                          {isCurrentSlot && (
                            <div className="absolute top-1 right-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Timetable */}
          <div className="lg:hidden">
            {Object.keys(timetableData).length > 0 ? (
              daysOfWeek.map((day) => (
                <div key={day.id} className="border-b border-gray-200 last:border-b-0">
                  <div className={`px-4 py-3 font-semibold ${
                    day.id === weekInfo.currentDay
                      ? 'bg-vtop-blue text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}>
                    {day.name}
                  </div>
                  <div className="p-4 space-y-3">
                    {timeSlots
                      .filter(timeSlot => timetableData[day.id]?.[timeSlot.time])
                      .map((timeSlot) => {
                        const classData = timetableData[day.id][timeSlot.time];
                        const isCurrentSlot = isCurrentTimeSlot(day.id, timeSlot);
                        
                        return (
                          <div
                            key={`${day.id}-${timeSlot.time}`}
                            className={`p-4 rounded-lg border-2 ${classData.color} ${
                              isCurrentSlot ? 'ring-2 ring-yellow-300' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-semibold text-lg">{classData.courseCode}</div>
                              <div className="text-sm font-medium">
                                {timeSlot.displayTime} - {timeSlot.endTime}
                              </div>
                            </div>
                            <div className="text-sm mb-2">{classData.courseName}</div>
                            <div className="flex items-center text-sm mb-1">
                              <UserIcon className="h-4 w-4 mr-2" />
                              <span>{classData.faculty}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm">
                                <MapPinIcon className="h-4 w-4 mr-2" />
                                <span>{classData.room}</span>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white bg-opacity-50">
                                {classData.type}
                              </span>
                            </div>
                            {isCurrentSlot && (
                              <div className="mt-2 flex items-center text-xs text-yellow-700">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                                Current Class
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {!timeSlots.some(timeSlot => timetableData[day.id]?.[timeSlot.time]) && (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No classes scheduled</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">No timetable available</p>
                <p className="text-gray-400">Your class schedule will appear here once courses are assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span className="text-sm text-gray-700">Lecture</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
              <span className="text-sm text-gray-700">Lab</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-purple-100 border-2 border-purple-300 rounded"></div>
              <span className="text-sm text-gray-700">Tutorial</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">Current Time</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimetablePage;