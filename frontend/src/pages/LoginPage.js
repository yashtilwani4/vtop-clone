import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import CaptchaComponent from '../components/CaptchaComponent';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [captchaValue, setCaptchaValue] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [resetCaptcha, setResetCaptcha] = useState(false);

  const { login, error, clearError } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle CAPTCHA changes
  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleCaptchaValidation = (isValid) => {
    setIsCaptchaValid(isValid);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId.trim()) {
      newErrors.userId = 'User ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!isCaptchaValid) {
      newErrors.captcha = 'Please complete CAPTCHA verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await login({
        userId: formData.userId.trim(),
        password: formData.password
      });

      if (result.success) {
        showSuccess('Login successful! Welcome to VTOP.');
        navigate(from, { replace: true });
      } else {
        showError(result.error || 'Login failed. Please try again.');
        // Reset CAPTCHA on failed login
        setResetCaptcha(prev => !prev);
        setCaptchaValue('');
        setIsCaptchaValid(false);
      }
    } catch (err) {
      showError('An unexpected error occurred. Please try again.');
      // Reset CAPTCHA on error
      setResetCaptcha(prev => !prev);
      setCaptchaValue('');
      setIsCaptchaValid(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-academic-light via-gray-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-5"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Login Card */}
        <div className="vtop-card p-8 space-y-6 fade-in">
          {/* Header */}
          <div className="text-center">
            {/* University Logo */}
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-vtop-blue to-vtop-lightblue rounded-full flex items-center justify-center mb-4 shadow-vtop">
              <span className="text-white text-2xl font-bold">VIT</span>
            </div>
            
            <h1 className="text-3xl font-bold text-academic-slate mb-2">
              Welcome to VTOP
            </h1>
            <p className="text-sm text-academic-gray">
              VIT on TOP - Academic Portal
            </p>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-vtop-blue to-vtop-lightblue mx-auto rounded-full"></div>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User ID Field */}
            <div className="form-group">
              <label htmlFor="userId" className="form-label">
                User ID / Email
              </label>
              <input
                id="userId"
                name="userId"
                type="text"
                autoComplete="username"
                required
                value={formData.userId}
                onChange={handleInputChange}
                className={`vtop-input ${errors.userId ? 'input-field-error' : ''}`}
                placeholder="Enter your User ID or Email"
                disabled={loading}
              />
              {errors.userId && (
                <p className="form-error">{errors.userId}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`vtop-input pr-12 ${errors.password ? 'input-field-error' : ''}`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-academic-gray hover:text-vtop-blue transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-academic-gray hover:text-vtop-blue transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            {/* CAPTCHA Field */}
            <CaptchaComponent
              onCaptchaChange={handleCaptchaChange}
              onValidationChange={handleCaptchaValidation}
              reset={resetCaptcha}
            />
            {errors.captcha && (
              <p className="form-error">{errors.captcha}</p>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-vtop-blue focus:ring-vtop-blue border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-academic-gray">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-vtop-blue hover:text-vtop-lightblue font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !isCaptchaValid}
                className="w-full vtop-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="small" color="white" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="alert-error">
                <p className="text-sm text-center">{error}</p>
              </div>
            )}
          </form>

          {/* Footer Links */}
          <div className="text-center space-y-3 pt-6 border-t border-gray-200">
            <p className="text-xs text-academic-gray">
              Having trouble logging in? Contact your system administrator.
            </p>
            <Link
              to="/"
              className="inline-flex items-center text-sm text-vtop-blue hover:text-vtop-lightblue font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-academic-gray text-sm space-y-2">
          <p className="opacity-90">
            Secure login powered by VIT Bhopal
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs opacity-75">
            <span>© 2024 VIT Bhopal</span>
            <span>•</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;