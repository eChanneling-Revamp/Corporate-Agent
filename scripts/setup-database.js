#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Database Setup Script\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env.local file not found!');
  console.log('📝 Creating .env.local with SQLite configuration...\n');
  
  // Create .env.local with SQLite database
  const envContent = `# Database Configuration (using SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here-${Date.now()}"

# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created with SQLite configuration');
}

// Copy SQLite schema for development
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const sqliteSchemaPath = path.join(process.cwd(), 'prisma', 'schema.sqlite.prisma');

if (fs.existsSync(sqliteSchemaPath)) {
  console.log('\n📝 Using SQLite schema for development...');
  
  // Backup original schema if not already backed up
  const backupPath = path.join(process.cwd(), 'prisma', 'schema.postgresql.prisma');
  if (!fs.existsSync(backupPath) && fs.existsSync(schemaPath)) {
    fs.copyFileSync(schemaPath, backupPath);
    console.log('✅ Backed up PostgreSQL schema');
  }
  
  // Copy SQLite schema to main schema file
  fs.copyFileSync(sqliteSchemaPath, schemaPath);
  console.log('✅ SQLite schema activated');
}

// Set environment variable for this process
process.env.DATABASE_URL = "file:./dev.db";

console.log('\n🚀 Running database setup commands...\n');

try {
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: { ...process.env } });
  
  // Create database and run migrations
  console.log('\n🗄️  Creating database and running migrations...');
  execSync('npx prisma db push', { stdio: 'inherit', env: { ...process.env } });
  
  // Seed the database (optional, as seed file might not be compatible with SQLite)
  console.log('\n🌱 Attempting to seed database with sample data...');
  try {
    execSync('npx prisma db seed', { stdio: 'inherit', env: { ...process.env } });
  } catch (seedError) {
    console.log('⚠️  Seeding failed (this is okay for initial setup)');
  }
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n📌 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. The application should now work with a local SQLite database');
  console.log('3. All CRUD operations should be functional\n');
  
} catch (error) {
  console.error('\n❌ Error during database setup:', error.message);
  console.log('\n📌 Manual setup instructions:');
  console.log('1. Make sure you have a DATABASE_URL in your .env.local file');
  console.log('2. Run: npx prisma generate');
  console.log('3. Run: npx prisma db push');
  console.log('4. Run: npx prisma db seed (optional)');
  process.exit(1);
}
