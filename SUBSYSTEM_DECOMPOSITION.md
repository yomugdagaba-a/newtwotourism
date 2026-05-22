# SUBSYSTEM DECOMPOSITION — North Wollo Tourism System

## System Overview
This document describes the subsystem decomposition of the proposed North Wollo Tourism System, outlining the major subsystems and their constituent sub-modules.

---

## SUBSYSTEM SUMMARY

| # | Subsystem | Description | Sub-modules |
|---|-----------|-------------|-------------|
| 1 | Authentication & Authorization | User authentication, authorization, and account management | 6 |
| 2 | Tourism Management | Tourism place management and related services | 6 |
| 3 | Hotel Management | Hotel registration and management | 4 |
| 4 | Booking Management | Hotel booking workflow and payment | 6 |
| 5 | Rating | Rating system for tourism places and hotels | 3 |
| 6 | Road & Service | Road information and related services | 4 |
| 7 | Audit & Security | System monitoring, logging, and security | 5 |
| 8 | Admin | System administration and management | 3 |

**Total:** 8 Subsystems, 37 Sub-modules

---

## 1. AUTHENTICATION & AUTHORIZATION SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| User Registration | Account creation and email verification |
| Login & Session Management | User authentication and session handling |
| Password Management | Password reset and change functionality |
| Account Security | Login tracking, lockout, and security alerts |
| Role & Permission | Role-based access control (ADMIN, OWNER, CLIENT) |
| User Profile | User profile management |

---

## 2. TOURISM MANAGEMENT SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| Tourism Place Management | CRUD operations for tourism places with category filtering |
| Tourism Image | Main and gallery image management |
| Hero Image | Homepage carousel image management |
| Category & Location | Category filtering and GPS-based location services |
| View Tracking | Visitor tracking and view counting |
| Language Guider | Language guide registration and assignment |

**Categories:** HERITAGE, HIGHLAND, CAVERN, AQUATICS, CULTURE, MODERN

---

## 3. HOTEL MANAGEMENT SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| Hotel Registration | Hotel CRUD operations and search |
| Hotel Owner | Owner assignment and management |
| Hotel Image | Main and gallery image management |
| Hotel Status | Activate/deactivate hotel functionality |

---

## 4. BOOKING MANAGEMENT SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| Booking Creation | Create and manage booking requests |
| Booking Workflow | Multi-stage booking approval process |
| Payment Management | Payment receipt upload and verification |
| Booking Query | Search and filter bookings |
| Problem Management | Report and resolve booking issues |
| Booking Communication | Messaging between client and owner |

**Booking Workflow:** REQUESTED → OWNER_ACCEPTED → COST_PROPOSED → PAID → APPROVED

---

## 5. RATING SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| Tourism Rating | Submit and view tourism place ratings (1-5 stars) |
| Hotel Rating | Submit and view hotel ratings (1-5 stars) |
| Rating Validation | Prevent duplicate ratings and validate submissions |

---

## 6. ROAD & SERVICE SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| Road Information | Road details and management |
| Distance Management | Distance tracking by car, foot, horse, and plane |
| Horse Service | Horse service registration and pricing |
| Map Point | GPS coordinates and distance calculation |

**Road Types:** CAR, FOOT, HORSE, PLANE

---

## 7. AUDIT & SECURITY SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| Audit Logging | Log all system actions and events |
| Audit Query & Statistics | Search logs and generate reports |
| Security Monitoring | Detect suspicious activity and security threats |
| Rate Limiting | Prevent abuse through request limiting |
| Dashboard & Statistics | System-wide statistics and monitoring |

**Logged Events:** CREATE, UPDATE, DELETE, LOGIN, LOGOUT, REGISTER, PASSWORD_RESET, EMAIL_VERIFICATION, ACCOUNT_LOCKED, AUTHORIZATION_CHECK

---

## 8. ADMIN SUBSYSTEM

| Sub-module | Purpose |
|------------|---------|
| User Management | Manage all users and roles |
| Content Management | Manage all system content (tourism, hotels, bookings, etc.) |
| System Configuration | Configure system settings and test functionality |

---

## SUBSYSTEM RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN SUBSYSTEM                          │
│              (Manages all subsystems)                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│ AUTHENTICATION │  │   TOURISM   │  │     HOTEL       │
│       &        │  │ MANAGEMENT  │  │  MANAGEMENT     │
│ AUTHORIZATION  │  └──────┬──────┘  └────────┬────────┘
└───────┬────────┘         │                  │
        │         ┌────────┴────────┐         │
        │         │                 │         │
        │    ┌────▼─────┐    ┌─────▼────┐    │
        │    │  RATING  │    │   ROAD   │    │
        │    │          │    │    &     │    │
        │    │          │    │ SERVICE  │    │
        │    └──────────┘    └──────────┘    │
        │                                     │
        └──────────────┬──────────────────────┘
                       │
              ┌────────▼────────┐
              │    BOOKING      │
              │   MANAGEMENT    │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   AUDIT &       │
              │   SECURITY      │
              │ (Monitors all)  │
              └─────────────────┘
```

---

## KEY SYSTEM FEATURES

### User Roles
- **ADMIN** - Full system access and management
- **OWNER** - Hotel and booking management
- **CLIENT** - Browse, book, and rate

### Booking Status Flow
```
REQUESTED → OWNER_ACCEPTED → COST_PROPOSED → PAID → APPROVED
         ↘ REJECTED        ↘ REJECTED      ↘ REJECTED
```

### Tourism Categories
- **HERITAGE** - Historical and cultural sites
- **HIGHLAND** - Mountain attractions
- **CAVERN** - Cave attractions
- **AQUATICS** - Water-based attractions
- **CULTURE** - Cultural events
- **MODERN** - Modern facilities

### Security Features
- Email verification with OTP
- JWT-based authentication
- Account lockout after failed attempts
- Rate limiting on sensitive operations
- Comprehensive audit logging
- IP tracking and blocking

---

*Document Version: 4.0*  
*Last Updated: 2026-05-21*  
*Document Type: Proposed System Design*  
*Total Subsystems: 8*  
*Total Sub-modules: 37*
