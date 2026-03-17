# North Wollo Tourism - Node.js Backend

Pure Node.js (Express) backend for the North Wollo Tourism Management System.

## Tech Stack
- Runtime: Node.js
- Framework: Express
- ORM: Prisma
- Database: PostgreSQL
- Auth: JWT (jsonwebtoken)
- Email: Nodemailer

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your database and email credentials

npx prisma generate
npx prisma migrate deploy

npm start
# or for development:
npm run dev
```

## Running
Server starts on `http://localhost:8080` by default.

API base: `http://localhost:8080/api`
