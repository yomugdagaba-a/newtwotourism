@echo off
setlocal enabledelayedexpansion

REM Colors (Windows 10+)
set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo.
echo %BLUE%╔════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║   North Wollo Tourism - NestJS Backend Setup Script       ║%NC%
echo %BLUE%╚════════════════════════════════════════════════════════════╝%NC%
echo.

REM Check Node.js
echo %YELLOW%Checking Node.js installation...%NC%
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%✗ Node.js is not installed%NC%
    echo Please install Node.js 20 LTS from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %GREEN%✓ Node.js %NODE_VERSION% found%NC%
echo.

REM Check npm
echo %YELLOW%Checking npm installation...%NC%
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%✗ npm is not installed%NC%
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo %GREEN%✓ npm %NPM_VERSION% found%NC%
echo.

REM Install dependencies
echo %YELLOW%Installing dependencies...%NC%
call npm install
if errorlevel 1 (
    echo %RED%✗ Failed to install dependencies%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Dependencies installed%NC%
echo.

REM Check if .env exists
echo %YELLOW%Checking environment configuration...%NC%
if not exist .env (
    echo %YELLOW%Creating .env file from .env.example...%NC%
    copy .env.example .env >nul
    echo %GREEN%✓ .env file created%NC%
    echo %YELLOW%⚠ Please update .env with your database credentials%NC%
) else (
    echo %GREEN%✓ .env file already exists%NC%
)
echo.

REM Generate Prisma client
echo %YELLOW%Generating Prisma client...%NC%
call npm run prisma:generate
if errorlevel 1 (
    echo %RED%✗ Failed to generate Prisma client%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Prisma client generated%NC%
echo.

REM Run migrations
echo %YELLOW%Running database migrations...%NC%
call npm run prisma:migrate
if errorlevel 1 (
    echo %RED%✗ Failed to run migrations%NC%
    echo %YELLOW%Make sure PostgreSQL is running and DATABASE_URL is correct in .env%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Database migrations completed%NC%
echo.

REM Seed database
echo %YELLOW%Seeding database with initial data...%NC%
call npm run prisma:seed
if errorlevel 1 (
    echo %RED%✗ Failed to seed database%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Database seeded%NC%
echo.

REM Success message
echo %GREEN%╔════════════════════════════════════════════════════════════╗%NC%
echo %GREEN%║              Setup Completed Successfully! 🎉              ║%NC%
echo %GREEN%╚════════════════════════════════════════════════════════════╝%NC%
echo.

echo %BLUE%Next steps:%NC%
echo.
echo   1. Start the development server:
echo      %YELLOW%npm run start:dev%NC%
echo.
echo   2. Open Swagger UI in your browser:
echo      %YELLOW%http://localhost:3001/api/docs%NC%
echo.
echo   3. Login with default credentials:
echo      Username: %YELLOW%admin%NC%
echo      Password: %YELLOW%admin123456%NC%
echo.
echo   4. Update frontend API URL:
echo      %YELLOW%NEXT_PUBLIC_API_URL=http://localhost:3001%NC%
echo.
echo %BLUE%Useful commands:%NC%
echo.
echo   %YELLOW%npm run start:dev%NC%        - Start development server
echo   %YELLOW%npm run build%NC%            - Build for production
echo   %YELLOW%npm run start:prod%NC%       - Start production server
echo   %YELLOW%npm run prisma:studio%NC%    - Open Prisma Studio
echo   %YELLOW%npm run lint%NC%             - Run ESLint
echo   %YELLOW%npm run format%NC%           - Format code with Prettier
echo   %YELLOW%npm run test%NC%             - Run tests
echo.
echo %BLUE%Documentation:%NC%
echo.
echo   - README.md: Backend documentation
echo   - QUICK_START.md: Quick start guide
echo   - MIGRATION_GUIDE.md: Detailed migration guide
echo.

pause
