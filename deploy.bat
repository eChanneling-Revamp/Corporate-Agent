@echo off
echo 🚀 eChanneling Corporate Agent Frontend - Production Deployment Script
echo =================================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available. Please install npm first.
    exit /b 1
)

echo ✅ npm version:
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)

echo ✅ Prisma client generated

REM Run database migrations
echo 📊 Running database migrations...
npx prisma migrate deploy

if %errorlevel% neq 0 (
    echo ⚠️  Database migration failed - make sure PostgreSQL is running and DATABASE_URL is set
    echo    Continuing with deployment...
)

REM Seed database with sample data
echo 🌱 Seeding database with sample data...
npx prisma db seed

if %errorlevel% neq 0 (
    echo ⚠️  Database seeding failed - continuing with deployment...
)

REM Build the application
echo 🔨 Building application for production...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Application built successfully

echo.
echo 🎉 DEPLOYMENT COMPLETE!
echo ======================
echo.
echo 🚀 To start the production server:
echo    npm start
echo.
echo 🔐 Test credentials:
echo    Username: demo_agent
echo    Password: ABcd123#
echo.
echo 🌐 Access the application at:
echo    http://localhost:3000
echo.
echo 📚 For more information, see PRODUCTION-READY.md
pause