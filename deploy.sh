#!/bin/bash

echo "🚀 eChanneling Corporate Agent Frontend - Production Deployment Script"
echo "================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "⚠️  Database migration failed - make sure PostgreSQL is running and DATABASE_URL is set"
    echo "   Continuing with deployment..."
fi

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
npx prisma db seed

if [ $? -ne 0 ]; then
    echo "⚠️  Database seeding failed - continuing with deployment..."
fi

# Build the application
echo "🔨 Building application for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Application built successfully"

# Check environment variables
echo "🔍 Checking environment variables..."

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL environment variable not set"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  NEXTAUTH_SECRET environment variable not set"
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "⚠️  NEXTAUTH_URL environment variable not set"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "🚀 To start the production server:"
echo "   npm start"
echo ""
echo "🔐 Test credentials:"
echo "   Username: demo_agent"
echo "   Password: ABcd123#"
echo ""
echo "🌐 Access the application at:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more information, see PRODUCTION-READY.md"