import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, EnvelopeIcon, KeyIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../contexts/NotificationContext';
import CaptchaComponent from '../components/CaptchaComponent';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [formData, setFormData] = useState({
    identifier: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetData, setResetData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [captchaValue, setCaptchaValue] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [resetCaptcha, setResetCaptcha] = useState(false);

  const { showError, showSuccess, showInfo } = useNotification();

  // Timer for OTP expiry
  React.useEffect(() => {
    let timer;
    if (timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            showError('OTP has expired. Please request a new one.');
            setCurrentStep(1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeRemaining, showError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleCaptchaValidation = (isValid) => {
    setIsCaptchaValid(isValid);
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or Registration Number is required';
    }

    if (!isCaptchaValid) {
      newErrors.captcha = 'Please complete CAPTCHA verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) return;

    setLoading(true);
    
    try {
      const response = await axios.post('/api/simple-auth/forgot-password', {
        identifier: formData.identifier.trim()
      });

      if (response.data.success) {
        setResetData(response.data.data);
        setTimeRemaining(response.data.data.expiresIn);
        setCurrentStep(2);
        showSuccess('OTP has been sent to your email address. Please check your inbox.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      showError(message);
      setResetCaptcha(prev => !prev);
      setCaptchaValue('');
      setIsCaptchaValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading(true);
    
    try {
      const response = await axios.post('/api/simple-auth/verify-otp', {
        resetId: resetData.resetId,
        otp: formData.otp.trim()
      });

      if (response.data.success) {
        setCurrentStep(3);
        showSuccess('OTP verified successfully. You can now set a new password.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid OTP. Please try again.';
      showError(message);
      setFormData(prev => ({ ...prev, otp: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    setLoading(true);
    
    try {
      const response = await axios.post('/api/simple-auth/reset-password', {
        resetId: resetData.resetId,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        showSuccess('Password reset successfully! You can now log in with your new password.');
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/simple-auth/forgot-password', {
        identifier: formData.identifier.trim()
      });

      if (response.data.success) {
        setResetData(response.data.data);
        setTimeRemaining(response.data.data.expiresIn);
        showInfo('New OTP has been sent to your email address.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-vtop-blue to-vtop-lightblue rounded-full flex items-center justify-center mb-4">
          <EnvelopeIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-academic-slate mb-2">
          Forgot Password?
        </h2>
        <p className="text-academic-gray">
          Enter your email address or registration number to receive a password reset OTP.
        </p>
      </div>

      <form onSubmit={handleStep1Submit} className="space-y-6">
        <div className="form-group">
          <label htmlFor="identifier" className="form-label">
            Email Address or Registration Number
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            value={formData.identifier}
            onChange={handleInputChange}
            className={`vtop-input ${errors.identifier ? 'input-field-error' : ''}`}
            placeholder="Enter your email or registration number"
            disabled={loading}
          />
          {errors.identifier && (
            <p className="form-error">{errors.identifier}</p>
          )}
        </div>

        <CaptchaComponent
          onCaptchaChange={handleCaptchaChange}
          onValidationChange={handleCaptchaValidation}
          reset={resetCaptcha}
        />
        {errors.captcha && (
          <p className="form-error">{errors.captcha}</p>
        )}

        <button
          type="submit"
          disabled={loading || !isCaptchaValid}
          className="w-full vtop-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="loading-spinner"></div>
              <span>Sending OTP...</span>
            </div>
          ) : (
            'Send OTP'
          )}
        </button>
      </form>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-vtop-blue to-vtop-lightblue rounded-full flex items-center justify-center mb-4">
          <KeyIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-academic-slate mb-2">
          Enter OTP
        </h2>
        <p className="text-academic-gray mb-4">
          We've sent a 6-digit OTP to your email address. Please enter it below.
        </p>
        
        {timeRemaining > 0 && (
          <div className="flex items-center justify-center space-x-2 text-vtop-warning">
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              OTP expires in {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleStep2Submit} className="space-y-6">
        <div className="form-group">
          <label htmlFor="otp" className="form-label">
            Enter 6-digit OTP
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            required
            maxLength={6}
            value={formData.otp}
            onChange={handleInputChange}
            className={`vtop-input text-center text-2xl font-mono tracking-widest ${errors.otp ? 'input-field-error' : ''}`}
            placeholder="000000"
            disabled={loading}
            autoComplete="off"
          />
          {errors.otp && (
            <p className="form-error">{errors.otp}</p>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 vtop-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-spinner"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify OTP'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading || timeRemaining > 0}
            className="px-4 py-3 text-vtop-blue border-2 border-vtop-blue rounded-lg font-medium hover:bg-vtop-blue hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resend
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-vtop-success to-green-600 rounded-full flex items-center justify-center mb-4">
          <KeyIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-academic-slate mb-2">
          Set New Password
        </h2>
        <p className="text-academic-gray">
          Create a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleStep3Submit} className="space-y-6">
        <div className="form-group">
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            value={formData.newPassword}
            onChange={handleInputChange}
            className={`vtop-input ${errors.newPassword ? 'input-field-error' : ''}`}
            placeholder="Enter new password"
            disabled={loading}
          />
          {errors.newPassword && (
            <p className="form-error">{errors.newPassword}</p>
          )}
          <p className="form-help">
            Password must be at least 6 characters long
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`vtop-input ${errors.confirmPassword ? 'input-field-error' : ''}`}
            placeholder="Confirm new password"
            disabled={loading}
          />
          {errors.confirmPassword && (
            <p className="form-error">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full vtop-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="loading-spinner"></div>
              <span>Resetting Password...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-academic-light via-gray-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-5"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative max-w-md w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep 
                    ? 'bg-vtop-blue text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-vtop-blue' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-academic-gray mt-2">
            <span>Email</span>
            <span>OTP</span>
            <span>Password</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="vtop-card p-8 space-y-6 fade-in">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Footer */}
          <div className="text-center space-y-3 pt-6 border-t border-gray-200">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-vtop-blue hover:text-vtop-lightblue font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
            <p className="text-xs text-academic-gray">
              Remember your password? 
              <Link to="/login" className="text-vtop-blue hover:text-vtop-lightblue ml-1">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-academic-gray text-sm mt-6 space-y-2">
          <p className="opacity-90">
            Secure password reset powered by VIT Bhopal
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

export default ForgotPasswordPage;