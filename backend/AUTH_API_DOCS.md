# Enhanced Authentication API Documentation

## Overview
The VTOP Academic Portal authentication system supports multiple login methods and the new registration number format (YYBBB#####).

## Registration Number Format
- **Format**: `YYBBB#####`
- **YY**: Last 2 digits of batch year (e.g., 22 for 2022)
- **BBB**: 3-letter branch code (e.g., BCE, BCY, BEC, BME)
- **#####**: 5-digit student code

### Examples
- `22BCE10405` - Batch 2022, Computer Engineering, Student 10405
- `24BCY10007` - Batch 2024, Cybersecurity, Student 10007
- `23BEC12345` - Batch 2023, Electronics, Student 12345

## API Endpoints

### 1. User Registration
**POST** `/api/auth/register`

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@student.vitbhopal.ac.in",
  "password": "SecurePass123",
  "role": "student",
  "department": "Computer Science",
  "phone": "+919876543210",
  "dateOfBirth": "2004-05-15",
  "gender": "Male",
  
  // For students - Option 1: Provide existing registration number
  "registrationNumber": "22BCE10405",
  
  // For students - Option 2: Provide batch year (will generate reg number)
  "batch": 2022,
  "program": "B.Tech",
  "semester": 1,
  
  // For faculty
  "designation": "Professor",
  "specialization": "Data Structures"
}
```

#### Response
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "userId": "2022CSE0001",
      "registrationNumber": "22BCE10405",
      "email": "john.doe@student.vitbhopal.ac.in",
      "fullName": "John Doe",
      "role": "student",
      "department": "Computer Science",
      "batch": "2022-2026"
    }
  }
}
```

### 2. User Login
**POST** `/api/auth/login`

#### Request Body
```json
{
  "userId": "22BCE10405", // Can be registration number, user ID, or email
  "password": "SecurePass123"
}
```

#### Supported Login Methods
1. **Registration Number**: `22BCE10405`
2. **User ID**: `2022CSE0001`
3. **Email**: `john.doe@student.vitbhopal.ac.in`

#### Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "userId": "2022CSE0001",
      "registrationNumber": "22BCE10405",
      "email": "john.doe@student.vitbhopal.ac.in",
      "fullName": "John Doe",
      "role": "student",
      "department": "Computer Science",
      "program": "B.Tech",
      "semester": 5,
      "batch": "2022-2026",
      "profilePicture": ""
    }
  }
}
```

### 3. Validate Registration Number
**POST** `/api/auth/validate-registration`

#### Request Body
```json
{
  "registrationNumber": "22BCE10405"
}
```

#### Response
```json
{
  "success": true,
  "message": "Registration number is valid",
  "data": {
    "parsed": {
      "batch": "2022",
      "branch": "BCE",
      "studentCode": "10405",
      "fullBatch": "2022-2026"
    },
    "exists": false,
    "registrationNumber": "22BCE10405"
  }
}
```

### 4. Get Current User Profile
**GET** `/api/auth/me`

#### Headers
```
Authorization: Bearer jwt_token_here
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "userId": "2022CSE0001",
      "registrationNumber": "22BCE10405",
      "email": "john.doe@student.vitbhopal.ac.in",
      "fullName": "John Doe",
      "role": "student",
      "department": "Computer Science",
      "enrolledCourses": [...],
      "batch": "2022-2026"
    }
  }
}
```

### 5. Refresh Token
**POST** `/api/auth/refresh`

#### Headers
```
Authorization: Bearer jwt_token_here
```

#### Response
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

### 6. Change Password
**POST** `/api/auth/change-password`

#### Headers
```
Authorization: Bearer jwt_token_here
```

#### Request Body
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 7. Logout
**POST** `/api/auth/logout`

#### Headers
```
Authorization: Bearer jwt_token_here
```

#### Response
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Error Responses

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "registrationNumber",
      "message": "Registration number must be in format YYBBB##### (e.g., 22BCE10405)",
      "value": "invalid123"
    }
  ]
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Authorization Errors
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 12
2. **JWT Tokens**: Secure token generation with expiration
3. **Input Validation**: Comprehensive validation using express-validator
4. **Rate Limiting**: Protection against brute force attacks
5. **CORS**: Cross-origin resource sharing configuration
6. **Helmet**: Security headers middleware

## Branch Codes Reference

| Branch Code | Department |
|-------------|------------|
| BCE | Computer Engineering |
| BCY | Cybersecurity |
| BEC | Electronics & Communication |
| BME | Mechanical Engineering |
| BCI | Civil Engineering |
| BAE | Aerospace Engineering |
| BBT | Biotechnology |
| BCH | Chemical Engineering |

## Testing

Run the authentication tests:
```bash
cd server
node test-auth.js
```

## Sample Login Credentials (After Seeding)

### Admin
- **Email**: `admin@vitbhopal.ac.in`
- **Password**: `admin123`

### Faculty
- **Email**: `john.doe@vitbhopal.ac.in`
- **Password**: `faculty123`

### Students
- **Registration Number**: `22BCE10405` / **Password**: `student123`
- **Registration Number**: `24BCY10007` / **Password**: `student123`
- **Email**: `alice.wilson@student.vitbhopal.ac.in` / **Password**: `student123`