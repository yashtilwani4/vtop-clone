import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-vtop-blue via-vtop-lightblue to-blue-600">
      {/* Navigation */}
      <nav className="relative z-10 bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-vtop-blue font-bold">VIT</span>
              </div>
              <div className="text-white">
                <h1 className="text-xl font-bold">VTOP</h1>
                <p className="text-xs opacity-90">VIT on TOP</p>
              </div>
            </div>
            <Link
              to="/login"
              className="bg-white text-vtop-blue px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to VTOP
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            VIT on TOP - Your Complete Academic Portal
          </p>
          <p className="text-lg mb-12 max-w-3xl mx-auto opacity-80">
            A digital initiative by the institute facilitating Faculty, Staff, Students, 
            Parents and Alumni to access and process Academics, Research, Supporting 
            services at one common platform.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center bg-white text-vtop-blue px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
          >
            Access Portal
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: AcademicCapIcon,
              title: 'Academic Excellence',
              description: 'Comprehensive course management and academic tracking'
            },
            {
              icon: UserGroupIcon,
              title: 'Community',
              description: 'Connect students, faculty, and parents in one platform'
            },
            {
              icon: ChartBarIcon,
              title: 'Analytics',
              description: 'Detailed insights into academic performance and progress'
            },
            {
              icon: ClockIcon,
              title: '24/7 Access',
              description: 'Access your academic information anytime, anywhere'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
              <feature.icon className="h-12 w-12 mb-4 text-white" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm opacity-90">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-black bg-opacity-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-white">
            <p className="text-sm opacity-75">
              © 2024 VIT Bhopal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;