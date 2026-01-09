/**
 * CAPTCHA Utility Functions
 * Provides additional security and validation features for CAPTCHA implementation
 */

// Generate secure random CAPTCHA code
export const generateSecureCaptcha = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(length);
  
  // Use crypto.getRandomValues for better randomness
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }
  
  // Fallback to Math.random
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validate CAPTCHA input
export const validateCaptchaInput = (input, expected) => {
  if (!input || !expected) return false;
  return input.trim().toLowerCase() === expected.toLowerCase();
};

// Generate distraction patterns for canvas
export const generateNoisePattern = (ctx, width, height) => {
  // Add random lines
  ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
  ctx.lineWidth = Math.random() * 2 + 1;
  
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }
  
  // Add random dots
  ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.4)`;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 3 + 1,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
};

// Apply text distortion effects
export const applyTextDistortion = (ctx, char, x, y) => {
  const colors = ['#1e40af', '#7c3aed', '#dc2626', '#059669', '#ea580c', '#0891b2'];
  const fonts = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];
  
  // Random styling
  const fontSize = 20 + Math.random() * 12;
  const rotation = (Math.random() - 0.5) * 0.6;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const font = fonts[Math.floor(Math.random() * fonts.length)];
  const skewX = (Math.random() - 0.5) * 0.3;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.transform(1, skewX, 0, 1, 0, 0); // Apply skew
  
  ctx.font = `bold ${fontSize}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add multiple shadows for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(char, 0, 0);
  
  // Add outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1;
  ctx.strokeText(char, 0, 0);
  
  ctx.restore();
};

// Security features
export const getCaptchaSecurityLevel = (attempts, timeSpent) => {
  if (attempts > 5 || timeSpent < 2000) {
    return 'high'; // Suspicious activity
  } else if (attempts > 2 || timeSpent < 5000) {
    return 'medium';
  }
  return 'low';
};

// Rate limiting helper
export const shouldBlockCaptcha = (attempts, lastAttemptTime, blockDuration = 30000) => {
  if (attempts >= 3) {
    const timeSinceLastAttempt = Date.now() - lastAttemptTime;
    return timeSinceLastAttempt < blockDuration;
  }
  return false;
};

// Generate accessibility-friendly CAPTCHA
export const generateAccessibleCaptcha = () => {
  // Use only easily distinguishable characters
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const excludeSimilar = chars.replace(/[0O1Il]/g, ''); // Remove similar looking chars
  
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += excludeSimilar.charAt(Math.floor(Math.random() * excludeSimilar.length));
  }
  return result;
};

// Audio CAPTCHA generation (mock implementation)
export const generateAudioCaptcha = (text) => {
  // In a real implementation, this would generate audio
  // For now, return a mock audio description
  return {
    audioUrl: null, // Would contain actual audio URL
    description: `Audio CAPTCHA: ${text.split('').join(', ')}`,
    duration: text.length * 1000 // Estimated duration in ms
  };
};

// Honeypot field validation (anti-bot measure)
export const validateHoneypot = (honeypotValue) => {
  // Honeypot field should always be empty (hidden from users, filled by bots)
  return !honeypotValue || honeypotValue.trim() === '';
};

// Browser fingerprinting for additional security
export const getBrowserFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvasFingerprint: canvas.toDataURL(),
    timestamp: Date.now()
  };
};

// Validate timing patterns (human vs bot detection)
export const validateTimingPattern = (startTime, endTime, keystrokes) => {
  const totalTime = endTime - startTime;
  const avgKeystrokeTime = totalTime / keystrokes.length;
  
  // Human-like patterns: not too fast, not too consistent
  const isHumanLike = 
    totalTime > 2000 && // At least 2 seconds
    totalTime < 60000 && // Less than 1 minute
    avgKeystrokeTime > 100 && // Not too fast
    avgKeystrokeTime < 2000; // Not too slow
  
  return {
    isHumanLike,
    totalTime,
    avgKeystrokeTime,
    suspiciousActivity: !isHumanLike
  };
};

const captchaUtils = {
  generateSecureCaptcha,
  validateCaptchaInput,
  generateNoisePattern,
  applyTextDistortion,
  getCaptchaSecurityLevel,
  shouldBlockCaptcha,
  generateAccessibleCaptcha,
  generateAudioCaptcha,
  validateHoneypot,
  getBrowserFingerprint,
  validateTimingPattern
};

export default captchaUtils;