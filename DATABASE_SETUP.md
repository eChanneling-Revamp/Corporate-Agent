# PostgreSQL Database Setup Instructions

## 1. Database Options

### Option A: Local PostgreSQL Installation
1. Download and install PostgreSQL from https://postgresql.org/download/
2. During installation, remember the password for the 'postgres' user
3. Create a new database for the application:
   ```sql
   CREATE DATABASE echannelling_corporate;
   CREATE USER echannelling_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE echannelling_corporate TO echannelling_user;
   ```

### Option B: Cloud PostgreSQL (Recommended)
- **Supabase**: https://supabase.com (Free tier available)
- **Railway**: https://railway.app (PostgreSQL hosting)
- **Neon**: https://neon.tech (Serverless PostgreSQL)
- **AWS RDS**: https://aws.amazon.com/rds/
- **Google Cloud SQL**: https://cloud.google.com/sql

## 2. Update Environment Variables

Update your `.env.local` file with your PostgreSQL connection string:

### For Local PostgreSQL:
```bash
DATABASE_URL="postgresql://echannelling_user:your_password@localhost:5432/echannelling_corporate?schema=public"
```

### For Cloud PostgreSQL (example with Supabase):
```bash
DATABASE_URL="postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres?schema=public"
```

## 3. Run Database Migrations

Once you have your PostgreSQL database set up and the DATABASE_URL configured:

```bash
# Generate migration files
npx prisma migrate dev --name init

# Or if you want to push schema without migrations
npx prisma db push

# Open Prisma Studio to view your database
npx prisma studio
```

## 4. Seed Data (Optional)

You can create a seed file to populate initial data:

```javascript
// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create a test agent
  const hashedPassword = await bcrypt.hash('ABcd123#', 10)
  
  await prisma.agent.create({
    data: {
      agentType: 'CORPORATE',
      companyName: 'Demo Company',
      contactPerson: 'Demo Agent',
      email: 'agent@gmail.com',
      phone: '+94771234567',
      username: 'demo_agent',
      password: hashedPassword,
      status: 'ACTIVE'
    }
  })
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
```

Run seed: `npx prisma db seed`

## 5. Current Configuration Status

✅ **Completed:**
- PostgreSQL Prisma schema configured
- All models updated for PostgreSQL compatibility
- NextAuth configured with Prisma adapter
- Google OAuth integration ready
- Environment variables template provided

🔄 **Next Steps:**
1. Set up your PostgreSQL database (local or cloud)
2. Update DATABASE_URL in .env.local
3. Run `npx prisma migrate dev --name init`
4. Start the application with `npm run dev`

## 6. Testing the Integration

Once your database is set up:
1. Visit http://localhost:3000
2. Try registering a new agent
3. Test login with Google OAuth or credentials
4. Create test appointments
5. Check data in Prisma Studio (`npx prisma studio`)