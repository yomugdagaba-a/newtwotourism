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
echo %BLUE%║   North Wollo Tourism - Complete Setup (HTTPS + PostgreSQL)║%NC%
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

REM Check PostgreSQL
echo %YELLOW%Checking PostgreSQL installation...%NC%
psql --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%⚠ PostgreSQL not found in PATH%NC%
    echo Make sure PostgreSQL is installed and running
    echo You can still continue with the setup
) else (
    for /f "tokens=*" %%i in ('psql --version') do set PG_VERSION=%%i
    echo %GREEN%✓ !PG_VERSION! found%NC%
)
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

echo %BLUE%Configuration Summary:%NC%
echo.
echo   Backend Port:     %YELLOW%8080 (HTTPS)%NC%
echo   Frontend Port:    %YELLOW%3000 (HTTPS)%NC%
echo   Database:        %YELLOW%PostgreSQL on localhost:5432%NC%
echo   Node.js:         %YELLOW%%NODE_VERSION%%NC%
echo.

echo %BLUE%Next steps:%NC%
echo.
echo   Option 1: Run in IntelliJ IDEA (Recommended)
echo     1. Open IntelliJ IDEA
echo     2. File → Open → Select backend-nestjs folder
echo     3. Configure Node.js interpreter
echo     4. Run → Edit Configurations → Add npm script 'start:dev'
echo     5. Click Run button
echo.
echo   Option 2: Run in Terminal
echo     %YELLOW%npm run start:dev%NC%
echo.
echo   Then in another terminal:
echo     %YELLOW%cd ../frontend%NC%
echo     %YELLOW%npm install%NC%
echo     %YELLOW%npm run dev:win%NC%
echo.

echo %BLUE%Access URLs:%NC%
echo.
echo   Frontend:        %YELLOW%https://localhost:3000%NC%
echo   API Docs:        %YELLOW%https://localhost:8080/api/docs%NC%
echo   Prisma Studio:   %YELLOW%http://localhost:5555%NC%
echo.

echo %BLUE%Default Credentials:%NC%
echo.
echo   Admin:
echo     Username: %YELLOW%admin%NC%
echo     Password: %YELLOW%admin123456%NC%
echo.
echo   Client:
echo     Username: %YELLOW%client%NC%
echo     Password: %YELLOW%client123456%NC%
echo.
echo   Hotel Owner:
echo     Username: %YELLOW%hotelowner%NC%
echo     Password: %YELLOW%owner123456%NC%
echo.

echo %BLUE%Useful Commands:%NC%
echo.
echo   %YELLOW%npm run start:dev%NC%        - Start development server
echo   %YELLOW%npm run start:debug%NC%      - Start with debugging
echo   %YELLOW%npm run build%NC%            - Build for production
echo   %YELLOW%npm run start:prod%NC%       - Start production server
echo   %YELLOW%npm run prisma:studio%NC%    - Open Prisma Studio
echo   %YELLOW%npm run lint%NC%             - Run ESLint
echo   %YELLOW%npm run format%NC%           - Format code with Prettier
echo   %YELLOW%npm run test%NC%             - Run tests
echo.

echo %BLUE%Documentation:%NC%
echo.
echo   - SETUP_HTTPS_POSTGRESQL.md: Complete setup guide
echo   - INTELLIJ_SETUP.md: IntelliJ IDEA setup guide
echo   - HOW_TO_RUN.md: How to run the project
echo   - QUICK_REFERENCE.md: Quick command reference
echo.

pause

