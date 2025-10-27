#!/usr/bin/env node

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Cross-Platform Setup Script\n');
console.log(`📍 Platform: ${os.platform()}`);
console.log(`📍 Architecture: ${os.arch()}\n`);

// Function to run command with proper error handling
function runCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`❌ Error running: ${command}`);
    return false;
  }
}

// Function to check if command exists
function commandExists(command) {
  try {
    execSync(`${os.platform() === 'win32' ? 'where' : 'which'} ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Step 1: Fix SWC Binary Issues (especially for Windows)
console.log('🔧 Step 1: Fixing SWC Binary Issues...\n');

// Clean node_modules and cache
console.log('🗑️  Cleaning existing installations...');
if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  if (os.platform() === 'win32') {
    // Windows specific removal to avoid path length issues
    runCommand('rd /s /q node_modules 2>nul', { shell: true });
  } else {
    runCommand('rm -rf node_modules');
  }
}

// Clean npm cache
console.log('🧹 Clearing npm cache...');
runCommand('npm cache clean --force');

// Remove package-lock.json to ensure fresh install
if (fs.existsSync(path.join(process.cwd(), 'package-lock.json'))) {
  fs.unlinkSync(path.join(process.cwd(), 'package-lock.json'));
  console.log('📦 Removed package-lock.json for fresh install');
}

// Step 2: Install dependencies with platform-specific fixes
console.log('\n🔧 Step 2: Installing Dependencies...\n');

// For Windows, ensure proper SWC binary
if (os.platform() === 'win32') {
  console.log('🪟 Applying Windows-specific fixes...');
  
  // Set npm config for Windows
  runCommand('npm config set msvs_version 2022');
  runCommand('npm config set python python3.9');
  
  // Install with specific flags for Windows
  console.log('📦 Installing packages (this may take a few minutes)...');
  const installed = runCommand('npm install --force --legacy-peer-deps');
  
  if (!installed) {
    console.log('⚠️  Initial install failed, trying alternative method...');
    runCommand('npm install --force');
  }
  
  // Manually install SWC for Windows if needed
  console.log('🔧 Ensuring SWC binary is properly installed...');
  runCommand('npm install -D @swc/core-win32-x64-msvc@latest --force');
  
} else {
  // Standard install for macOS/Linux
  console.log('📦 Installing packages...');
  runCommand('npm install');
}

// Step 3: Setup Database Configuration
console.log('\n🔧 Step 3: Setting up Database Configuration...\n');

// Check and create .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local with SQLite configuration...');
  
  const envContent = `# Database Configuration (SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="dev-secret-key-${Date.now()}"
JWT_SECRET="dev-jwt-secret-${Date.now()}"

# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="eChanneling Corporate Agent"

# Development Settings
NODE_ENV="development"
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with development configuration');
} else {
  // Check if DATABASE_URL exists in .env.local
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (!envContent.includes('DATABASE_URL')) {
    console.log('⚠️  DATABASE_URL missing in .env.local');
    console.log('📝 Adding DATABASE_URL to .env.local...');
    
    const dbConfig = '\n# Database Configuration (Added by setup script)\nDATABASE_URL="file:./dev.db"\n';
    fs.appendFileSync(envPath, dbConfig);
    console.log('✅ Added DATABASE_URL to existing .env.local');
  } else {
    console.log('✅ .env.local already has DATABASE_URL configured');
  }
}

// Set DATABASE_URL for current process
process.env.DATABASE_URL = "file:./dev.db";

// Step 4: Setup Prisma Database
console.log('\n🔧 Step 4: Setting up Prisma Database...\n');

try {
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  runCommand('npx prisma generate', { env: { ...process.env, DATABASE_URL: "file:./dev.db" } });
  
  // Push database schema
  console.log('🗄️  Creating database and pushing schema...');
  runCommand('npx prisma db push --skip-seed', { env: { ...process.env, DATABASE_URL: "file:./dev.db" } });
  
  console.log('✅ Database setup completed!');
  
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  console.log('\nTry running these commands manually:');
  console.log('1. npx prisma generate');
  console.log('2. npx prisma db push');
}

// Step 5: Clear Next.js cache
console.log('\n🔧 Step 5: Clearing Next.js Cache...\n');

const nextCachePath = path.join(process.cwd(), '.next');
if (fs.existsSync(nextCachePath)) {
  if (os.platform() === 'win32') {
    runCommand('rd /s /q .next 2>nul', { shell: true });
  } else {
    runCommand('rm -rf .next');
  }
  console.log('✅ Cleared Next.js build cache');
}

// Step 6: Platform-specific recommendations
console.log('\n📌 Platform-Specific Notes:\n');

if (os.platform() === 'win32') {
  console.log('🪟 Windows Users:');
  console.log('   - If you still see SWC errors, try:');
  console.log('     1. Run this terminal as Administrator');
  console.log('     2. Install Visual Studio Build Tools 2022');
  console.log('     3. Restart your computer after installation');
  console.log('   - Alternative: Use WSL2 for better compatibility\n');
} else if (os.platform() === 'darwin') {
  console.log('🍎 macOS Users:');
  console.log('   - Ensure Xcode Command Line Tools are installed');
  console.log('   - Run: xcode-select --install (if needed)\n');
} else {
  console.log('🐧 Linux Users:');
  console.log('   - Ensure build-essential is installed');
  console.log('   - Run: sudo apt-get install build-essential (if needed)\n');
}

// Final instructions
console.log('✨ Setup Complete!\n');
console.log('📌 Next Steps:');
console.log('1. Start the development server: npm run dev');
console.log('2. Open http://localhost:3000 in your browser');
console.log('3. The WebSocket errors are expected (backend not running)');
console.log('4. Database is now configured with SQLite\n');

console.log('⚠️  Note for Team Collaboration:');
console.log('   - Each team member should run: npm run setup:cross-platform');
console.log('   - This ensures consistent setup across Windows/Mac/Linux');
console.log('   - Share any platform-specific issues in the team chat\n');

// Create a quick test file to verify setup
const testPath = path.join(process.cwd(), '.setup-complete');
fs.writeFileSync(testPath, new Date().toISOString());
console.log('✅ Setup verification file created: .setup-complete\n');
