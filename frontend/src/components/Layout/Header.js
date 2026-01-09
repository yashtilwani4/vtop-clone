import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatName } from '../../utils/helpers';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      student: 'Student',
      faculty: 'Faculty',
      admin: 'Administrator'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      faculty: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Welcome message */}
        <div className="flex items-center flex-1 min-w-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
          {/* Role Badge - Hidden on small screens */}
          <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
            {getRoleDisplayName(user?.role)}
          </span>

          {/* Notifications */}
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500 transition-colors"
            onClick={() => navigate('/notices')}
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">3</span>
            </span>
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-x-1 sm:gap-x-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 rounded-lg px-2 sm:px-3 py-2 transition-colors">
              <span className="sr-only">Open user menu</span>
              {user?.profilePicture ? (
                <img
                  className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-50 object-cover"
                  src={user.profilePicture}
                  alt={formatName(user.firstName, user.lastName)}
                />
              ) : (
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-vtop-blue to-vtop-lightblue flex items-center justify-center">
                  <span className="text-white font-semibold text-xs sm:text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-2 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {formatName(user?.firstName, user?.lastName)}
                </span>
                <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {/* User Info */}
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {formatName(user?.firstName, user?.lastName)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {user?.userId}
                  </p>
                </div>

                {/* Menu Items */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/profile')}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } flex w-full items-center px-3 py-2 text-sm leading-6 text-gray-900`}
                    >
                      <UserCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
                      View Profile
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/profile?tab=settings')}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } flex w-full items-center px-3 py-2 text-sm leading-6 text-gray-900`}
                    >
                      <Cog6ToothIcon className="mr-3 h-4 w-4 text-gray-400" />
                      Account Settings
                    </button>
                  )}
                </Menu.Item>
                
                {/* Divider */}
                <div className="my-1 h-px bg-gray-100" />
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } flex w-full items-center px-3 py-2 text-sm leading-6 text-gray-900`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-gray-400" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;