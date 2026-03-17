
 
#  <span style="color:red"> Woldia University  Software Engineering  2025 E.Ct</span>  
#  <span style="color:green">North Wollo Tourism Management system Web service Project group 6</span> 

### A full-stack webservice project for managing tourism destinations, hotels, and bookings in the North Wollo Zone of Ethiopia.

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.12-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)
![Java](https://img.shields.io/badge/Java-17-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

##  Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Team Members](#-team-members)

---

##  Overview

The North Wollo Tourism Management System is a web-based platform designed to:

- **Showcase** tourism destinations in North Wollo Zone, Ethiopia
- **Enable** hotel booking and management with a complete workflow
- **Provide** road information and navigation assistance
- **Connect** tourists with language guides and horse services
- **Manage** user accounts with role-based access control

This project was developed as part of the Web Service course at Woldia University, Institute of Technology, Software Engineering 5th Year (2025 E.C).

---

##  Features

###  Authentication & Security
- JWT-based authentication with access and refresh tokens
- BCrypt password hashing
- Email verification with OTP
- Password reset functionality
- Account lockout protection (after 5 failed attempts)
- Comprehensive audit logging
- Role-based access control (USER, HOTEL_OWNER, ADMIN)

###  Tourism Management
- Tourism place listings with categories
- Image galleries for each destination
- Rating and review system
- Search and filter functionality
- Detailed place information (location, best time, languages)

###  Hotel Management
- Hotel listings with star ratings
- Hotel image management
- Owner assignment by admin
- Active/inactive status control

###  Booking System
- Complete booking workflow (Request → Accept → Cost Proposal → Payment → Approval)
- Receipt image upload
- Messaging between client and hotel owner
- Problem reporting to admin
- Booking status tracking

###  Road & Services
- Road information with distances (car, foot, horse, plane)
- Horse service providers
- Language guide directory
- Interactive map with Leaflet

###  Admin Dashboard
- User management (CRUD, role assignment)
- Tourism place management
- Hotel management
- Booking oversight
- Audit log viewer
- Security monitoring

---

##  Technology Stack

### Backend (Spring Boot)
| Technology | Version | Purpose |
|------------|---------|---------|
| Spring Boot | 3.2.12 | Main Framework |
| Java | 17 | Programming Language |
| Spring Data JPA | - | ORM / Database Access |
| PostgreSQL | Latest | Relational Database |
| Spring Security | - | Authentication & Authorization |
| JWT (jjwt) | 0.11.5 | Token-based Authentication |
| Spring Mail | - | Email Services |
| Swagger/OpenAPI | 2.5.0 | API Documentation |
| Lombok | - | Code Generation |
| Maven | - | Build Tool |

### Backend Alternative (NestJS)
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | Latest | Node.js Framework |
| Node.js | 18+ | Runtime |
| TypeScript | 5.0 | Programming Language |
| Prisma | Latest | ORM / Database Access |
| PostgreSQL | Latest | Relational Database |
| JWT | - | Token-based Authentication |
| Nodemailer | - | Email Services |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.0.0 | React Framework |
| React | 18.2.0 | UI Library |
| TypeScript | 5.0 | Type-safe JavaScript |
| Tailwind CSS | 3.4 | Styling Framework |
| Axios | 1.6.0 | HTTP Client |
| React Query | 4.30 | Server State Management |
| Zustand | 4.5.0 | Client State Management |
| Leaflet | 1.9.4 | Interactive Maps |

---

##  System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │  Auth   │ │ Tourism │ │  Hotel  │ │  Admin  │            │
│  │  Pages  │ │  Pages  │ │  Pages  │ │  Pages  │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────────────────┘
                          │ HTTPS/REST (JSON)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 SPRING BOOT APPLICATION                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Controller Layer (REST APIs)            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer (Business Logic)          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Repository Layer (Spring Data JPA)        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│                    (22+ Tables)                             │
└─────────────────────────────────────────────────────────────┘
```

---

##  Database Schema

### Entity Relationship Overview

The system consists of **22 main entities** organized into the following groups:

#### User & Authentication (8 tables)
- `users` - User accounts
- `roles` - User roles (USER, HOTEL_OWNER, ADMIN)
- `user_roles` - Many-to-many relationship
- `refresh_tokens` - JWT refresh tokens
- `password_reset_tokens` - Password reset OTPs
- `email_verification_tokens` - Email verification OTPs
- `account_lockouts` - Account lockout records
- `login_attempts` - Login attempt tracking

#### Tourism (4 tables)
- `tourism_places` - Tourism destinations
- `tourism_images` - Tourism place images
- `tourism_ratings` - User ratings for tourism places
- `tourism_place_languages` - Languages spoken at places

#### Hotels (4 tables)
- `hotels` - Hotel information
- `hotel_images` - Hotel images
- `hotel_ratings` - User ratings for hotels
- `hotel_bookings` - Booking records

#### Booking System (2 tables)
- `booking_statuses` - Booking status definitions
- `booking_messages` - Conversation messages

#### Services (4 tables)
- `road_infos` - Road information
- `horse_services` - Horse service providers
- `language_guiders` - Language guide directory
- `map_points` - Geographic coordinates

#### Audit (1 table)
- `audit_log_entries` - System audit logs

### Key Relationships

```
Users ──┬── Roles (M:N)
        ├── Hotels (1:N as owner)
        ├── HotelBookings (1:N as client)
        ├── TourismRatings (1:N)
        └── HotelRatings (1:N)

TourismPlaces ──┬── TourismImages (1:N)
                ├── TourismRatings (1:N)
                ├── Hotels (1:N)
                ├── RoadInfos (1:N)
                ├── LanguageGuiders (1:N)
                └── MapPoints (1:N)

Hotels ──┬── HotelImages (1:N)
         ├── HotelRatings (1:N)
         ├── HotelBookings (1:N)
         └── MapPoints (1:N)

HotelBookings ──┬── BookingStatus (N:1)
                └── BookingMessages (1:N)

RoadInfos ──┬── HorseServices (1:N)
            └── MapPoints (1:N)
```

---

##  API Documentation

### Base URL
```
Backend: https://localhost:8443
Frontend: https://localhost:3000
Swagger UI: https://localhost:8443/swagger-ui.html
```

---

###  Authentication Endpoints

#### AuthController (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/login` | User login with credentials | Public |
| POST | `/api/auth/register` | Register new user account | Public |

#### PasswordResetController (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/reset-password` | Initiate password reset (send OTP) | Public |
| POST | `/api/auth/reset-password/confirm` | Confirm password reset with OTP | Public |
| GET | `/api/auth/reset-password/validate` | Validate reset token | Public |

#### EmailVerificationController (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/send-verification` | Send email verification OTP | Public |
| POST | `/api/auth/verify-email` | Verify email with OTP | Public |
| POST | `/api/auth/verify-email-otp` | Verify email with email + OTP | Public |
| POST | `/api/auth/resend-verification` | Resend verification OTP | Authenticated |
| GET | `/api/auth/verify-email/validate` | Validate verification token | Public |
| GET | `/api/auth/email-verified` | Check if email is verified | Public |

#### TokenRefreshController (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/refresh` | Refresh access token | Public |

---

###  Admin User Management Endpoints

#### AdminController (`/api/admin`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | Get all users (paginated, sorted, searchable) | ADMIN |
| GET | `/api/admin/users/{id}` | Get user by ID | ADMIN |
| GET | `/api/admin/users/role/{role}` | Get users by role | ADMIN |
| PUT | `/api/admin/users/{id}` | Update user | ADMIN |
| POST | `/api/admin/users/{id}/reset-password` | Reset user password | ADMIN |
| PATCH | `/api/admin/users/{id}/activate` | Activate user account | ADMIN |
| PATCH | `/api/admin/users/{id}/deactivate` | Deactivate user account | ADMIN |
| DELETE | `/api/admin/users/{id}` | Delete user | ADMIN |
| POST | `/api/admin/users/{id}/roles/{role}` | Grant role to user | ADMIN |
| DELETE | `/api/admin/users/{id}/roles/{role}` | Revoke role from user | ADMIN |
| POST | `/api/admin/hotels/{hotelId}/owner/{userId}` | Assign hotel owner | ADMIN |
| DELETE | `/api/admin/hotels/{hotelId}/owner` | Remove hotel owner | ADMIN |
| PATCH | `/api/admin/hotels/{hotelId}/active` | Toggle hotel active status | ADMIN |

---

###  Tourism Management Endpoints

#### PublicTourismController (`/api/tourisms`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tourisms/{id}` | Get tourism place full details | Public |
| GET | `/api/tourisms/health` | API health check | Public |

#### PublicTourismSearchController (`/api/tourisms/public`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tourisms/public/search` | Search tourism places (paginated, filtered) | Public |

#### HomepageTourismController (`/api/tourisms/public`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tourisms/public/homepage` | Get tourism places by categories | Public |

#### AdminTourismController (`/api/admin/tourism`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/tourism/list` | Get all tourism places (simple list) | ADMIN |
| GET | `/api/admin/tourism/all` | Get all tourism places (full details) | ADMIN |
| POST | `/api/admin/tourism` | Create new tourism place | ADMIN |
| PUT | `/api/admin/tourism/{id}` | Update tourism place | ADMIN |
| DELETE | `/api/admin/tourism/{id}` | Delete tourism place | ADMIN |
| GET | `/api/admin/tourism/{tourismId}/images` | Get tourism images | ADMIN |
| POST | `/api/admin/tourism/{tourismId}/images` | Add tourism image | ADMIN |
| PUT | `/api/admin/tourism/{tourismId}/images/{imageId}` | Update tourism image | ADMIN |
| DELETE | `/api/admin/tourism/{tourismId}/images/{imageId}` | Delete tourism image | ADMIN |
| PUT | `/api/admin/tourism/{tourismId}/images/{imageId}/set-main` | Set main image | ADMIN |
| PUT | `/api/admin/tourism/{tourismId}/images/reorder` | Reorder images | ADMIN |

---

###  Hotel Management Endpoints

#### UserHotelController (`/api/hotels`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/hotels/{id}/detail` | Get hotel detail info | Public |
| GET | `/api/hotels/{id}/booking` | Get hotel for booking page | Public |
| GET | `/api/hotels/owner/{ownerId}` | Get hotels by owner | HOTEL_OWNER, ADMIN |

#### AdminHotelController (`/api/admin/hotels`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/hotels` | Get all hotels | ADMIN |
| POST | `/api/admin/hotels` | Create new hotel | ADMIN |
| PUT | `/api/admin/hotels/{id}` | Update hotel | ADMIN |
| DELETE | `/api/admin/hotels/{id}` | Delete hotel | ADMIN |
| POST | `/api/admin/hotels/{hotelId}/images` | Add hotel images | ADMIN |
| DELETE | `/api/admin/hotels/{hotelId}/images/{imageId}` | Delete hotel image | ADMIN |

---

###  Booking Management Endpoints

#### BookingController (`/api/bookings`)

**Client Endpoints:**
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/bookings` | Create new booking | Authenticated |
| GET | `/api/bookings/my` | Get my bookings | Authenticated |
| GET | `/api/bookings/{id}` | Get booking by ID | Authenticated |
| POST | `/api/bookings/{id}/receipt` | Upload receipt URL | Authenticated |
| POST | `/api/bookings/{id}/receipt/upload` | Upload receipt file (multipart) | Authenticated |
| POST | `/api/bookings/{id}/problem` | Report problem to admin | Authenticated |
| POST | `/api/bookings/{id}/message` | Send message | Authenticated |

**Hotel Owner Endpoints:**
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/bookings/hotel/{hotelId}` | Get bookings for hotel | HOTEL_OWNER, ADMIN |
| GET | `/api/bookings/owner` | Get all owner's bookings | HOTEL_OWNER, ADMIN |
| POST | `/api/bookings/{id}/accept` | Accept booking request | HOTEL_OWNER, ADMIN |
| POST | `/api/bookings/{id}/cost` | Propose cost to client | HOTEL_OWNER, ADMIN |
| POST | `/api/bookings/{id}/approve` | Approve booking after payment | HOTEL_OWNER, ADMIN |
| POST | `/api/bookings/{id}/reject` | Reject booking with reason | HOTEL_OWNER, ADMIN |
| POST | `/api/bookings/{id}/owner-message` | Owner send message | HOTEL_OWNER, ADMIN |

**Admin Endpoints:**
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/bookings/admin/all` | Get all bookings (paginated) | ADMIN |
| GET | `/api/bookings/admin/problems` | Get problem bookings | ADMIN |
| POST | `/api/bookings/admin/{id}/resolve` | Admin resolve problem | ADMIN |

---

###  Road & Transportation Endpoints

#### RoadController (`/api`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tourisms/{tourismPlaceId}/roads` | Get roads by tourism place | Public |
| GET | `/api/roads/{id}` | Get road by ID | Public |
| POST | `/api/admin/roads` | Create new road | ADMIN |
| PUT | `/api/admin/roads/{id}` | Update road | ADMIN |
| DELETE | `/api/admin/roads/{id}` | Delete road | ADMIN |
| GET | `/api/admin/roads/{id}` | Get road by ID (admin) | ADMIN |
| GET | `/api/admin/roads/tourism/{tourismPlaceId}` | Get roads by tourism (admin) | ADMIN |

#### HorseServiceController
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/roads/{roadId}/horse-services` | Get horse services by road | Public |
| GET | `/api/horse-services/{id}` | Get horse service by ID | Public |
| POST | `/api/admin/horse-services` | Create horse service | ADMIN |
| PUT | `/api/admin/horse-services/{id}` | Update horse service | ADMIN |
| DELETE | `/api/admin/horse-services/{id}` | Delete horse service | ADMIN |

#### LanguageGuiderController (`/api/guiders`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/guiders/{id}` | Get guider by ID | Public |
| GET | `/api/guiders/tourism/{tourismPlaceId}` | Get active guiders by tourism | Public |

#### AdminLanguageGuiderController (`/api/admin/guiders`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/admin/guiders` | Create guider | ADMIN |
| PUT | `/api/admin/guiders/{id}` | Update guider | ADMIN |
| DELETE | `/api/admin/guiders/{id}` | Delete guider | ADMIN |

#### MapPointController (`/api/map-points`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/map-points/{id}` | Get map point by ID | Public |
| GET | `/api/map-points/tourism/{tourismPlaceId}` | Get map points by tourism place | Public |
| GET | `/api/map-points/type/{type}` | Get map points by type | Public |
| GET | `/api/map-points/road/{roadInfoId}` | Get map points by road | Public |
| GET | `/api/map-points/distance` | Calculate distance between coordinates | Public |

#### AdminMapPointController (`/api/admin/map-points`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/admin/map-points` | Create map point | ADMIN |
| PUT | `/api/admin/map-points/{id}` | Update map point | ADMIN |
| DELETE | `/api/admin/map-points/{id}` | Delete map point | ADMIN |

---

###  Rating Endpoints

#### RatingController (`/api/ratings`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/ratings/tourism` | Add tourism rating | Authenticated |
| GET | `/api/ratings/tourism/{tourismId}` | Get tourism ratings | Public |
| POST | `/api/ratings/hotel` | Add hotel rating | Authenticated |
| GET | `/api/ratings/hotel/{hotelId}` | Get hotel ratings | Public |

---

###  Security Management Endpoints

#### AdminSecurityController (`/api/admin/security`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/security/login-attempts` | Get recent login attempts | ADMIN |
| GET | `/api/admin/security/lockouts/{userId}` | Get user lockout history | ADMIN |
| GET | `/api/admin/security/lockout-status/{userId}` | Check user lockout status | ADMIN |
| POST | `/api/admin/security/unlock/{userId}` | Manually unlock user account | ADMIN |
| POST | `/api/admin/security/lock/{userId}` | Manually lock user account | ADMIN |
| GET | `/api/admin/security/check-block-status` | Check if identifier is blocked | ADMIN |
| POST | `/api/admin/security/cleanup` | Clean up old security records | ADMIN |
| POST | `/api/admin/security/send-alert/{userId}` | Send security alert to user | ADMIN |

---

###  Audit Log Endpoints

#### AdminAuditController (`/api/admin/audit`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/audit` | Get all audit logs (paginated) | ADMIN |
| GET | `/api/admin/audit/search` | Search audit logs (multi-criteria) | ADMIN |
| GET | `/api/admin/audit/user/{userId}` | Get audit logs by user ID | ADMIN |
| GET | `/api/admin/audit/username/{username}` | Get audit logs by username | ADMIN |
| GET | `/api/admin/audit/action/{action}` | Get audit logs by action | ADMIN |
| GET | `/api/admin/audit/resource/{resourceType}` | Get audit logs by resource type | ADMIN |
| GET | `/api/admin/audit/security` | Get recent security logs | ADMIN |
| GET | `/api/admin/audit/high-severity` | Get high severity logs | ADMIN |
| GET | `/api/admin/audit/statistics` | Get audit statistics | ADMIN |
| GET | `/api/admin/audit/suspicious-activity` | Find suspicious IP activity | ADMIN |
| GET | `/api/admin/audit/integrity/check` | Check audit log integrity | ADMIN |
| POST | `/api/admin/audit/integrity/repair` | Repair missing checksums | ADMIN |
| GET | `/api/admin/audit/export` | Export audit logs for archival | ADMIN |
| DELETE | `/api/admin/audit/cleanup` | Delete old audit logs | ADMIN |
| GET | `/api/admin/audit/activity/user/{userId}` | Get user activity count | ADMIN |
| GET | `/api/admin/audit/activity/ip/{ipAddress}` | Get IP activity count | ADMIN |

---

###  API Summary

| Category | Endpoints |
|----------|-----------|
| Authentication | 12 |
| User Management | 13 |
| Tourism Management | 13 |
| Hotel Management | 9 |
| Booking Management | 16 |
| Road & Transportation | 16 |
| Rating | 4 |
| Security | 8 |
| Audit | 16 |
| **Total** | **107** |

>  For interactive API documentation with request/response examples, visit `/swagger-ui.html` when the backend is running.

---

##  Installation

### Prerequisites

- **Java 17** or higher
- **Node.js 18** or higher
- **PostgreSQL 14** or higher
- **Maven 3.8** or higher
- **Git**

### Clone Repository

```bash
git clone https://github.com/abebe55/Group6_webservice_project.git
cd Group6_webservice_project
```

### Database Setup

```sql
-- Create database
CREATE DATABASE tourism;

-- Create user (optional)
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tourism TO postgres;
```

---

##  Configuration

### Backend Configuration

Edit `backend/src/main/resources/application.yml` with your database credentials, email settings, and JWT secret.

Key configuration sections:
- **Server**: Port 8443 with SSL enabled (PKCS12 keystore)
- **Database**: PostgreSQL connection to `tourism` database
- **Mail**: SMTP configuration for email verification and password reset
- **JWT**: Secret key and token expiration settings
- **Security**: Account lockout and audit logging settings

### Frontend Configuration

The frontend uses Next.js rewrites to proxy API requests to the backend. No `.env.local` file is needed.

---

##  Running the Application

### Backend

```bash
cd backend

# Using Maven Wrapper (Linux/Mac)
./mvnw spring-boot:run

# Using Maven Wrapper (Windows)
mvnw.cmd spring-boot:run

# Or using Maven directly
mvn spring-boot:run
```

The backend will start at `https://localhost:8443`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server with HTTPS
npm run dev

# For Windows with HTTPS (recommended)
npm run dev:win
```

The frontend will start at `https://localhost:3000`

### Verify Installation

1. Backend health check: `https://localhost:8443/api/tourisms/health`
2. Swagger UI: `https://localhost:8443/swagger-ui.html`
3. Frontend: `https://localhost:3000`

> **Note:** Since the application uses self-signed SSL certificates, your browser may show a security warning. Click "Advanced" and proceed to accept the certificate.

---

##  Project Structure

```
north-wollo-tourism/
│
├── backend/                          # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/northwollo/tourism/
│   │   │   │   ├── controller/       # REST Controllers (23 files)
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── AdminController.java
│   │   │   │   │   ├── BookingController.java
│   │   │   │   │   ├── AdminTourismController.java
│   │   │   │   │   ├── AdminHotelController.java
│   │   │   │   │   └── ...
│   │   │   │   ├── service/          # Business Logic
│   │   │   │   ├── repository/       # Data Access Layer
│   │   │   │   ├── entity/           # JPA Entities (22 files)
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── TourismPlace.java
│   │   │   │   │   ├── Hotel.java
│   │   │   │   │   ├── HotelBooking.java
│   │   │   │   │   └── ...
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   │   ├── request/      # Request DTOs
│   │   │   │   │   └── response/     # Response DTOs
│   │   │   │   ├── security/         # Security Configuration
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   └── JwtAuthenticationFilter.java
│   │   │   │   ├── exception/        # Exception Handling
│   │   │   │   ├── config/           # Application Configuration
│   │   │   │   └── enums/            # Enumerations
│   │   │   └── resources/
│   │   │       └── application.yml   # Application Configuration
│   │   └── test/                     # Unit Tests
│   ├── uploads/receipts/             # Receipt Image Storage
│   ├── pom.xml                       # Maven Dependencies
│   └── mvnw                          # Maven Wrapper
│
├── frontend/                         # Next.js Application
│   ├── src/
│   │   ├── app/                      # Pages (App Router)
│   │   │   ├── auth/                 # Authentication Pages
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── verify-email/
│   │   │   │   └── reset-password/
│   │   │   ├── admin/                # Admin Dashboard
│   │   │   │   ├── users/
│   │   │   │   ├── tourisms/
│   │   │   │   ├── hotels/
│   │   │   │   ├── bookings/
│   │   │   │   ├── roads/
│   │   │   │   ├── guiders/
│   │   │   │   ├── horseservices/
│   │   │   │   ├── mappoints/
│   │   │   │   └── audit/
│   │   │   ├── tourisms/             # Tourism Pages
│   │   │   ├── hotels/               # Hotel Pages
│   │   │   ├── bookings/             # Client Bookings
│   │   │   ├── owner/                # Hotel Owner Pages
│   │   │   ├── hotel-owner/          # Owner Dashboard
│   │   │   ├── roads/                # Road Information
│   │   │   └── page.tsx              # Home Page
│   │   ├── components/               # Reusable Components
│   │   ├── services/                 # API Service Functions
│   │   ├── store/                    # Zustand State Management
│   │   └── utils/                    # Utility Functions
│   ├── public/                       # Static Assets
│   ├── package.json                  # NPM Dependencies
│   ├── next.config.ts                # Next.js Configuration
│   ├── tailwind.config.ts            # Tailwind Configuration
│   └── tsconfig.json                 # TypeScript Configuration
│
├── README.md                         # Project Documentation
└── PRESENTATION_PPT.md               # Presentation Guide
```

---

##  Security

### Authentication Flow

```
1. User registers → Email verification OTP sent
2. User verifies email → Account activated
3. User logs in → JWT access token + refresh token issued
4. Access token expires → Use refresh token to get new access token
5. Refresh token expires → User must log in again
```

### Security Features

| Feature | Description |
|---------|-------------|
| **Password Hashing** | BCrypt with cost factor 10 |
| **JWT Tokens** | Access (15 min) + Refresh (7 days) |
| **Account Lockout** | After 5 failed login attempts |
| **Email Verification** | 6-digit OTP, 15 min expiry |
| **Password Reset** | 6-digit OTP, 15 min expiry |
| **Audit Logging** | All actions logged with IP, user agent |
| **RBAC** | Role-based access control |

### User Roles

| Role | Permissions |
|------|-------------|
| `USER` | View tourism/hotels, create bookings, rate places |
| `HOTEL_OWNER` | All USER permissions + manage own hotel bookings |
| `ADMIN` | Full system access, user management, all CRUD operations |

---

## 👥 Team Members

| Name | ID | GitHub |
|------|------|--------|
| [Abebe Marye] | [1306166] |  [@abebe55](https://github.com/@abebe55) |
| [Alemeu Mola] | [] | [](https://github.com/username2) |
| [Debala ] | [] | [@dabala390-cmd](https://github.com/@dabala390-cmd) |
| [Ashenafi ] | [] | [@ashe0123](https://github.com/@ashe0123) |
| [Mohammed ] | [] | [@wassie49](https://github.com/@wassie49) |

---

##  License

This project is developed for educational purposes as part of the Web Service course at Woldia University.

---

##  Acknowledgments

- Woldia University, Institute of Technology
- Software Engineering Department
- Web Service Course Instructors

---

<p align="center">
  <b>North Wollo Tourism Management system Web service Project</b><br>
  Woldia University  Software Engineering  2025 E.C
</p>
