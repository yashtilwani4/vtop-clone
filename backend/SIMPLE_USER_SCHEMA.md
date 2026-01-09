# MongoDB User Schema Documentation

## Overview
This document describes the simplified MongoDB User schema for the VTOP Academic Portal with the requested fields: name, email, password, role, registrationNumber, and createdAt.

## Schema Definition

### Fields

#### 1. `name` (String)
- **Required**: Yes
- **Type**: String
- **Validation**: 
  - Minimum length: 2 characters
  - Maximum length: 100 characters
  - Automatically trimmed
- **Description**: Full name of the user
- **Example**: `"John Doe"`, `"Dr. Jane Smith"`

#### 2. `email` (String)
- **Required**: Yes
- **Type**: String
- **Unique**: Yes
- **Validation**: 
  - Must be valid email format
  - Automatically converted to lowercase
  - Automatically trimmed
- **Description**: User's email address (used for login)
- **Example**: `"john.doe@student.vitbhopal.ac.in"`

#### 3. `password` (String)
- **Required**: Yes
- **Type**: String
- **Validation**: 
  - Minimum length: 6 characters
  - Automatically hashed using bcrypt (salt rounds: 12)
- **Security**: 
  - Not included in JSON responses by default
  - Hashed before saving to database
- **Description**: User's password for authentication
- **Example**: `"securePassword123"` (stored as hash)

#### 4. `role` (String)
- **Required**: Yes
- **Type**: String (Enum)
- **Values**: `"student"`, `"faculty"`, `"admin"`
- **Default**: `"student"`
- **Description**: User's role in the system
- **Example**: `"student"`

#### 5. `registrationNumber` (String)
- **Required**: Only for students
- **Type**: String
- **Unique**: Yes (sparse index)
- **Format**: `YYBBB#####`
  - YY: Last 2 digits of batch year
  - BBB: 3-letter branch code
  - #####: 5-digit student code
- **Validation**: Regex pattern for format validation
- **Description**: Student's registration number
- **Example**: `"22BCE10405"`, `"24BCY10007"`

#### 6. `createdAt` (Date)
- **Required**: No (auto-generated)
- **Type**: Date
- **Default**: Current timestamp
- **Description**: When the user account was created
- **Auto-managed**: Yes (via timestamps option)

## Schema Features

### Automatic Timestamps
```javascript
{
  timestamps: true // Adds createdAt and updatedAt
}
```

### Password Hashing
```javascript
// Pre-save middleware automatically hashes passwords
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

### JSON Transform
```javascript
// Removes sensitive data from JSON responses
toJSON: {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
}
```

## Instance Methods

### `comparePassword(candidatePassword)`
Compares a plain text password with the hashed password.

```javascript
const isValid = await user.comparePassword('plainTextPassword');
```

## Static Methods

### `findByEmailOrRegNumber(identifier)`
Finds a user by email or registration number.

```javascript
const user = await SimpleUser.findByEmailOrRegNumber('john@example.com');
const user2 = await SimpleUser.findByEmailOrRegNumber('22BCE10405');
```

### `generateRegistrationNumber(batch, branch)`
Generates a registration number in the correct format.

```javascript
const regNum = SimpleUser.generateRegistrationNumber(2022, 'BCE');
// Returns: "22BCE12345" (random 5-digit code)
```

### `parseRegistrationNumber(registrationNumber)`
Parses a registration number to extract batch and branch information.

```javascript
const parsed = SimpleUser.parseRegistrationNumber('22BCE10405');
// Returns: {
//   batch: "2022",
//   branch: "BCE", 
//   studentCode: "10405",
//   fullBatch: "2022-2026"
// }
```

## Usage Examples

### Creating Users

#### Student
```javascript
const student = new SimpleUser({
  name: 'John Doe',
  email: 'john.doe@student.vitbhopal.ac.in',
  password: 'securePassword123',
  role: 'student',
  registrationNumber: '22BCE10405'
});
await student.save();
```

#### Faculty
```javascript
const faculty = new SimpleUser({
  name: 'Dr. Jane Smith',
  email: 'jane.smith@vitbhopal.ac.in',
  password: 'facultyPassword123',
  role: 'faculty'
  // registrationNumber not required for faculty
});
await faculty.save();
```

#### Admin
```javascript
const admin = new SimpleUser({
  name: 'System Administrator',
  email: 'admin@vitbhopal.ac.in',
  password: 'adminPassword123',
  role: 'admin'
});
await admin.save();
```

### Querying Users

#### Find by Role
```javascript
const students = await SimpleUser.find({ role: 'student' });
const faculty = await SimpleUser.find({ role: 'faculty' });
```

#### Find by Email
```javascript
const user = await SimpleUser.findOne({ email: 'john@example.com' });
```

#### Find Recent Users
```javascript
const recentUsers = await SimpleUser.find()
  .sort({ createdAt: -1 })
  .limit(10);
```

### Authentication Example
```javascript
// Login
const user = await SimpleUser.findByEmailOrRegNumber(identifier);
if (user && await user.comparePassword(password)) {
  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  // Login successful
}
```

## Validation Rules

### Valid Examples
```javascript
// Valid student
{
  name: 'Alice Johnson',
  email: 'alice@student.vitbhopal.ac.in',
  password: 'password123',
  role: 'student',
  registrationNumber: '22BCE10405'
}

// Valid faculty
{
  name: 'Dr. Bob Wilson',
  email: 'bob@vitbhopal.ac.in',
  password: 'faculty123',
  role: 'faculty'
}
```

### Invalid Examples
```javascript
// Missing name
{
  email: 'test@example.com',
  password: 'password123',
  role: 'student'
} // Error: Name is required

// Invalid email
{
  name: 'Test User',
  email: 'invalid-email',
  password: 'password123',
  role: 'student'
} // Error: Please provide a valid email address

// Short password
{
  name: 'Test User',
  email: 'test@example.com',
  password: '123',
  role: 'student'
} // Error: Password must be at least 6 characters long

// Invalid role
{
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'invalid-role'
} // Error: Role must be either student, faculty, or admin

// Invalid registration number format
{
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'student',
  registrationNumber: 'INVALID123'
} // Error: Registration number must be in format YYBBB#####
```

## Database Indexes

The schema automatically creates the following indexes:
- `email`: Unique index (from unique: true)
- `registrationNumber`: Sparse unique index (from unique: true, sparse: true)
- `role`: Regular index for filtering
- `createdAt`: Descending index for sorting

## Registration Number Format

### Format: `YYBBB#####`
- **YY**: Last 2 digits of batch year (22, 23, 24, etc.)
- **BBB**: 3-letter branch code
- **#####**: 5-digit sequential student code

### Branch Codes
| Code | Department |
|------|------------|
| BCE | Computer Engineering |
| BCY | Cybersecurity |
| BEC | Electronics & Communication |
| BME | Mechanical Engineering |
| BCI | Civil Engineering |
| BAE | Aerospace Engineering |

### Examples
- `22BCE10405` - 2022 batch, Computer Engineering, student 10405
- `24BCY10007` - 2024 batch, Cybersecurity, student 10007
- `23BEC12345` - 2023 batch, Electronics, student 12345

## API Integration

### Simple Authentication Routes
The schema works with the provided simple authentication routes:

- `POST /api/simple-auth/register` - Register new user
- `POST /api/simple-auth/login` - Login with email or registration number
- `GET /api/simple-auth/me` - Get current user profile
- `GET /api/simple-auth/users` - List users
- `POST /api/simple-auth/validate-registration` - Validate registration number

## Testing

Run the example file to test the schema:
```bash
cd server
node examples/userSchemaExample.js
```

## File Locations

- **Schema**: `server/models/SimpleUser.js`
- **Routes**: `server/routes/simpleAuth.js`
- **Examples**: `server/examples/userSchemaExample.js`
- **Documentation**: `server/SIMPLE_USER_SCHEMA.md`

## Security Considerations

1. **Password Hashing**: Automatic bcrypt hashing with salt rounds of 12
2. **Data Sanitization**: Email lowercase, field trimming
3. **Validation**: Comprehensive field validation
4. **JSON Security**: Password excluded from JSON responses
5. **Unique Constraints**: Email and registration number uniqueness enforced

## Migration from Complex Schema

If migrating from the complex User schema:
1. Map `firstName + lastName` to `name`
2. Keep `email`, `password`, `role` as-is
3. Keep `registrationNumber` for students
4. `createdAt` is automatically handled
5. Other fields can be stored in a separate profile collection if needed