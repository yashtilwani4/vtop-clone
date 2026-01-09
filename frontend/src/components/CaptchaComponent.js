import React, { useState, useEffect, useRef } from 'react';
import { ArrowPathIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { 
  generateSecureCaptcha, 
  applyTextDistortion, 
  generateNoisePattern,
  validateTimingPattern,
  getBrowserFingerprint
} from '../utils/captchaUtils';

const CaptchaComponent = ({ onCaptchaChange, onValidationChange, reset }) => {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [keystrokes, setKeystrokes] = useState([]);
  const [securityLevel, setSecurityLevel] = useState('low');
  const canvasRef = useRef(null);

  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 30; // seconds

  // Generate random CAPTCHA with enhanced security
  const generateCaptcha = () => {
    const code = generateSecureCaptcha(6);
    setCaptchaCode(code);
    drawCaptcha(code);
    setStartTime(Date.now());
    setKeystrokes([]);
    return code;
  };

  // Draw CAPTCHA on canvas with enhanced visual effects
  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.5, '#e2e8f0');
    gradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add noise pattern
    generateNoisePattern(ctx, width, height);

    // Draw CAPTCHA text with enhanced distortion
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const x = 25 + i * 25;
      const y = height / 2;
      
      applyTextDistortion(ctx, char, x, y);
    }

    // Add additional security patterns
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * height);
      ctx.quadraticCurveTo(
        width / 2, Math.random() * height,
        width, Math.random() * height
      );
      ctx.stroke();
    }
  };

  // Handle input change with timing analysis
  const handleInputChange = (e) => {
    const value = e.target.value.slice(0, 6); // Limit to 6 characters
    setUserInput(value);
    
    // Record keystroke timing
    const now = Date.now();
    setKeystrokes(prev => [...prev, { char: value.slice(-1), time: now }]);
    
    const valid = value.length === 6 && value.toLowerCase() === captchaCode.toLowerCase();
    setIsValid(valid);
    
    // Analyze timing patterns for security
    if (startTime && keystrokes.length > 0) {
      const timingAnalysis = validateTimingPattern(startTime, now, keystrokes);
      if (timingAnalysis.suspiciousActivity) {
        setSecurityLevel('high');
      }
    }
    
    // Notify parent components
    onCaptchaChange(value);
    onValidationChange(valid);
  };

  // Handle audio CAPTCHA (mock implementation)
  const handleAudioCaptcha = () => {
    // In a real implementation, this would play audio
    const audioText = captchaCode.split('').join(', ');
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(audioText);
      utterance.rate = 0.7;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      alert(`Audio CAPTCHA: ${audioText}`);
    }
  };

  // Handle CAPTCHA refresh
  const handleRefresh = () => {
    if (isLocked) return;
    
    const newCode = generateCaptcha();
    setUserInput('');
    setIsValid(false);
    onCaptchaChange('');
    onValidationChange(false);
  };

  // Handle failed validation with enhanced security
  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    // Log security event (in production, send to server)
    const fingerprint = getBrowserFingerprint();
    console.log('CAPTCHA failed attempt:', {
      attempts: newAttempts,
      securityLevel,
      fingerprint,
      timestamp: Date.now()
    });
    
    if (newAttempts >= MAX_ATTEMPTS) {
      setIsLocked(true);
      setLockTimeRemaining(LOCK_DURATION);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsLocked(false);
            setAttempts(0);
            setSecurityLevel('low');
            handleRefresh();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      handleRefresh();
    }
  };

  // Reset CAPTCHA (called from parent)
  useEffect(() => {
    if (reset) {
      handleRefresh();
      setAttempts(0);
      setIsLocked(false);
      setLockTimeRemaining(0);
    }
  }, [reset]);

  // Initialize CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Validate input when it changes with enhanced checking
  useEffect(() => {
    if (userInput.length === 6 && userInput.toLowerCase() !== captchaCode.toLowerCase()) {
      // Delay to show the input before handling failed attempt
      const timer = setTimeout(() => {
        handleFailedAttempt();
        setUserInput('');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [userInput, captchaCode]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        CAPTCHA Verification
        {attempts > 0 && (
          <span className="text-red-500 text-xs ml-2">
            ({attempts}/{MAX_ATTEMPTS} attempts)
          </span>
        )}
      </label>
      
      {/* CAPTCHA Display */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={180}
            height={60}
            className={`border-2 rounded-lg bg-white ${
              isLocked ? 'border-red-300 opacity-50' : 
              securityLevel === 'high' ? 'border-orange-300' : 'border-gray-300'
            }`}
          />
          {isLocked && (
            <div className="absolute inset-0 bg-red-100 bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-600 text-xs font-medium">Locked</div>
                <div className="text-red-500 text-xs">{lockTimeRemaining}s</div>
              </div>
            </div>
          )}
          {securityLevel === 'high' && !isLocked && (
            <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-1 rounded">
              High Security
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLocked}
            className={`p-2 rounded-lg transition-colors ${
              isLocked
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-500 hover:text-vtop-blue hover:bg-gray-100'
            }`}
            title="Refresh CAPTCHA"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            onClick={handleAudioCaptcha}
            disabled={isLocked}
            className={`p-2 rounded-lg transition-colors ${
              isLocked
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-500 hover:text-vtop-blue hover:bg-gray-100'
            }`}
            title="Audio CAPTCHA"
          >
            <SpeakerWaveIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          disabled={isLocked}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
            isLocked
              ? 'border-red-300 bg-red-50 cursor-not-allowed'
              : userInput.length === 6
              ? isValid
                ? 'border-green-500 focus:ring-green-500 bg-green-50'
                : 'border-red-500 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-vtop-blue focus:border-vtop-blue'
          }`}
          placeholder="Enter CAPTCHA code"
          maxLength={6}
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* Validation Icons */}
        {userInput.length === 6 && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isValid ? (
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">
            Too many failed attempts. Please wait {lockTimeRemaining} seconds before trying again.
          </p>
        </div>
      )}
      
      {userInput.length === 6 && !isValid && !isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">
            CAPTCHA code does not match. Please try again.
          </p>
        </div>
      )}
      
      {isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-600">
            CAPTCHA verified successfully!
          </p>
        </div>
      )}

      {/* Accessibility Features */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Enter the 6-character code shown in the image above</p>
        <p>• Click the refresh button to generate a new code</p>
        <p>• Click the audio button to hear the code spoken</p>
        <p>• Code is case-insensitive</p>
        {securityLevel === 'high' && (
          <p className="text-orange-600 font-medium">
            • Enhanced security mode active due to suspicious activity
          </p>
        )}
      </div>

      {/* Security Indicators */}
      {attempts > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Security Level: 
            <span className={`ml-1 font-medium ${
              securityLevel === 'high' ? 'text-red-500' : 
              securityLevel === 'medium' ? 'text-orange-500' : 'text-green-500'
            }`}>
              {securityLevel.toUpperCase()}
            </span>
          </span>
          <span className="text-gray-500">
            Attempts: {attempts}/{MAX_ATTEMPTS}
          </span>
        </div>
      )}

      {/* Hidden honeypot field for bot detection */}
      <input
        type="text"
        name="website"
        tabIndex="-1"
        autoComplete="off"
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          opacity: 0, 
          pointerEvents: 'none' 
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default CaptchaComponent;