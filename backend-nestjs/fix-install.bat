@echo off
echo Removing node_modules...
rmdir /s /q node_modules 2>nul

echo Clearing npm cache...
npm cache clean --force

echo Installing dependencies...
npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Installation successful!
    echo.
    echo Next steps:
    echo npm run prisma:generate
    echo npm run prisma:migrate
    echo npm run prisma:seed
    echo npm run start:dev
) else (
    echo.
    echo ❌ Installation failed!
    exit /b 1
)

pause
