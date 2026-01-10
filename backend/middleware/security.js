const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Security Configuration for VTOP Academic Portal
 */

// Rate limiting configurations by endpoint type
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different types of requests
const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts per window
    'Too many authentication attempts. Please try again later.',
    true
  ),
  
  // General API endpoints
  api: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many API requests. Please try again later.'
  ),
  
  // File upload endpoints
  upload: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // 10 uploads per hour
    'Too many file uploads. Please try again later.'
  ),
  
  // Password change/reset
  password: createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // 3 password changes per hour
    'Too many password change attempts. Please try again later.'
  ),
  
  // Course registration (during registration periods)
  courseRegistration: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    20, // 20 registration actions per 5 minutes
    'Too many course registration attempts. Please slow down.'
  )
};

// Role-based rate limiting
const roleBasedRateLimit = (req, res, next) => {
  const limits = {
    admin: 1000,
    faculty: 500,
    student: 200,
    guest: 50
  };
  
  const userRole = req.user?.role || 'guest';
  const limit = limits[userRole];
  
  // Create dynamic rate limiter based on user role
  const dynamicLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    limit,
    `Rate limit exceeded for ${userRole} role. Please try again later.`
  );
  
  dynamicLimiter(req, res, next);
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost on any port
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://vtop.vitbhopal.ac.in',
      'https://vtopbhopal.netlify.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
};

// Helmet security configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.API_URL].filter(Boolean)
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add API version header
  res.setHeader('X-API-Version', '1.0.0');
  
  next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Remove potentially dangerous characters from query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/[<>]/g, '');
      }
    });
  }
  
  // Limit request body size based on content type
  const maxSizes = {
    'application/json': '10mb',
    'multipart/form-data': '50mb',
    'text/plain': '1mb'
  };
  
  const contentType = req.get('Content-Type') || '';
  const maxSize = Object.keys(maxSizes).find(type => 
    contentType.includes(type)
  );
  
  if (maxSize && req.get('Content-Length')) {
    const size = parseInt(req.get('Content-Length'));
    const limit = parseInt(maxSizes[maxSize]) * 1024 * 1024; // Convert to bytes
    
    if (size > limit) {
      return res.status(413).json({
        success: false,
        message: 'Request body too large',
        code: 'PAYLOAD_TOO_LARGE'
      });
    }
  }
  
  next();
};

// IP whitelist middleware (for admin operations)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No restrictions if no IPs specified
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        code: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
};

// Suspicious activity detection
const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    /(\<script\>|\<\/script\>)/gi, // XSS attempts
    /(union|select|insert|delete|drop|create|alter)/gi, // SQL injection
    /(\.\.\/)|(\.\.\\)/g, // Path traversal
    /(eval\(|javascript:)/gi // Code injection
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.url;
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(checkString));
  
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious activity detected from ${req.ip}: ${req.method} ${req.url}`);
    
    return res.status(400).json({
      success: false,
      message: 'Request contains potentially malicious content',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }
  
  next();
};

// Apply all security middleware
const applySecurity = (app) => {
  // Basic security headers
  app.use(helmet(helmetConfig));
  app.use(securityHeaders);
  
  // CORS
  app.use(cors(corsOptions));
  
  // Request sanitization
  app.use(sanitizeRequest);
  
  // Suspicious activity detection
  app.use(suspiciousActivityDetector);
  
  // Rate limiting for authentication routes
  app.use('/api/auth', rateLimiters.auth);
  
  // Rate limiting for password operations
  app.use('/api/auth/change-password', rateLimiters.password);
  app.use('/api/auth/reset-password', rateLimiters.password);
  
  // Rate limiting for course registration
  app.use('/api/courses/enroll', rateLimiters.courseRegistration);
  app.use('/api/courses/drop', rateLimiters.courseRegistration);
  
  // General API rate limiting
  app.use('/api', rateLimiters.api);
  
  // Role-based rate limiting (applied after authentication)
  app.use('/api', (req, res, next) => {
    if (req.user) {
      roleBasedRateLimit(req, res, next);
    } else {
      next();
    }
  });
};

module.exports = {
  applySecurity,
  rateLimiters,
  roleBasedRateLimit,
  corsOptions,
  helmetConfig,
  securityHeaders,
  sanitizeRequest,
  ipWhitelist,
  suspiciousActivityDetector
};