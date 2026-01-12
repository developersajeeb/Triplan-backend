# Triplan Backend - Developer Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [NPM Packages & Dependencies](#npm-packages--dependencies)
5. [Configuration Files](#configuration-files)
6. [Core Utilities & Reusable Code](#core-utilities--reusable-code)
7. [Middlewares](#middlewares)
8. [Modules Documentation](#modules-documentation)
9. [Error Handling](#error-handling)
10. [Authentication & Authorization](#authentication--authorization)
11. [Database Models](#database-models)
12. [API Routes Structure](#api-routes-structure)
13. [Code Patterns & Best Practices](#code-patterns--best-practices)

---

## Project Overview

**Triplan Backend** is a Node.js/Express backend application built with TypeScript for a tour booking platform. The application handles user authentication, tour management, booking operations, payment processing, and various administrative functions.

### Key Features
- User authentication (Email/Password, Google OAuth)
- Tour management system
- Booking system with payment integration
- Division/Location management
- OTP verification
- Email notifications
- File upload to Cloudinary
- Redis caching
- SSLCommerz payment gateway integration

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.8.3
- **Database**: MongoDB (via Mongoose 8.16.2)
- **Cache**: Redis 5.6.1
- **File Storage**: Cloudinary
- **Authentication**: Passport.js with Local & Google OAuth strategies
- **Validation**: Zod 3.25.76
- **Email**: Nodemailer 7.0.5
- **Payment**: SSLCommerz integration

---

## Project Structure

```
Triplan-backend/
├── src/                          # Source TypeScript files
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   └── app/
│       ├── config/               # Configuration files
│       │   ├── env.ts            # Environment variables loader
│       │   ├── passport.ts       # Passport.js strategies
│       │   ├── cloudinary.config.ts  # Cloudinary setup
│       │   ├── multer.config.ts  # File upload configuration
│       │   └── redis.config.ts   # Redis client setup
│       ├── constants.ts          # Application constants
│       ├── errorHelpers/         # Error handling utilities
│       │   └── AppError.ts       # Custom error class
│       ├── helpers/              # Error transformation helpers
│       │   ├── handleCastError.ts
│       │   ├── handleDuplicateError.ts
│       │   ├── handlerValidationError.ts
│       │   └── handlerZodError.ts
│       ├── interfaces/           # TypeScript interfaces
│       │   ├── error.types.ts    # Error type definitions
│       │   └── index.d.ts        # Global type declarations
│       ├── middlewares/          # Express middlewares
│       │   ├── checkAuth.ts      # Authentication middleware
│       │   ├── globalErrorHandler.ts  # Global error handler
│       │   ├── notFound.ts       # 404 handler
│       │   └── validateRequest.ts    # Request validation
│       ├── modules/              # Feature modules
│       │   ├── auth/             # Authentication module
│       │   ├── user/             # User management
│       │   ├── tour/             # Tour management
│       │   ├── booking/          # Booking system
│       │   ├── payment/          # Payment processing
│       │   ├── division/         # Division/Location management
│       │   ├── otp/              # OTP verification
│       │   └── sslCommerz/       # SSLCommerz integration
│       ├── routes/               # Route aggregator
│       │   └── index.ts          # Main router
│       └── utils/                # Utility functions
│           ├── catchAsync.ts     # Async error wrapper
│           ├── jwt.ts            # JWT utilities
│           ├── QueryBuilder.ts   # MongoDB query builder
│           ├── sendEmail.ts      # Email sending utility
│           ├── sendResponse.ts   # Response formatter
│           ├── setCookie.ts     # Cookie utilities
│           ├── userTokens.ts     # Token management
│           ├── invoice.ts        # Invoice generation
│           ├── seedSuperAdmin.ts # Super admin seeder
│           └── templates/        # Email templates (EJS)
│               ├── forgetPassword.ejs
│               ├── invoice.ejs
│               └── otp.ejs
├── dist/                         # Compiled JavaScript (generated)
├── node_modules/                 # Dependencies
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── vercel.json                   # Vercel deployment config
└── README.md                     # Project readme
```

### Folder Structure Details

#### `/src/app/config/`
Contains all configuration files for external services and application settings.

- **env.ts**: Centralized environment variable management with validation
- **passport.ts**: Passport.js authentication strategies (Local, Google OAuth)
- **cloudinary.config.ts**: Cloudinary SDK configuration and upload utilities
- **multer.config.ts**: Multer middleware for file uploads with Cloudinary storage
- **redis.config.ts**: Redis client initialization and connection

#### `/src/app/modules/`
Each module follows a consistent structure:
- `*.controller.ts`: Request handlers
- `*.service.ts`: Business logic
- `*.route.ts` or `*.router.ts`: Route definitions
- `*.model.ts`: Mongoose schema/model
- `*.interface.ts`: TypeScript interfaces
- `*.validation.ts`: Zod validation schemas
- `*.constant.ts`: Module-specific constants (if needed)

#### `/src/app/utils/`
Reusable utility functions used across the application.

#### `/src/app/middlewares/`
Express middlewares for cross-cutting concerns.

#### `/src/app/helpers/`
Error transformation helpers that convert various error types into consistent formats.

---

## NPM Packages & Dependencies

### Production Dependencies

#### **express** (^5.1.0)
- **Purpose**: Web application framework for Node.js
- **Why Used**: Core framework for building RESTful APIs and handling HTTP requests/responses
- **Usage**: Main application framework, routing, middleware support

#### **mongoose** (^8.16.2)
- **Purpose**: MongoDB object modeling tool
- **Why Used**: Provides schema-based solution, type casting, validation, and query building for MongoDB
- **Usage**: Database models, schema definitions, queries

#### **typescript** (^5.8.3)
- **Purpose**: Typed superset of JavaScript
- **Why Used**: Type safety, better IDE support, compile-time error checking
- **Usage**: All source code is written in TypeScript

#### **jsonwebtoken** (^9.0.2)
- **Purpose**: JSON Web Token implementation
- **Why Used**: Stateless authentication, secure token generation and verification
- **Usage**: Access tokens, refresh tokens, password reset tokens

#### **bcryptjs** (^3.0.2)
- **Purpose**: Password hashing library
- **Why Used**: Secure password storage using bcrypt algorithm
- **Usage**: Password hashing before storage, password comparison during login

#### **passport** (^0.7.0)
- **Purpose**: Authentication middleware for Node.js
- **Why Used**: Flexible authentication strategies, supports multiple auth methods
- **Usage**: Local authentication, OAuth strategies

#### **passport-local** (^1.0.0)
- **Purpose**: Passport strategy for username/password authentication
- **Why Used**: Email/password login functionality
- **Usage**: Local authentication strategy

#### **passport-google-oauth20** (^2.0.0)
- **Purpose**: Google OAuth 2.0 authentication strategy
- **Why Used**: Social login with Google accounts
- **Usage**: Google OAuth authentication

#### **passport-facebook** (^3.0.0)
- **Purpose**: Facebook authentication strategy
- **Why Used**: Social login with Facebook (configured but may not be fully implemented)
- **Usage**: Facebook OAuth authentication

#### **zod** (^3.25.76)
- **Purpose**: TypeScript-first schema validation
- **Why Used**: Runtime type validation, type inference, better error messages
- **Usage**: Request validation, data schema validation

#### **dotenv** (^17.1.0)
- **Purpose**: Environment variable loader
- **Why Used**: Secure configuration management, separate config from code
- **Usage**: Loading environment variables from .env file

#### **cors** (^2.8.5)
- **Purpose**: Cross-Origin Resource Sharing middleware
- **Why Used**: Enable API access from frontend applications on different origins
- **Usage**: CORS configuration in app.ts

#### **cookie-parser** (^1.4.7)
- **Purpose**: Cookie parsing middleware
- **Why Used**: Parse and access cookies in requests
- **Usage**: Reading access tokens from cookies

#### **express-session** (^1.18.1)
- **Purpose**: Session management middleware
- **Why Used**: Maintain user sessions for OAuth flows
- **Usage**: Passport session management

#### **multer** (^2.0.2)
- **Purpose**: File upload middleware
- **Why Used**: Handle multipart/form-data for file uploads
- **Usage**: Image uploads for tours, user profiles

#### **multer-storage-cloudinary** (^4.0.0)
- **Purpose**: Cloudinary storage engine for Multer
- **Why Used**: Direct upload to Cloudinary from Multer
- **Usage**: File uploads directly to Cloudinary storage

#### **cloudinary** (^1.41.3)
- **Purpose**: Cloud-based image and video management
- **Why Used**: Image storage, transformation, optimization
- **Usage**: Image upload, deletion, PDF storage

#### **nodemailer** (^7.0.5)
- **Purpose**: Email sending library
- **Why Used**: Send transactional emails (OTP, password reset, invoices)
- **Usage**: Email notifications, OTP delivery

#### **ejs** (^3.1.10)
- **Purpose**: Embedded JavaScript templating
- **Why Used**: Dynamic email template rendering
- **Usage**: Email templates (forgetPassword, OTP, invoice)

#### **redis** (^5.6.1)
- **Purpose**: Redis client for Node.js
- **Why Used**: Caching, session storage, rate limiting
- **Usage**: Caching frequently accessed data

#### **axios** (^1.10.0)
- **Purpose**: HTTP client library
- **Why Used**: Make HTTP requests to external APIs
- **Usage**: SSLCommerz API calls, external service integration

#### **http-status-codes** (^2.3.0)
- **Purpose**: HTTP status code constants
- **Why Used**: Consistent status code usage, better code readability
- **Usage**: Error responses, success responses

#### **pdfkit** (^0.17.1)
- **Purpose**: PDF generation library
- **Why Used**: Generate PDF documents (invoices, receipts)
- **Usage**: Invoice generation

### Development Dependencies

#### **ts-node-dev** (^2.0.0)
- **Purpose**: TypeScript execution with hot reload
- **Why Used**: Development server with automatic restarts on file changes
- **Usage**: `npm run dev` script

#### **eslint** (^9.30.1)
- **Purpose**: JavaScript/TypeScript linter
- **Why Used**: Code quality, consistency, catch errors early
- **Usage**: Code linting via `npm run lint`

#### **@types/* packages**
- **Purpose**: TypeScript type definitions for JavaScript libraries
- **Why Used**: Type safety for untyped libraries
- **Usage**: Type definitions for express, mongoose, bcryptjs, etc.

---

## Configuration Files

### `tsconfig.json`
TypeScript compiler configuration:
- **target**: ES2016
- **module**: CommonJS
- **rootDir**: `./src`
- **outDir**: `./dist`
- **strict**: true (enables all strict type checking)
- **esModuleInterop**: true (enables CommonJS/ES module interop)

### `vercel.json`
Vercel deployment configuration:
- Builds from `src/server.ts`
- Routes all requests to the server

### Environment Variables (`src/app/config/env.ts`)
Centralized environment variable management with validation.

**Required Variables:**
- `PORT`: Server port
- `DB_URL`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `BCRYPT_SALT_ROUND`: Bcrypt salt rounds
- `JWT_ACCESS_SECRET`: JWT access token secret
- `JWT_ACCESS_EXPIRES`: Access token expiration
- `JWT_REFRESH_SECRET`: JWT refresh token secret
- `JWT_REFRESH_EXPIRES`: Refresh token expiration
- `SUPER_ADMIN_EMAIL`: Super admin email
- `SUPER_ADMIN_PHONE`: Super admin phone
- `SUPER_ADMIN_PASSWORD`: Super admin password
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: Google OAuth callback URL
- `EXPRESS_SESSION_SECRET`: Express session secret
- `FRONTEND_URL`: Frontend application URL
- `SSL_STORE_ID`: SSLCommerz store ID
- `SSL_STORE_PASS`: SSLCommerz store password
- `SSL_PAYMENT_API`: SSLCommerz payment API URL
- `SSL_VALIDATION_API`: SSLCommerz validation API URL
- `SSL_SUCCESS_FRONTEND_URL`: Success redirect URL
- `SSL_FAIL_FRONTEND_URL`: Failure redirect URL
- `SSL_CANCEL_FRONTEND_URL`: Cancel redirect URL
- `SSL_SUCCESS_BACKEND_URL`: Success callback URL
- `SSL_FAIL_BACKEND_URL`: Failure callback URL
- `SSL_CANCEL_BACKEND_URL`: Cancel callback URL
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `SMTP_USER`: Email SMTP username
- `SMTP_PASS`: Email SMTP password
- `SMTP_PORT`: Email SMTP port
- `SMTP_HOST`: Email SMTP host
- `SMTP_FROM`: Email sender address
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_USERNAME`: Redis username
- `REDIS_PASSWORD`: Redis password

---

## Core Utilities & Reusable Code

### `catchAsync.ts`
**Location**: `src/app/utils/catchAsync.ts`

**Purpose**: Wrapper function to catch async errors and pass them to Express error handler.

**Why Used**: Eliminates need for try-catch blocks in every async route handler, centralizes error handling.

**Usage**:
```typescript
router.get('/route', catchAsync(async (req, res, next) => {
    // async code here
}))
```

**Code**:
```typescript
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

export const catchAsync = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err: any) => {
        console.log(err);
        next(err)
    })
}
```

---

### `QueryBuilder.ts`
**Location**: `src/app/utils/QueryBuilder.ts`

**Purpose**: Fluent query builder for MongoDB queries with filtering, searching, sorting, pagination, and field selection.

**Why Used**: Reusable query building logic, consistent API responses, reduces code duplication.

**Features**:
- **filter()**: Apply query filters (excludes pagination/search fields)
- **search()**: Full-text search across multiple fields
- **sort()**: Sort results (default: `-createdAt`)
- **fields()**: Select specific fields to return
- **paginate()**: Pagination with page and limit
- **populate()**: Populate referenced documents
- **getMeta()**: Get pagination metadata

**Usage**:
```typescript
const query = new QueryBuilder(Tour.find(), req.query)
    .filter()
    .search(['title', 'description'])
    .sort()
    .paginate()
    .populate('division')
    .build();

const meta = await query.getMeta();
```

---

### `jwt.ts`
**Location**: `src/app/utils/jwt.ts`

**Purpose**: JWT token generation and verification utilities.

**Functions**:
- `generateToken(payload, secret, expiresIn)`: Generate JWT token
- `verifyToken(token, secret)`: Verify and decode JWT token

**Why Used**: Centralized JWT operations, consistent token handling.

---

### `sendEmail.ts`
**Location**: `src/app/utils/sendEmail.ts`

**Purpose**: Email sending utility with EJS template support.

**Features**:
- Template-based emails (EJS)
- Attachment support
- SMTP configuration via environment variables

**Usage**:
```typescript
await sendEmail({
    to: 'user@example.com',
    subject: 'Password Reset',
    templateName: 'forgetPassword',
    templateData: { name: 'John', resetUILink: '...' },
    attachments: [...] // optional
})
```

**Why Used**: Reusable email functionality, template-based emails, consistent email sending.

---

### `sendResponse.ts`
**Location**: `src/app/utils/sendResponse.ts`

**Purpose**: Standardized API response formatter.

**Features**:
- Consistent response structure
- Optional metadata for pagination
- Type-safe response typing

**Response Structure**:
```typescript
{
    statusCode: number,
    success: boolean,
    message: string,
    data: T,
    meta?: { page, limit, totalPage, total }
}
```

**Usage**:
```typescript
sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Success',
    data: result,
    meta: paginationMeta // optional
})
```

**Why Used**: Consistent API response format across all endpoints, better frontend integration.

---

### `setCookie.ts`
**Location**: `src/app/utils/setCookie.ts`

**Purpose**: Cookie setting utility with secure options for authentication tokens.

**Features**:
- Sets access token and refresh token cookies
- Secure cookie configuration (httpOnly, secure, sameSite)
- Consistent cookie settings across application

**Usage**:
```typescript
setAuthCookie(res, {
    accessToken: '...',
    refreshToken: '...'
})
```

**Cookie Configuration**:
- `httpOnly: true`: Prevents JavaScript access (XSS protection)
- `secure: true`: HTTPS only
- `sameSite: "none"`: Cross-site cookie support
- `path: "/"`: Available for all routes

**Why Used**: Consistent cookie configuration, security settings, token management.

---

### `userTokens.ts`
**Location**: `src/app/utils/userTokens.ts`

**Purpose**: Token management utilities for JWT token generation and refresh.

**Functions**:
- `createUserTokens(user)`: Generate both access and refresh tokens for a user
- `createNewAccessTokenWithRefreshToken(refreshToken)`: Generate new access token from refresh token

**Token Payload Structure**:
```typescript
{
    userId: string,
    email: string,
    role: string
}
```

**Usage**:
```typescript
// Create tokens for user
const { accessToken, refreshToken } = createUserTokens(user);

// Refresh access token
const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);
```

**Why Used**: Centralized token creation logic, refresh token handling, consistent token structure.

---

### `invoice.ts`
**Location**: `src/app/utils/invoice.ts`

**Purpose**: Invoice generation utility (likely uses PDFKit).

**Why Used**: Generate booking invoices, receipts.

---

### `seedSuperAdmin.ts`
**Location**: `src/app/utils/seedSuperAdmin.ts`

**Purpose**: Creates super admin user on server startup.

**Why Used**: Automatic super admin creation for initial setup.

---

### `getTransactionId.ts`
**Location**: `src/app/modules/booking/getTransactionId.ts`

**Purpose**: Generate unique transaction IDs for payment processing.

**Format**: `tran_{timestamp}_{randomNumber}`

**Example**: `tran_1753126570086_453`

**Why Used**: Unique transaction identification for payment tracking, SSLCommerz integration.

---

## Middlewares

### `checkAuth.ts`
**Location**: `src/app/middlewares/checkAuth.ts`

**Purpose**: Authentication and authorization middleware.

**Features**:
- Validates JWT access token (from cookies or Authorization header)
- Verifies user exists and is active
- Checks user role permissions
- Attaches user info to `req.user`

**Usage**:
```typescript
router.get('/protected', checkAuth(Role.ADMIN, Role.SUPER_ADMIN), controller)
```

**Why Used**: Route protection, role-based access control, user verification.

**Flow**:
1. Extract token from cookies or headers
2. Verify token
3. Check user exists and is verified
4. Check user is active (not blocked/inactive)
5. Check user role matches required roles
6. Attach user to request object

---

### `validateRequest.ts`
**Location**: `src/app/middlewares/validateRequest.ts`

**Purpose**: Request validation using Zod schemas.

**Features**:
- Validates request body against Zod schema
- Handles JSON parsing for multipart/form-data
- Passes validation errors to error handler

**Usage**:
```typescript
router.post('/route', validateRequest(createTourZodSchema), controller)
```

**Why Used**: Type-safe validation, consistent error messages, prevents invalid data.

---

### `globalErrorHandler.ts`
**Location**: `src/app/middlewares/globalErrorHandler.ts`

**Purpose**: Centralized error handling middleware.

**Features**:
- Handles all error types (AppError, ZodError, ValidationError, CastError, DuplicateError)
- Cleans up uploaded files on error
- Returns consistent error response format
- Includes stack trace in development

**Error Types Handled**:
- **AppError**: Custom application errors
- **ZodError**: Validation errors from Zod
- **ValidationError**: Mongoose validation errors
- **CastError**: Invalid ObjectId or type casting errors
- **DuplicateError**: MongoDB duplicate key errors (code 11000)

**Why Used**: Centralized error handling, consistent error responses, automatic cleanup.

---

### `notFound.ts`
**Location**: `src/app/middlewares/notFound.ts`

**Purpose**: 404 handler for undefined routes.

**Why Used**: Handle requests to non-existent routes gracefully.

---

## Modules Documentation

### Authentication Module (`/src/app/modules/auth/`)

**Files**:
- `auth.controller.ts`: Authentication request handlers
- `auth.service.ts`: Authentication business logic
- `auth.route.ts`: Authentication routes

**Services**:
- `getNewAccessToken()`: Generate new access token from refresh token
- `resetPassword()`: Reset user password via token
- `forgotPassword()`: Send password reset email
- `setPassword()`: Set password for OAuth users
- `changePassword()`: Change user password

**Why Used**: Centralized authentication logic, password management, token refresh.

---

### User Module (`/src/app/modules/user/`)

**Files**:
- `user.controller.ts`: User CRUD operations
- `user.service.ts`: User business logic
- `user.model.ts`: User Mongoose schema
- `user.interface.ts`: User TypeScript interfaces
- `user.validation.ts`: User validation schemas
- `user.router.ts`: User routes
- `user.constant.ts`: User constants (roles, statuses)

**User Model Schema**:
- `name`: String (required)
- `email`: String (required, unique)
- `phone`: String (optional, unique, sparse)
- `password`: String (optional)
- `role`: Enum (USER, ADMIN, SUPER_ADMIN, GUIDE)
- `picture`: String (optional)
- `address`: String (optional)
- `country`: String
- `city`: String
- `post_code`: String
- `isDeleted`: Boolean (default: false)
- `isActive`: Enum (ACTIVE, INACTIVE, BLOCKED)
- `isVerified`: Boolean (default: false)
- `auths`: Array of auth providers (Google, Credentials, Facebook)
- `wishlist`: Array of Tour ObjectIds

**Interfaces**:
- `IUser`: User document interface
- `IAuthProvider`: Authentication provider interface
- `Role`: User role enum
- `IsActive`: User status enum

**Why Used**: User management, profile handling, authentication provider tracking.

---

### Tour Module (`/src/app/modules/tour/`)

**Files**:
- `tour.controller.ts`: Tour CRUD operations
- `tour.service.ts`: Tour business logic
- `tour.model.ts`: Tour Mongoose schema
- `tour.interface.ts`: Tour TypeScript interfaces
- `tour.validation.ts`: Tour Zod validation schemas
- `tour.route.ts`: Tour routes
- `tour.constant.ts`: Tour constants

**Features**:
- Tour creation with image uploads
- Tour type management
- Tour search and filtering
- Tour slug-based routing

**Validation Schemas**:
- `createTourZodSchema`: Tour creation validation
- `updateTourZodSchema`: Tour update validation
- `createTourTypeZodSchema`: Tour type validation

**Why Used**: Tour management, tour type categorization, image handling.

---

### Booking Module (`/src/app/modules/booking/`)

**Files**:
- `booking.controller.ts`: Booking request handlers
- `booking.service.ts`: Booking business logic
- `booking.model.ts`: Booking Mongoose schema
- `booking.interface.ts`: Booking TypeScript interfaces
- `booking.validation.ts`: Booking validation schemas
- `booking.route.ts`: Booking routes
- `getTransactionId.ts`: Transaction ID generator

**Booking Service**:
- `createBooking()`: Create booking with payment initialization
- Uses MongoDB transactions for data consistency
- Integrates with SSLCommerz for payment
- Links booking with payment record
- Generates unique transaction ID for each booking
- Validates user profile completeness before booking

**Booking Flow**:
1. User creates booking
2. Booking created with PENDING status
3. Payment record created with UNPAID status
4. SSLCommerz payment URL generated
5. User redirected to payment gateway
6. Payment callback updates booking and payment status

**Transaction ID Generation**:
- `getTransactionId.ts`: Generates unique transaction IDs
- Format: `tran_{timestamp}_{randomNumber}`
- Used for payment tracking and SSLCommerz integration

**Why Used**: Booking management, payment integration, transaction handling.

---

### Payment Module (`/src/app/modules/payment/`)

**Files**:
- `payment.controller.ts`: Payment request handlers
- `payment.service.ts`: Payment business logic
- `payment.model.ts`: Payment Mongoose schema
- `payment.interface.ts`: Payment TypeScript interfaces
- `payment.route.ts`: Payment routes

**Payment Statuses**:
- `UNPAID`: Payment not initiated
- `PAID`: Payment successful
- `FAIL`: Payment failed
- `CANCEL`: Payment cancelled

**Why Used**: Payment tracking, payment status management, payment history.

---

### SSLCommerz Module (`/src/app/modules/sslCommerz/`)

**Files**:
- `sslCommerz.service.ts`: SSLCommerz API integration
- `sslCommerz.interface.ts`: SSLCommerz TypeScript interfaces

**Services**:
- `sslPaymentInit()`: Initialize payment with SSLCommerz
- Payment validation and callback handling

**Why Used**: Payment gateway integration, secure payment processing.

---

### Division Module (`/src/app/modules/division/`)

**Files**:
- `division.controller.ts`: Division CRUD operations
- `division.service.ts`: Division business logic
- `division.model.ts`: Division Mongoose schema
- `division.interface.ts`: Division TypeScript interfaces
- `division.validation.ts`: Division validation schemas
- `division.route.ts`: Division routes
- `division.constant.ts`: Division constants

**Why Used**: Location/division management for tours.

---

### OTP Module (`/src/app/modules/otp/`)

**Files**:
- `otp.controller.ts`: OTP request handlers
- `otp.service.ts`: OTP generation and verification
- `otp.routes.ts`: OTP routes

**Why Used**: OTP verification for user registration, password reset.

---

## Error Handling

### AppError Class
**Location**: `src/app/errorHelpers/AppError.ts`

**Purpose**: Custom error class with status code.

**Usage**:
```typescript
throw new AppError(404, 'User not found')
```

**Why Used**: Consistent error structure, status code management.

---

### Error Helpers
**Location**: `src/app/helpers/`

**Files**:
- `handleCastError.ts`: Handles MongoDB CastError (invalid ObjectId)
- `handleDuplicateError.ts`: Handles MongoDB duplicate key errors
- `handlerValidationError.ts`: Handles Mongoose validation errors
- `handlerZodError.ts`: Handles Zod validation errors

**Why Used**: Transform database/validation errors into user-friendly messages.

---

## Authentication & Authorization

### Passport.js Configuration
**Location**: `src/app/config/passport.ts`

**Strategies**:
1. **Local Strategy**: Email/password authentication
2. **Google Strategy**: Google OAuth 2.0 authentication

**Local Strategy Flow**:
1. User provides email/password
2. Find user by email
3. Check user is verified and active
4. Compare password with bcrypt
5. Return user if valid

**Google Strategy Flow**:
1. User authenticates with Google
2. Receive Google profile
3. Check if user exists by email
4. Create user if doesn't exist
5. Return user

**Why Used**: Multiple authentication methods, OAuth integration, session management.

---

### JWT Token System
- **Access Token**: Short-lived token for API access (stored in cookies)
- **Refresh Token**: Long-lived token for generating new access tokens
- **Password Reset Token**: Short-lived token for password reset

**Token Generation**: `src/app/utils/jwt.ts`
**Token Management**: `src/app/utils/userTokens.ts`

**Why Used**: Stateless authentication, secure token-based auth, refresh token pattern.

---

## Database Models

### User Model
**Location**: `src/app/modules/user/user.model.ts`

**Schema Features**:
- Timestamps (createdAt, updatedAt)
- Soft delete (isDeleted)
- Role-based access
- Multiple auth providers
- Wishlist (Tour references)

**Indexes**:
- Email (unique)
- Phone (unique, sparse)

---

### Tour Model
**Location**: `src/app/modules/tour/tour.model.ts`

**Schema Features**:
- Tour details (title, description, location)
- Pricing (costFrom)
- Dates (startDate, endDate)
- Images (array of Cloudinary URLs)
- Tour type reference
- Division reference
- Guest limits (maxGuest, minAge)

---

### Booking Model
**Location**: `src/app/modules/booking/booking.model.ts`

**Schema Features**:
- User reference
- Tour reference
- Payment reference
- Booking status
- Guest count
- Booking dates

---

### Payment Model
**Location**: `src/app/modules/payment/payment.model.ts`

**Schema Features**:
- Booking reference
- Payment status
- Transaction ID
- Amount
- Payment date

---

## API Routes Structure

**Base URL**: `/api/v1`

**Route Modules**:
- `/user`: User management routes
- `/auth`: Authentication routes
- `/division`: Division management routes
- `/tour`: Tour management routes
- `/booking`: Booking routes
- `/payment`: Payment routes
- `/otp`: OTP verification routes

**Route Aggregation**: `src/app/routes/index.ts`

**Why Used**: Modular routing, easy route management, consistent API structure.

---

## Code Patterns & Best Practices

### 1. **Module Pattern**
Each feature is organized as a module with:
- Controller (request handling)
- Service (business logic)
- Model (database schema)
- Routes (endpoint definitions)
- Validation (Zod schemas)
- Interfaces (TypeScript types)

**Why**: Separation of concerns, maintainability, scalability.

---

### 2. **Error Handling Pattern**
- Use `catchAsync` wrapper for async route handlers
- Throw `AppError` for application errors
- Global error handler processes all errors
- Consistent error response format

**Why**: Centralized error handling, consistent API responses.

---

### 3. **Validation Pattern**
- Zod schemas for request validation
- `validateRequest` middleware for validation
- Type inference from Zod schemas

**Why**: Type-safe validation, runtime validation, better error messages.

---

### 4. **Authentication Pattern**
- JWT tokens for stateless auth
- Role-based access control via `checkAuth` middleware
- Multiple auth providers (Local, Google)

**Why**: Flexible authentication, secure access control.

---

### 5. **Query Building Pattern**
- `QueryBuilder` class for complex queries
- Fluent API for chaining operations
- Consistent pagination and filtering

**Why**: Reusable query logic, consistent API responses.

---

### 6. **File Upload Pattern**
- Multer middleware for file handling
- Cloudinary storage for file storage
- Automatic cleanup on errors

**Why**: Scalable file storage, automatic optimization, error handling.

---

### 7. **Transaction Pattern**
- MongoDB transactions for data consistency
- Used in booking creation
- Rollback on errors

**Why**: Data integrity, atomic operations.

---

### 8. **Environment Configuration Pattern**
- Centralized env variable loading
- Validation of required variables
- Type-safe configuration

**Why**: Secure configuration, early error detection.

---

## Development Workflow

### Running the Application

**Development**:
```bash
npm run dev
```
- Uses `ts-node-dev` for hot reload
- Watches for file changes
- Automatically restarts server

**Linting**:
```bash
npm run lint
```
- Runs ESLint on source files
- Checks code quality and style

---

### Server Startup Sequence

1. Load environment variables
2. Connect to MongoDB
3. Connect to Redis
4. Start Express server
5. Seed super admin user

**Location**: `src/server.ts`

---

### Key Entry Points

- **Server Entry**: `src/server.ts`
- **App Configuration**: `src/app.ts`
- **Route Aggregation**: `src/app/routes/index.ts`

---

## Additional Notes

### File Upload Flow
1. Multer receives file
2. Cloudinary storage uploads to Cloudinary
3. File URL stored in database
4. On error, file deleted from Cloudinary

### Payment Flow
1. User creates booking
2. Payment record created
3. SSLCommerz payment URL generated
4. User redirected to payment gateway
5. Payment callback updates status
6. User redirected to frontend

### Email Templates
- Located in `src/app/utils/templates/`
- EJS templates for dynamic content
- Used for OTP, password reset, invoices

---

## Summary

This backend follows a modular, scalable architecture with:
- **TypeScript** for type safety
- **Express.js** for API framework
- **MongoDB/Mongoose** for database
- **Zod** for validation
- **Passport.js** for authentication
- **Cloudinary** for file storage
- **Redis** for caching
- **SSLCommerz** for payments

The codebase emphasizes:
- Separation of concerns
- Reusable utilities
- Consistent error handling
- Type safety
- Security best practices

---

**Last Updated**: Generated for developer onboarding and project documentation.

