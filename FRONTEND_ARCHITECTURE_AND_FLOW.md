# Frontend Architecture & Complete CRUD Flow Documentation

## Table of Contents
1. [Frontend Folder Structure Overview](#frontend-folder-structure-overview)
2. [Complete CRUD Example: Create Booking](#complete-crud-example-create-booking)
3. [Folder Roles & Responsibilities](#folder-roles--responsibilities)
4. [Data Flow Diagram](#data-flow-diagram)

---

## Frontend Folder Structure Overview

```
frontend/
├── public/                    # Static assets (images, icons, fonts)
├── src/
│   ├── app/                   # Next.js App Router pages & routing
│   │   ├── (routes)/          # Page components (UI)
│   │   ├── api/               # API routes (server-side endpoints)
│   │   ├── layout.tsx         # Root layout wrapper
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable UI components
│   │   ├── admin/             # Admin-specific components
│   │   ├── auth/              # Authentication forms
│   │   ├── common/            # Shared components (buttons, modals)
│   │   ├── hotel/             # Hotel-specific components
│   │   ├── layout/            # Layout components (TopBar, Sidebar)
│   │   └── ...
│   ├── config/                # Configuration files
│   │   └── security.config.ts # Security settings (JWT, inactivity)
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuthGuard.tsx   # Route protection
│   │   └── useInactivityTimeout.ts # Session timeout
│   ├── lib/                   # Utility libraries
│   │   ├── api.ts             # API client configuration
│   │   └── types.ts           # TypeScript type definitions
│   ├── services/              # API service layer (business logic)
│   │   ├── auth.service.ts    # Authentication API calls
│   │   ├── booking.service.ts # Booking API calls
│   │   └── ...
│   ├── store/                 # Global state management (Zustand)
│   │   └── useAuthStore.ts    # Authentication state
│   ├── types/                 # TypeScript interfaces & types
│   ├── utils/                 # Helper functions
│   │   ├── formValidation.ts  # Input validation & sanitization
│   │   └── imageUrl.ts        # Image URL helpers
│   └── middleware.ts          # Next.js middleware (auth checks)
├── .env.local                 # Environment variables
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
└── tailwind.config.ts         # Tailwind CSS configuration
```

---


## Complete CRUD Example: Create Booking

Let's trace the **"Create a Booking"** operation from user click to database storage.

### 🎯 User Journey
1. User visits hotel detail page
2. Clicks "New Booking" button
3. Fills booking form (dates, guests, contact info)
4. Clicks "Submit Booking"
5. Sees success message
6. Redirected to bookings page

---

### 📂 Step-by-Step Flow with Files

#### **STEP 1: User Interface (Page Component)**
**File:** `frontend/src/app/hotels/[id]/page.tsx`
**Role:** Display hotel details and booking form

```typescript
// User clicks "New Booking" button
<button onClick={() => setBookingModalOpen(true)}>
  New Booking
</button>

// Booking form modal
<Modal open={bookingModalOpen}>
  <form onSubmit={handleSubmitBooking}>
    <input name="checkIn" value={formData.checkIn} />
    <input name="checkOut" value={formData.checkOut} />
    <input name="numberOfGuests" value={formData.numberOfGuests} />
    <button type="submit">Submit Booking</button>
  </form>
</Modal>
```

**What happens here:**
- User interacts with UI
- Form data stored in component state (`formData`)
- Form validation triggered on submit

---

#### **STEP 2: Form Validation (Utils)**
**File:** `frontend/src/utils/formValidation.ts`
**Role:** Validate and sanitize user input

```typescript
// Validate phone number
const phoneResult = validateInternationalPhone(fullPhone);
if (!phoneResult.valid) {
  errors.clientPhone = phoneResult.error!;
}

// Sanitize phone input (remove special characters)
export const sanitizeInternationalPhone = (value: string): string => {
  return value.replace(/[^0-9\s\-\(\)\+]/g, '');
};
```

**What happens here:**
- Input validation (required fields, date ranges, phone format)
- Input sanitization (remove malicious characters)
- Error messages generated if validation fails

---

#### **STEP 3: Authentication Check (Store)**
**File:** `frontend/src/store/useAuthStore.ts`
**Role:** Check if user is authenticated

```typescript
const { token, isAuthenticated, userId } = useAuthStore();

if (!isAuthenticated) {
  setAuthModal(true); // Show login modal
  return;
}
```

**What happens here:**
- Zustand store provides authentication state
- Token retrieved from localStorage
- If not authenticated, show login modal

---

#### **STEP 4: API Service Call (Service Layer)**
**File:** `frontend/src/services/booking.service.ts`
**Role:** Make HTTP request to backend API

```typescript
const handleSubmitBooking = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Prepare booking data
  const bookingData = {
    hotelId: hotel.id,
    checkIn: formData.checkIn,
    checkOut: formData.checkOut,
    numberOfGuests: formData.numberOfGuests,
    clientPhone: `${phoneCountryCode}${formData.clientPhone}`,
    clientEmail: formData.clientEmail
  };
  
  // Call service
  const newBooking = await BookingService.createBooking(
    token, 
    userId, 
    bookingData
  );
};

// In booking.service.ts
static async createBooking(
  token: string, 
  userId: number, 
  data: BookingRequest
): Promise<Booking> {
  const response = await fetch(
    `${API_BASE_URL}/bookings?userId=${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }
  );
  return handleResponse<Booking>(response);
}
```

**What happens here:**
- Service layer abstracts API calls
- JWT token added to Authorization header
- Request body formatted as JSON
- Response parsed and typed

---

#### **STEP 5: API Configuration (Services)**
**File:** `frontend/src/services/api.ts` ✅ **(ACTUAL LOCATION - NOT lib/api.ts)**
**Role:** Configure API base URL and error handling

```typescript
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api';

// Error handling for 401 responses
const handle401Error = async () => {
  const { refreshAccessToken, logout, refreshToken } = 
    (await import('@/store/useAuthStore')).useAuthStore.getState();
  
  if (refreshToken) {
    console.log('🔄 401 received, attempting token refresh...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return; // Retry the request
    }
  }
  
  // Refresh failed - logout and redirect
  await logout();
  window.location.href = '/auth/login';
};

// Response handler
async function handleRegularResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      await handle401Error();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(errorText || `API failed: ${res.status}`);
  }
  return res.json();
}
```

**What happens here:**
- API base URL configured from environment variables
- Global error handling (401 triggers token refresh)
- Response parsing and error extraction
- Automatic logout on authentication failure

**⚠️ IMPORTANT NOTE:** 
- The file `frontend/src/lib/api.ts` was DELETED (it was empty)
- The ACTUAL API configuration is in `frontend/src/services/api.ts`
- All services import from `services/api.ts`

---

#### **STEP 6: Backend Receives Request**
**File:** `backend-nodejs/src/index.js`
**Role:** Express server entry point

```javascript
// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Audit middleware (logs all requests)
app.use(auditMiddleware);

// Route to bookings controller
app.use('/api/bookings', require('./controllers/bookings.controller'));
```

**What happens here:**
- CORS validation (only allowed origins)
- Security headers added
- Request logged by audit middleware
- Routed to bookings controller

---

#### **STEP 7: Authentication Middleware**
**File:** `backend-nodejs/src/middleware/auth.middleware.js`
**Role:** Verify JWT token

```javascript
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1]; // Extract "Bearer <token>"
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.sub,
      roles: decoded.roles
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

**What happens here:**
- JWT token extracted from Authorization header
- Token verified using secret key
- User info decoded and attached to request
- Request proceeds to controller if valid

---

#### **STEP 8: Audit Middleware (Security)**
**File:** `backend-nodejs/src/middleware/audit.middleware.js`
**Role:** Log request and detect attacks

```javascript
function auditMiddleware(req, res, next) {
  const { method, url, body, query } = req;
  
  // Detect SQL injection
  const attackType = scanForAttacks(query);
  if (attackType) {
    auditService.log(userId, 'AUTHORIZATION_CHECK', 'BOOKING', null, 
      { attackType, url }, ipAddress, userAgent);
  }
  
  // Sanitize sensitive fields
  const safeBody = sanitizeBody(body);
  
  // Log the request
  auditService.log(userId, 'CREATE', 'BOOKING', null, 
    { method, url, body: safeBody }, ipAddress, userAgent);
  
  next();
}
```

**What happens here:**
- XSS and SQL injection detection
- Sensitive data redaction (passwords, tokens)
- Request logged to audit trail
- Attack attempts flagged

---

#### **STEP 9: Controller (Request Handler)**
**File:** `backend-nodejs/src/controllers/bookings.controller.js`
**Role:** Handle HTTP request and call service

```javascript
router.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = parseInt(req.query.userId);
    const bookingData = req.body;
    
    // Validate request
    if (!bookingData.hotelId || !bookingData.checkIn) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }
    
    // Call service
    const booking = await bookingsService.createBooking(
      userId, 
      bookingData
    );
    
    res.status(201).json(booking);
  } catch (err) {
    next(err); // Pass to error handler
  }
});
```

**What happens here:**
- Extract userId from query params
- Extract booking data from request body
- Basic validation
- Call service layer for business logic
- Return response (201 Created)

---

#### **STEP 10: Service Layer (Business Logic)**
**File:** `backend-nodejs/src/services/bookings.service.js`
**Role:** Business logic and database operations

```javascript
async createBooking(userId, data) {
  // Validate hotel exists and is active
  const hotel = await prisma.hotel.findUnique({ 
    where: { id: data.hotelId } 
  });
  if (!hotel) {
    throw Object.assign(new Error('Hotel not found'), { status: 404 });
  }
  if (!hotel.active) {
    throw Object.assign(new Error('Hotel is inactive'), { status: 400 });
  }
  
  // Validate dates
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  if (checkOut <= checkIn) {
    throw Object.assign(
      new Error('Check-out must be after check-in'), 
      { status: 400 }
    );
  }
  
  // Get REQUESTED status
  const status = await prisma.bookingStatusEntity.findUnique({ 
    where: { name: 'REQUESTED' } 
  });
  
  // Create booking
  const booking = await prisma.booking.create({
    data: {
      clientId: userId,
      hotelId: data.hotelId,
      checkIn,
      checkOut,
      numberOfGuests: data.numberOfGuests,
      numberOfRooms: data.numberOfRooms || 1,
      specialRequests: data.specialRequests,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail,
      statusId: status.id
    },
    include: {
      hotel: true,
      client: true,
      status: true
    }
  });
  
  // Send email notification to hotel owner
  await this.sendBookingNotification(booking);
  
  return booking;
}
```

**What happens here:**
- Business validation (hotel exists, dates valid)
- Database query using Prisma ORM
- Booking created with REQUESTED status
- Email notification sent
- Booking returned with relations

---

#### **STEP 11: Database (Prisma ORM)**
**File:** `backend-nodejs/prisma/schema.prisma`
**Role:** Database schema and ORM

```prisma
model Booking {
  id                Int      @id @default(autoincrement())
  clientId          Int
  hotelId           Int
  checkIn           DateTime
  checkOut          DateTime
  numberOfGuests    Int
  numberOfRooms     Int      @default(1)
  specialRequests   String?
  clientPhone       String?
  clientEmail       String?
  statusId          Int
  totalCost         Decimal?
  receiptImageUrl   String?
  rejectionReason   String?
  problemReport     String?
  problemReported   Boolean  @default(false)
  hiddenFromClient  Boolean  @default(false)
  hiddenFromOwner   Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  client            User     @relation("ClientBookings", fields: [clientId], references: [id])
  hotel             Hotel    @relation(fields: [hotelId], references: [id])
  status            BookingStatusEntity @relation(fields: [statusId], references: [id])
  messages          BookingMessage[]
  
  @@map("bookings")
}
```

**What happens here:**
- Prisma generates type-safe database queries
- Parameterized queries prevent SQL injection
- Relations automatically joined
- Data validated against schema
- Record inserted into PostgreSQL database

---

#### **STEP 12: Email Notification**
**File:** `backend-nodejs/src/services/email-gmail.service.js`
**Role:** Send email notifications

```javascript
async sendBookingNotification(booking) {
  const hotel = booking.hotel;
  const owner = await prisma.user.findUnique({ 
    where: { id: hotel.ownerId } 
  });
  
  if (owner?.email) {
    await emailService.sendEmail(
      owner.email,
      `New Booking Request - ${hotel.name}`,
      `
        <h2>New Booking Request</h2>
        <p>Check-in: ${booking.checkIn}</p>
        <p>Guests: ${booking.numberOfGuests}</p>
        <a href="${FRONTEND_URL}/owner/bookings">
          View Booking
        </a>
      `
    );
  }
}
```

**What happens here:**
- Hotel owner email retrieved
- Email sent via Nodemailer (Gmail SMTP)
- Owner notified of new booking request

---

#### **STEP 13: Response Back to Frontend**
**Flow:** Backend → Frontend

```javascript
// Backend sends response
res.status(201).json({
  bookingId: 123,
  hotel: { id: 1, name: "Grand Hotel" },
  client: { id: 5, username: "john_doe" },
  checkIn: "2026-06-01",
  checkOut: "2026-06-05",
  numberOfGuests: 2,
  bookingStatus: "REQUESTED",
  createdAt: "2026-05-18T10:30:00Z"
});
```

```typescript
// Frontend receives response
const newBooking = await BookingService.createBooking(...);
// newBooking is typed as Booking interface

// Show success message
toast.success('Booking request submitted successfully!');

// Redirect to bookings page
router.push('/bookings');
```

**What happens here:**
- Backend returns JSON response
- Frontend parses response
- Success toast notification shown
- User redirected to bookings page

---

#### **STEP 14: Global Error Handler**
**File:** `backend-nodejs/src/exception/GlobalExceptionHandler.js`
**Role:** Catch and format errors

```javascript
function globalExceptionHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  console.error(`[ERROR] ${status}: ${message}`, err.stack);
  
  res.status(status).json({
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
}
```

**What happens here:**
- All errors caught by this handler
- Error logged to console
- Formatted error response sent to frontend
- Stack trace hidden in production

---


## Folder Roles & Responsibilities

### Frontend Folders

| Folder | Role | Examples | Communication |
|--------|------|----------|---------------|
| **`public/`** | Static assets served directly | Images, icons, fonts | Accessed via `/images/logo.png` |
| **`src/app/`** | Next.js pages & routing | `hotels/[id]/page.tsx` | Calls services, uses hooks, renders components |
| **`src/app/api/`** | Server-side API routes | `image-proxy/route.ts` | Runs on server, can access backend directly |
| **`src/components/`** | Reusable UI components | `Modal.tsx`, `Button.tsx` | Used by pages, receives props |
| **`src/config/`** | Configuration files | `security.config.ts` | Imported by hooks, services |
| **`src/hooks/`** | Custom React hooks | `useAuthGuard.tsx` | Used by pages, accesses store |
| **`src/lib/`** | Type definitions only | `types.ts` (api.ts is empty) | Imported for TypeScript types |
| **`src/services/`** | API service layer & API config | `api.ts`, `booking.service.ts` | Calls backend API, returns typed data |
| **`src/store/`** | Global state (Zustand) | `useAuthStore.ts` | Accessed by pages, hooks, services |
| **`src/types/`** | TypeScript types | `booking.ts`, `hotel.ts` | Imported everywhere for type safety |
| **`src/utils/`** | Helper functions | `formValidation.ts` | Used by pages, components |
| **`src/middleware.ts`** | Next.js middleware | Route protection | Runs before page loads |

---

### Backend Folders

| Folder | Role | Examples | Communication |
|--------|------|----------|---------------|
| **`src/controllers/`** | HTTP request handlers | `bookings.controller.js` | Receives requests, calls services |
| **`src/services/`** | Business logic | `bookings.service.js` | Called by controllers, uses Prisma |
| **`src/middleware/`** | Request interceptors | `auth.middleware.js` | Runs before controllers |
| **`src/dto/`** | Data Transfer Objects | `booking.dto.js` | Validates request/response data |
| **`src/lib/`** | Shared utilities | `prisma.js` | Database client, shared across services |
| **`src/exception/`** | Error handlers | `GlobalExceptionHandler.js` | Catches all errors |
| **`prisma/`** | Database schema & migrations | `schema.prisma` | Defines database structure |
| **`uploads/`** | File storage | `hotel-images/`, `receipts/` | Stores uploaded files |

---


## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
└─────────────────────────────────────────────────────────────────┘

1. USER INTERACTION
   ┌──────────────────────────────────────┐
   │  app/hotels/[id]/page.tsx            │  ← User clicks "Submit Booking"
   │  (Page Component)                    │
   └──────────────┬───────────────────────┘
                  │
                  ↓
2. VALIDATION
   ┌──────────────────────────────────────┐
   │  utils/formValidation.ts             │  ← Validate & sanitize input
   │  (Input Validation)                  │
   └──────────────┬───────────────────────┘
                  │
                  ↓
3. AUTH CHECK
   ┌──────────────────────────────────────┐
   │  store/useAuthStore.ts               │  ← Check if user is logged in
   │  (Zustand State)                     │  ← Get JWT token
   └──────────────┬───────────────────────┘
                  │
                  ↓
4. API CALL
   ┌──────────────────────────────────────┐
   │  services/booking.service.ts         │  ← Make HTTP POST request
   │  (Service Layer)                     │  ← Add Authorization header
   └──────────────┬───────────────────────┘
                  │
                  ↓
5. API CONFIG
   ┌──────────────────────────────────────┐
   │  services/api.ts                     │  ← Configure API base URL
   │  (API Configuration)                 │  ← Handle errors (401, etc.)
   └──────────────┬───────────────────────┘
                  │
                  ↓ HTTP POST /api/bookings
                  │
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
└─────────────────────────────────────────────────────────────────┘

6. SERVER ENTRY
   ┌──────────────────────────────────────┐
   │  src/index.js                        │  ← Express server
   │  (Server Entry Point)                │  ← CORS, Security headers
   └──────────────┬───────────────────────┘
                  │
                  ↓
7. AUDIT LOGGING
   ┌──────────────────────────────────────┐
   │  middleware/audit.middleware.js      │  ← Log request
   │  (Audit Middleware)                  │  ← Detect XSS/SQL injection
   └──────────────┬───────────────────────┘
                  │
                  ↓
8. AUTHENTICATION
   ┌──────────────────────────────────────┐
   │  middleware/auth.middleware.js       │  ← Verify JWT token
   │  (Auth Middleware)                   │  ← Decode user info
   └──────────────┬───────────────────────┘
                  │
                  ↓
9. CONTROLLER
   ┌──────────────────────────────────────┐
   │  controllers/bookings.controller.js  │  ← Handle HTTP request
   │  (Request Handler)                   │  ← Extract data from body
   └──────────────┬───────────────────────┘
                  │
                  ↓
10. SERVICE LAYER
   ┌──────────────────────────────────────┐
   │  services/bookings.service.js        │  ← Business logic
   │  (Business Logic)                    │  ← Validate hotel, dates
   └──────────────┬───────────────────────┘
                  │
                  ↓
11. DATABASE
   ┌──────────────────────────────────────┐
   │  prisma/schema.prisma                │  ← Prisma ORM
   │  (Database Layer)                    │  ← Insert booking record
   └──────────────┬───────────────────────┘
                  │
                  ↓
   ┌──────────────────────────────────────┐
   │  PostgreSQL Database                 │  ← Data persisted
   │  (bookings table)                    │
   └──────────────┬───────────────────────┘
                  │
                  ↓
12. EMAIL NOTIFICATION
   ┌──────────────────────────────────────┐
   │  services/email-gmail.service.js     │  ← Send email to hotel owner
   │  (Email Service)                     │  ← Nodemailer + Gmail SMTP
   └──────────────┬───────────────────────┘
                  │
                  ↓
13. RESPONSE
   ┌──────────────────────────────────────┐
   │  controllers/bookings.controller.js  │  ← Return JSON response
   │  (Response)                          │  ← Status 201 Created
   └──────────────┬───────────────────────┘
                  │
                  ↓ HTTP 201 + JSON
                  │
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
└─────────────────────────────────────────────────────────────────┘

14. RESPONSE HANDLING
   ┌──────────────────────────────────────┐
   │  services/booking.service.ts         │  ← Parse response
   │  (Service Layer)                     │  ← Type as Booking interface
   └──────────────┬───────────────────────┘
                  │
                  ↓
15. UI UPDATE
   ┌──────────────────────────────────────┐
   │  app/hotels/[id]/page.tsx            │  ← Show success toast
   │  (Page Component)                    │  ← Redirect to /bookings
   └──────────────────────────────────────┘
```

---


## Detailed Folder Explanations

### 1. **`public/` - Static Assets**
**Purpose:** Store static files that don't need processing

**Contents:**
- Images (logos, icons, hero images)
- Fonts
- Favicons
- robots.txt, sitemap.xml

**Access:** Directly via URL
```html
<img src="/images/logo.png" alt="Logo" />
```

**Communication:** None - served directly by Next.js

---

### 2. **`src/app/` - Pages & Routing**
**Purpose:** Next.js App Router - each folder is a route

**Structure:**
```
app/
├── page.tsx                    # Home page (/)
├── layout.tsx                  # Root layout (wraps all pages)
├── hotels/
│   ├── page.tsx                # Hotels list (/hotels)
│   └── [id]/
│       └── page.tsx            # Hotel detail (/hotels/123)
├── bookings/
│   └── page.tsx                # My bookings (/bookings)
├── auth/
│   ├── login/page.tsx          # Login page (/auth/login)
│   └── register/page.tsx       # Register page (/auth/register)
└── api/
    └── image-proxy/route.ts    # API route (/api/image-proxy)
```

**Role:**
- Display UI to users
- Handle user interactions
- Call services for data
- Manage local component state
- Use hooks for side effects

**Communication:**
- Imports components from `components/`
- Calls services from `services/`
- Uses hooks from `hooks/`
- Accesses store from `store/`

---

### 3. **`src/components/` - Reusable UI**
**Purpose:** Shared UI components used across pages

**Structure:**
```
components/
├── common/              # Shared across entire app
│   ├── Modal.tsx
│   ├── Button.tsx
│   ├── Toast.tsx
│   └── InactivityMonitor.tsx
├── auth/                # Authentication-specific
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── hotel/               # Hotel-specific
│   ├── HotelCard.tsx
│   └── HotelRatingModal.tsx
└── layout/              # Layout components
    ├── TopBar.tsx
    └── Sidebar.tsx
```

**Role:**
- Encapsulate reusable UI logic
- Accept props for customization
- Emit events via callbacks
- No direct API calls (use services via props)

**Communication:**
- Imported by pages
- Can import other components
- Receives data via props
- Calls parent callbacks

---

### 4. **`src/config/` - Configuration**
**Purpose:** Centralized configuration settings

**Files:**
- `security.config.ts` - JWT expiration, inactivity timeout

**Example:**
```typescript
export const SecurityConfig = {
  jwt: {
    accessTokenExpiration: 30 * 60 * 1000,  // 30 minutes
    refreshTokenExpiration: 7 * 60 * 60 * 1000,  // 7 hours
  },
  inactivity: {
    timeout: 7 * 60 * 1000,  // 7 minutes
    activityEvents: ['mousedown', 'keydown', 'scroll']
  }
};
```

**Communication:**
- Imported by hooks (`useInactivityTimeout`)
- Imported by store (`useAuthStore`)
- No dependencies

---

### 5. **`src/hooks/` - Custom React Hooks**
**Purpose:** Reusable stateful logic

**Files:**
- `useAuthGuard.tsx` - Protect routes (redirect if not authenticated)
- `useInactivityTimeout.ts` - Auto-logout after inactivity

**Example:**
```typescript
// useAuthGuard.tsx
export function useAuthGuard(requiredRole?: UserRole) {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
    if (requiredRole && role !== requiredRole) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, role]);
}

// Usage in page
function AdminPage() {
  useAuthGuard('ADMIN');  // Redirect if not admin
  return <div>Admin Dashboard</div>;
}
```

**Communication:**
- Used by pages
- Accesses store (`useAuthStore`)
- Uses Next.js router
- Imports config

---

### 6. **`src/lib/` - Utility Libraries**
**Purpose:** Shared utilities and type definitions

**Files:**
- ✅ `types.ts` - Shared TypeScript type definitions

**Note:** The `lib/api.ts` file was removed (it was empty). API configuration is in `services/api.ts`.

**Example:**
```typescript
// types.ts (ACTUAL CONTENT)
export interface Hotel {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface Booking {
  id: number;
  hotelId: number;
  clientId: number;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
}
```

**Communication:**
- `types.ts` imported by services, pages, components

---

### 7. **`src/services/` - API Service Layer**
**Purpose:** Abstract API calls, provide typed interfaces

**Files:**
- `auth.service.ts` - Login, register, logout
- `booking.service.ts` - CRUD operations for bookings
- `hotel.service.ts` - Hotel operations
- `api.ts` - Shared API utilities

**Example:**
```typescript
// booking.service.ts
export class BookingService {
  static async createBooking(
    token: string, 
    userId: number, 
    data: BookingRequest
  ): Promise<Booking> {
    const response = await fetch(
      `${API_BASE_URL}/bookings?userId=${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }
    );
    return handleResponse<Booking>(response);
  }
  
  static async getMyBookings(
    token: string, 
    userId: number
  ): Promise<Booking[]> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/my?userId=${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return handleResponse<Booking[]>(response);
  }
}
```

**Role:**
- Encapsulate HTTP requests
- Add authentication headers
- Parse responses
- Handle errors
- Type responses

**Communication:**
- Called by pages
- Uses `services/api.ts` for API calls
- Returns typed data from `types/`

---

### 8. **`src/store/` - Global State (Zustand)**
**Purpose:** Manage global application state

**Files:**
- `useAuthStore.ts` - Authentication state

**Example:**
```typescript
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  username: string | null;
  userId: number | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  
  login: (token: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  
  login: (token, refreshToken) => {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    const decoded = jwtDecode(token);
    set({
      token,
      refreshToken,
      username: decoded.sub,
      userId: decoded.userId,
      isAuthenticated: true
    });
  },
  
  logout: async () => {
    await logoutAPI(get().refreshToken);
    localStorage.removeItem("token");
    set({ token: null, isAuthenticated: false });
  }
}));
```

**Role:**
- Persist authentication state
- Sync with localStorage
- Provide state to all components
- Handle token refresh

**Communication:**
- Accessed by pages, hooks, services
- Calls auth service for API operations
- Reads/writes localStorage

---

### 9. **`src/types/` - TypeScript Types**
**Purpose:** Shared type definitions

**Files:**
- `booking.ts` - Booking interfaces
- `hotel.ts` - Hotel interfaces
- `auth.ts` - Authentication types

**Example:**
```typescript
// booking.ts
export interface Booking {
  bookingId: number;
  hotel: HotelInfo;
  client: ClientInfo;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  bookingStatus: string;
  totalCost?: number;
  createdAt: string;
}

export interface BookingRequest {
  hotelId: number;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  specialRequests?: string;
}
```

**Role:**
- Provide type safety
- Document data structures
- Enable IDE autocomplete
- Catch type errors at compile time

**Communication:**
- Imported everywhere
- No dependencies

---

### 10. **`src/utils/` - Helper Functions**
**Purpose:** Reusable utility functions

**Files:**
- `formValidation.ts` - Input validation & sanitization
- `imageUrl.ts` - Image URL helpers

**Example:**
```typescript
// formValidation.ts
export const validateInternationalPhone = (phone: string) => {
  if (!phone) return { valid: false, error: 'Phone is required' };
  if (phone.length < 10) return { valid: false, error: 'Too short' };
  if (phone.length > 15) return { valid: false, error: 'Too long' };
  return { valid: true };
};

export const sanitizeUsername = (value: string): string => {
  // Only allow letters, numbers, underscore
  let sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
  // Must start with letter
  if (sanitized.length > 0 && !/^[a-zA-Z]/.test(sanitized)) {
    sanitized = sanitized.substring(1);
  }
  return sanitized;
};

// imageUrl.ts
export const getImageUrl = (url: string, fallback: string): string => {
  if (!url) return fallback;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${API_BASE_URL}${url}`;
  return fallback;
};
```

**Role:**
- Validate user input
- Sanitize data (prevent XSS)
- Format data
- Pure functions (no side effects)

**Communication:**
- Called by pages, components
- No dependencies

---

### 11. **`src/middleware.ts` - Next.js Middleware**
**Purpose:** Run code before page loads

**Example:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;
  
  // Protect admin routes
  if (path.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // Verify token has admin role
    const decoded = jwtDecode(token);
    if (!decoded.roles.includes('ROLE_ADMIN')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // Protect owner routes
  if (path.startsWith('/owner')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/bookings/:path*']
};
```

**Role:**
- Route protection
- Authentication checks
- Redirects
- Runs on server before page loads

**Communication:**
- Reads cookies
- No access to React state
- Can redirect to other pages

---

## Communication Flow Summary

### Frontend Internal Communication

```
┌─────────────┐
│   Pages     │ ← User interaction
└──────┬──────┘
       │
       ├─→ Components (UI rendering)
       ├─→ Hooks (side effects, auth guards)
       ├─→ Store (global state)
       ├─→ Services (API calls)
       └─→ Utils (validation, formatting)
       
┌─────────────┐
│  Services   │ ← API abstraction
└──────┬──────┘
       │
       ├─→ services/api.ts (API configuration)
       ├─→ types/ (type definitions)
       └─→ Backend API (HTTP requests)
       
┌─────────────┐
│   Store     │ ← Global state
└──────┬──────┘
       │
       ├─→ localStorage (persistence)
       ├─→ Services (API calls)
       └─→ All components (state access)
```

---

### Backend Internal Communication

```
┌─────────────┐
│   index.js  │ ← Express server entry
└──────┬──────┘
       │
       ├─→ CORS middleware
       ├─→ Security headers
       ├─→ Audit middleware
       └─→ Routes
       
┌─────────────┐
│ Controllers │ ← HTTP request handlers
└──────┬──────┘
       │
       ├─→ Auth middleware (JWT verification)
       ├─→ Services (business logic)
       └─→ Response formatting
       
┌─────────────┐
│  Services   │ ← Business logic
└──────┬──────┘
       │
       ├─→ Prisma ORM (database queries)
       ├─→ Email service (notifications)
       └─→ Validation logic
       
┌─────────────┐
│   Prisma    │ ← Database ORM
└──────┬──────┘
       │
       └─→ PostgreSQL Database
```

---

## Key Takeaways

### 1. **Separation of Concerns**
- **Pages** handle UI and user interaction
- **Services** handle API communication
- **Store** handles global state
- **Utils** handle data transformation
- **Components** handle reusable UI

### 2. **Type Safety**
- TypeScript types defined in `types/`
- Services return typed data
- Pages receive typed props
- Compile-time error checking

### 3. **Security Layers**
- **Frontend:** Input validation, sanitization, token management
- **Backend:** JWT verification, XSS/SQL detection, audit logging
- **Database:** Parameterized queries, schema validation

### 4. **Data Flow**
```
User Input → Validation → Auth Check → API Call → 
Backend Middleware → Controller → Service → Database → 
Response → Frontend Service → Page → UI Update
```

### 5. **State Management**
- **Local State:** Component-specific (useState)
- **Global State:** Authentication (Zustand)
- **Server State:** API data (fetched on demand)
- **Persistent State:** localStorage (tokens)

---

## Example: Reading the Flow

When you see a booking creation:

1. **Start at:** `app/hotels/[id]/page.tsx` (user clicks button)
2. **Validation:** `utils/formValidation.ts` (check input)
3. **Auth:** `store/useAuthStore.ts` (get token)
4. **API Call:** `services/booking.service.ts` (HTTP POST)
5. **Backend:** `controllers/bookings.controller.js` (receive request)
6. **Business Logic:** `services/bookings.service.js` (validate & create)
7. **Database:** `prisma/schema.prisma` (insert record)
8. **Response:** Back through the chain to UI

---

**Last Updated:** May 18, 2026
**Maintained By:** Tourism System Development Team
