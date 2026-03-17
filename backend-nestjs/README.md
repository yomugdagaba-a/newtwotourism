# North Wollo Tourism Backend - NestJS

This is the NestJS backend for the North Wollo Tourism Management System, migrated from Spring Boot to Node.js/TypeScript stack.

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Passport
- **Password Hashing**: bcryptjs
- **Validation**: class-validator & class-transformer
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 20 LTS or higher
- PostgreSQL 12 or higher
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials and configuration

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database with initial data:
```bash
npm run prisma:seed
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## Database Management

### Create a new migration
```bash
npm run prisma:migrate
```

### View database in Prisma Studio
```bash
npm run prisma:studio
```

### Reset database (development only)
```bash
npx prisma migrate reset
```

## API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3001/api/docs
- **OpenAPI JSON**: http://localhost:3001/api/docs-json

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── prisma/                # Prisma service & module
├── modules/
│   ├── auth/              # Authentication module
│   ├── users/             # Users module
│   ├── tourism/           # Tourism places module
│   ├── hotels/            # Hotels module
│   ├── bookings/          # Hotel bookings module
│   ├── ratings/           # Ratings module
│   ├── map-points/        # Map points module
│   ├── roads/             # Roads module
│   ├── horse-services/    # Horse services module
│   ├── language-guiders/  # Language guiders module
│   ├── audit/             # Audit logging module
│   └── admin/             # Admin module
prisma/
├── schema.prisma          # Database schema
└── seed.ts               # Database seeding script
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (paginated)

### Tourism Places
- `GET /api/tourism` - Get all tourism places
- `GET /api/tourism/:id` - Get tourism place by ID
- `POST /api/tourism` - Create tourism place
- `PUT /api/tourism/:id` - Update tourism place
- `DELETE /api/tourism/:id` - Delete tourism place
- `GET /api/tourism/search` - Search tourism places
- `POST /api/tourism/:id/images` - Add image
- `DELETE /api/tourism/images/:imageId` - Remove image

### Hotels
- `GET /api/hotels` - Get all hotels
- `GET /api/hotels/:id` - Get hotel by ID
- `POST /api/hotels` - Create hotel
- `PUT /api/hotels/:id` - Update hotel
- `DELETE /api/hotels/:id` - Delete hotel
- `GET /api/hotels/search` - Search hotels
- `GET /api/hotels/owner/my-hotels` - Get my hotels
- `POST /api/hotels/:id/images` - Add image
- `DELETE /api/hotels/images/:imageId` - Remove image

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `PUT /api/bookings/:id/status` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking
- `GET /api/bookings/user/my-bookings` - Get my bookings
- `GET /api/bookings/hotel/:hotelId` - Get hotel bookings
- `POST /api/bookings/:id/messages` - Add message

### Ratings
- `POST /api/ratings/tourism/:tourismPlaceId` - Rate tourism place
- `POST /api/ratings/hotel/:hotelId` - Rate hotel
- `GET /api/ratings/tourism/:tourismPlaceId` - Get tourism ratings
- `GET /api/ratings/hotel/:hotelId` - Get hotel ratings
- `GET /api/ratings/tourism/:tourismPlaceId/summary` - Get tourism rating summary
- `GET /api/ratings/hotel/:hotelId/summary` - Get hotel rating summary

### Map Points
- `GET /api/map-points` - Get all map points
- `GET /api/map-points/:id` - Get map point by ID
- `POST /api/map-points` - Create map point
- `PUT /api/map-points/:id` - Update map point
- `DELETE /api/map-points/:id` - Delete map point

### Roads
- `GET /api/roads` - Get all roads
- `GET /api/roads/:id` - Get road by ID
- `POST /api/roads` - Create road
- `PUT /api/roads/:id` - Update road
- `DELETE /api/roads/:id` - Delete road

### Horse Services
- `GET /api/horse-services` - Get all horse services
- `GET /api/horse-services/:id` - Get horse service by ID
- `POST /api/horse-services` - Create horse service
- `PUT /api/horse-services/:id` - Update horse service
- `DELETE /api/horse-services/:id` - Delete horse service

### Language Guiders
- `GET /api/language-guiders` - Get all language guiders
- `GET /api/language-guiders/:id` - Get language guider by ID
- `POST /api/language-guiders` - Create language guider
- `PUT /api/language-guiders/:id` - Update language guider
- `DELETE /api/language-guiders/:id` - Delete language guider

### Audit
- `GET /api/audit` - Get audit logs
- `GET /api/audit/statistics` - Get audit statistics

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/bookings/recent` - Get recent bookings
- `GET /api/admin/bookings/by-status` - Get bookings by status

## Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRATION` - Access token expiration time
- `JWT_REFRESH_EXPIRATION` - Refresh token expiration time
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

## Migration from Spring Boot

### Key Changes

1. **Database**: PostgreSQL remains the same, but now using Prisma ORM instead of JPA/Hibernate
2. **Authentication**: JWT with Passport.js instead of Spring Security
3. **Validation**: class-validator instead of Jakarta Bean Validation
4. **API Documentation**: Swagger/OpenAPI (same concept, different implementation)
5. **Email**: Nodemailer instead of Spring Mail
6. **File Upload**: Express multer instead of Spring's MultipartFile

### Data Migration

To migrate existing data from the Spring Boot backend:

1. Export data from PostgreSQL using the existing schema
2. Ensure the Prisma schema matches your data structure
3. Run migrations to create new tables if needed
4. Import data using Prisma's import tools or custom scripts

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists and user has permissions

### JWT Token Issues
- Verify JWT_SECRET is set correctly
- Check token expiration times
- Ensure Authorization header format: `Bearer <token>`

### CORS Issues
- Verify FRONTEND_URL in .env matches your frontend URL
- Check CORS configuration in main.ts

## Support

For issues or questions, please refer to:
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Documentation](https://jwt.io)
