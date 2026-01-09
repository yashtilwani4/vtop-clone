import React, { useState } from 'react';
import CaptchaComponent from './CaptchaComponent';

const CaptchaDemo = () => {
  const [captchaValue, setCaptchaValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(false);

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
    console.log('CAPTCHA value:', value);
  };

  const handleValidationChange = (valid) => {
    setIsValid(valid);
    console.log('CAPTCHA valid:', valid);
  };

  const handleReset = () => {
    setResetTrigger(prev => !prev);
    setCaptchaValue('');
    setIsValid(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      alert('CAPTCHA validation successful! Form can be submitted.');
    } else {
      alert('Please complete CAPTCHA verification first.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            CAPTCHA Demo
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Form Field
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter some text..."
              />
            </div>

            <CaptchaComponent
              onCaptchaChange={handleCaptchaChange}
              onValidationChange={handleValidationChange}
              reset={resetTrigger}
            />

            <div className="flex space-x-4">
              <button
                type="submit"
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isValid
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!isValid}
              >
                Submit Form
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Reset CAPTCHA
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <h3 className="font-medium text-gray-900 mb-2">Debug Info:</h3>
              <p>CAPTCHA Value: <code className="bg-gray-200 px-1 rounded">{captchaValue || 'empty'}</code></p>
              <p>Is Valid: <code className="bg-gray-200 px-1 rounded">{isValid ? 'true' : 'false'}</code></p>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            CAPTCHA Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✅ Visual CAPTCHA with distorted text</li>
            <li>✅ Audio CAPTCHA support (text-to-speech)</li>
            <li>✅ Case-insensitive validation</li>
            <li>✅ Automatic refresh on failed attempts</li>
            <li>✅ Rate limiting (3 attempts, 30s lockout)</li>
            <li>✅ Security level monitoring</li>
            <li>✅ Timing pattern analysis</li>
            <li>✅ Browser fingerprinting</li>
            <li>✅ Honeypot field for bot detection</li>
            <li>✅ Enhanced accessibility features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CaptchaDemo;