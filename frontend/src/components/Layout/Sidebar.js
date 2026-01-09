import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  XMarkIcon,
  HomeIcon,
  UserIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon,
  UsersIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Profile', href: '/profile', icon: UserIcon },
    ];

    const studentItems = [
      { name: 'Courses', href: '/courses', icon: BookOpenIcon },
      { name: 'Course Registration', href: '/course-registration', icon: AcademicCapIcon },
      { name: 'Attendance', href: '/attendance', icon: ClipboardDocumentCheckIcon },
      { name: 'Timetable', href: '/timetable', icon: CalendarDaysIcon },
      { name: 'Results', href: '/results', icon: ChartBarIcon },
      { name: 'Notices', href: '/notices', icon: SpeakerWaveIcon },
    ];

    const facultyItems = [
      { name: 'My Courses', href: '/courses', icon: BookOpenIcon },
      { name: 'Attendance', href: '/faculty/attendance', icon: ClipboardDocumentCheckIcon },
      { name: 'Results', href: '/faculty/results', icon: ChartBarIcon },
      { name: 'Timetable', href: '/timetable', icon: CalendarDaysIcon },
      { name: 'Notices', href: '/notices', icon: SpeakerWaveIcon },
    ];

    const adminItems = [
      { name: 'Users', href: '/admin/users', icon: UsersIcon },
      { name: 'Courses', href: '/admin/courses', icon: AcademicCapIcon },
      { name: 'Notices', href: '/admin/notices', icon: SpeakerWaveIcon },
      { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
      { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    ];

    let roleItems = [];
    switch (user?.role) {
      case 'student':
        roleItems = studentItems;
        break;
      case 'faculty':
        roleItems = facultyItems;
        break;
      case 'admin':
        roleItems = adminItems;
        break;
      default:
        roleItems = studentItems;
    }

    return [...commonItems, ...roleItems];
  };

  const navigation = getNavigationItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo and Title */}
      <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-vtop-blue to-vtop-lightblue">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-vtop-blue font-bold text-sm">VIT</span>
          </div>
          <div className="text-white">
            <h1 className="text-lg font-bold">VTOP</h1>
            <p className="text-xs opacity-90">Academic Portal</p>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          type="button"
          className="lg:hidden text-white hover:text-gray-200"
          onClick={onClose}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-vtop-blue to-vtop-lightblue rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.userId} • {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive: navIsActive }) =>
                clsx(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive || navIsActive
                    ? 'bg-vtop-blue text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-vtop-blue'
                )
              }
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-vtop-blue'
                )}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 VIT Bhopal
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 shadow-sm">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;