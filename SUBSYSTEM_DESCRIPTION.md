# 4.4.2 Subsystem Decomposition — Detailed Description

## Overview

The North Wollo Tourism System is decomposed into **six major subsystems**, each further broken down into **sub-modules** based on the actual implemented functionality. This decomposition follows a layered architecture where each subsystem handles a specific domain of the application.

---

## 1. Authentication Subsystem

The Authentication Subsystem manages all user identity and security operations. It is decomposed into the following sub-modules:

**1.1 User Registration Sub-module**
Handles new user account creation. Users provide a username, email, full name, and password. The password is hashed using bcrypt before storage. Upon registration, the account is created in an unverified state pending email confirmation.

**1.2 Email Verification Sub-module**
After registration, a 6-digit OTP (One-Time Password) is generated and sent to the user's email via Gmail SMTP. The user must submit the OTP within 5 minutes to activate their account. Failed attempts are tracked and the OTP is invalidated after 3 wrong attempts.

**1.3 Login / JWT Sub-module**
Authenticated users receive a short-lived JWT access token (15 minutes) and a long-lived refresh token (7 hours). The access token is used for all API requests. The refresh token is stored in the database and used to generate new access tokens without requiring re-login.

**1.4 Password Reset Sub-module**
Users who forget their password can request a reset via email. A 6-digit OTP is sent to the registered email. Upon successful OTP verification, the user sets a new password which is hashed and stored.

**1.5 Account Lockout Sub-module**
After 5 consecutive failed login attempts from the same IP address, the account is temporarily locked for 15 minutes. A security alert email is sent to the user. Administrators can manually unlock accounts from the Admin Subsystem.

---

## 2. Tourism Management Subsystem

The Tourism Management Subsystem handles all operations related to tourism places in the North Wollo region. It is decomposed into the following sub-modules:

**2.1 Tourism Place CRUD Sub-module**
Administrators can create, read, update, and delete tourism places. Each place has a name, description, location (wereda, kebele), GPS coordinates, best visiting time, and supported languages.

**2.2 Category Management Sub-module**
Tourism places are classified into six categories: Heritage, Highland, Cavern, Aquatics, Culture, and Modern. A place can belong to multiple categories simultaneously.

**2.3 Image Management Sub-module**
Each tourism place can have multiple images stored in Supabase Storage. Images have a display order and one image is designated as the main image. Administrators upload, reorder, and delete images through this sub-module.

**2.4 Map and Location Sub-module**
GPS coordinates (latitude and longitude) are stored for each tourism place. Map points are created to mark locations on an interactive map. The system supports Leaflet-based map visualization in the frontend.

**2.5 View Tracking Sub-module**
Each visit to a tourism place page is tracked using a session ID and IP address. This prevents duplicate counting from the same browser session. The viewer count is displayed on the tourism place page.

---

## 3. Hotel Management Subsystem

The Hotel Management Subsystem is the most complex subsystem, managing the complete lifecycle of hotel operations and bookings. It is decomposed into five sub-modules:

**3.1 Hotel Registration Sub-module**
Administrators register hotels and link them to tourism places. Each hotel has a name, star rating (1-5), contact information, description, GPS coordinates, and active status. Hotels can be activated or deactivated without deletion.

**3.2 Image Management Sub-module**
Hotels have a dedicated image gallery stored in Supabase Storage. A main image is displayed in listings while additional gallery images are shown in the hotel detail page. Images have display order management.

**3.3 Booking Management Sub-module**
Clients can request bookings for hotels by specifying check-in/check-out dates, number of guests, and special requests. The booking follows a defined lifecycle: REQUESTED → OWNER_ACCEPTED → COST_PROPOSED → PAID → APPROVED (or REJECTED at any stage). Both clients and owners can hide bookings from their view without deleting them.

**3.4 Payment Management Sub-module**
After accepting a booking, the hotel owner proposes a cost. The client uploads a payment receipt image (stored in Supabase Storage). The owner reviews the receipt and either approves or rejects the payment. The booking status is updated at each step.

**3.5 Communication (Messaging) Sub-module**
Clients and hotel owners can exchange messages within a booking conversation. Messages are delivered in real-time using WebSocket connections. Server-Sent Events (SSE) serve as a fallback for browsers that block WebSocket. The message history is stored in the database and visible to both parties.

---

## 4. Rating Subsystem

The Rating Subsystem manages user reviews and ratings for both tourism places and hotels.

**4.1 Tourism Rating Sub-module**
Authenticated users can rate tourism places on a scale of 1 to 5 stars with an optional comment. Each user can submit only one rating per tourism place. Existing ratings can be updated.

**4.2 Hotel Rating Sub-module**
Authenticated users can rate hotels on a scale of 1 to 5 stars with an optional comment. The same one-rating-per-user-per-hotel constraint applies.

**4.3 Average Calculation Sub-module**
The system calculates the average rating and total number of ratings for each tourism place and hotel. These statistics are returned with every tourism place and hotel query and displayed in the frontend.

---

## 5. Road and Service Subsystem

The Road and Service Subsystem manages transportation routes and associated services for reaching tourism places.

**5.1 Road Information Sub-module**
Road information is linked to tourism places. Each road entry includes the road name, type (Car, Foot, Horse, Plane), condition description, and distances for each transportation type. Roads can be activated or deactivated.

**5.2 Horse Service Sub-module**
Horse services are linked to specific roads. Each service has an owner name, contact information, price per hour, maximum capacity, and availability status. This supports the traditional horse-riding tourism experience in the region.

**5.3 Language Guider Sub-module**
Language guiders are linked to specific tourism places via a `tourism_place_id` foreign key. Each guider has a name, list of spoken languages, experience description, and contact information. This directly addresses the adviser's comment about connecting guiders to the location flow.

**5.4 Map Points Sub-module**
Map points mark specific locations on the interactive map. Each point has GPS coordinates, a type (Tourism Place, Hotel, or Road), and a description. Map points are linked to tourism places and displayed on the Leaflet map in the frontend.

---

## 6. Admin Subsystem

The Admin Subsystem provides administrative control over all system entities and security operations.

**6.1 User Management Sub-module**
Administrators can view all users, search by name or email, activate or deactivate accounts, assign or revoke roles (CLIENT, HOTEL_OWNER, ADMIN), reset passwords, and delete accounts.

**6.2 Content Management Sub-module**
Administrators manage all tourism places, hotels, roads, horse services, language guiders, and hero images displayed on the homepage. This includes full CRUD operations and image uploads.

**6.3 Audit Log Viewer Sub-module**
All system actions (login, logout, create, update, delete, password reset, etc.) are recorded in the audit log. Administrators can search logs by user, action type, date range, IP address, and resource type. Logs are retained for 90 days by default.

**6.4 Security Management Sub-module**
Administrators can view login attempt history, check account lockout status, manually lock or unlock user accounts, and send security alert emails. The system automatically detects suspicious activity (5+ failed attempts in 5 minutes) and notifies the user.

**6.5 Dashboard and Stats Sub-module**
The admin dashboard displays system statistics including total users, total tourism places, total hotels, total bookings by status, and recent activity. This gives administrators a quick overview of system health and usage.

---

## Summary: Adviser Comment Response

| Adviser Comment | Implementation |
|----------------|----------------|
| "Properly decompose hotel management into sub-modules" | ✅ Hotel Management has 5 sub-modules: Registration, Image Management, Booking Management, Payment Management, Communication |
| "Sub-module: bed management" | ✅ Implemented as **Booking Management** — handles room booking requests, check-in/check-out, number of guests, number of rooms |
| "Sub-module: payment management" | ✅ Implemented as **Payment Management** — cost proposal, receipt upload, payment approval |
| "Sub-module: booking management" | ✅ Implemented as **Booking Management** — full booking lifecycle with 6 status states |
| "Draw decomposition diagram using UML" | ✅ Package/rectangle decomposition diagrams provided (Diagram 1 and Diagram 2) |
