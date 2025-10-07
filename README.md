# eChanneling Corporate Agent Frontend


A modern, responsive web application built with Next.js 14 for managing corporate healthcare appointments and agent operations. This platform provides a comprehensive dashboard for corporate agents to manage doctor appointments, bulk bookings, payments, and generate detailed reports.

![Next.js](https://img.shields.io/badge/Next.js-14.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.0-764ABC?style=flat-square&logo=redux)

## Features

### Dashboard & Analytics
- **Real-time Statistics**: Live appointment counts, revenue tracking, and performance metrics
- **Interactive Charts**: Visual representation of data using Recharts
- **Quick Actions Panel**: Fast access to common operations
- **Recent Appointments**: Overview of latest bookings and status updates

### Doctor & Appointment Management
- **Advanced Doctor Search**: Filter by specialization, availability, and location
- **Appointment Scheduling**: Create, modify, and cancel appointments
- **Bulk Booking System**: Schedule multiple appointments efficiently
- **ACB Confirmation**: Automated Confirmation Booking system

### Payment & Financial Management
- **Payment Processing**: Handle corporate payment transactions
- **Invoice Generation**: Create and manage billing documents
- **Financial Reports**: Detailed revenue and expense tracking
- **Payment History**: Complete transaction audit trail

### Reporting & Analytics
- **Comprehensive Reports**: Generate detailed operational reports
- **Data Export**: Export reports in multiple formats
- **Performance Metrics**: Track KPIs and business metrics
- **Custom Filters**: Filter reports by date, doctor, department, etc.

### Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permission levels for agents
- **Session Management**: Persistent login with redux-persist
- **Protected Routes**: Secure access to sensitive pages

### Responsive Design
- **Mobile-First**: Optimized for all device sizes
- **Tablet Support**: Perfect experience on tablets
- **Desktop Optimized**: Full-featured desktop interface
- **Ultra-wide Support**: Excellent experience on large screens

## Technology Stack

### Frontend Framework
- **Next.js 14**: React framework with SSR, routing, and optimization
- **React 18.3**: Latest React with concurrent features
- **TypeScript 5.5**: Full type safety and developer experience

### State Management
- **Redux Toolkit 2.0**: Modern Redux with simplified API
- **Redux Persist**: Persistent state across sessions
- **React Redux**: Official React bindings for Redux

### Styling & UI
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **Responsive Design**: Mobile-first approach with breakpoints

### Data & API
- **Axios**: HTTP client for API requests
- **React Hook Form**: Performant forms with easy validation
- **Date-fns**: Modern date utility library

### Authentication & Security
- **JWT**: JSON Web Tokens for secure authentication
- **bcryptjs**: Password hashing and security
- **js-cookie**: Secure cookie management

### Data Visualization
- **Recharts**: Composable charting library for React
- **React DatePicker**: Advanced date selection components

### Development Tools
- **ESLint**: Code linting and quality assurance
- **PostCSS**: CSS processing with Autoprefixer
- **TypeScript ESLint**: TypeScript-specific linting rules

## Project Structure

```
├── components/           # Reusable UI components
│   ├── common/          # Shared components (modals, forms, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   ├── layout/          # Layout components (header, sidebar)
│   └── ui/              # Base UI components
├── contexts/            # React contexts for state sharing
├── hooks/               # Custom React hooks
│   └── useDebounce.ts   # Debounce hook for search optimization
├── pages/               # Next.js pages (App Router)
│   ├── _app.tsx         # App configuration
│   ├── _document.tsx    # HTML document structure
│   ├── index.tsx        # Home page (redirects to dashboard)
│   ├── login.tsx        # Authentication page
│   ├── dashboard.tsx    # Main dashboard
│   ├── doctor-search.tsx# Doctor search and booking
│   ├── appointments.tsx # Appointment management
│   ├── bulk-booking.tsx # Bulk appointment booking
│   ├── acb-confirmation.tsx # ACB confirmation system
│   ├── payments.tsx     # Payment management
│   ├── reports.tsx      # Reports and analytics
│   ├── settings.tsx     # User and system settings
│   └── help-support.tsx # Help and support
├── public/              # Static assets
│   ├── images/          # Images and logos
│   └── icons/           # Icon files
├── services/            # API service functions
│   ├── api.ts           # Base API configuration
│   ├── auth.ts          # Authentication services
│   ├── doctors.ts       # Doctor-related API calls
│   ├── appointments.ts  # Appointment services
│   ├── payments.ts      # Payment services
│   └── reports.ts       # Report generation services
├── store/               # Redux store configuration
│   ├── index.ts         # Store setup and configuration
│   ├── authSlice.ts     # Authentication state
│   ├── doctorSlice.ts   # Doctor data state
│   ├── appointmentSlice.ts # Appointment state
│   ├── paymentSlice.ts  # Payment state
│   └── reportSlice.ts   # Report state
├── styles/              # Global styles and CSS
└── types/               # TypeScript type definitions
```

## Getting Started

### Prerequisites
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eChanneling-Revamp/Corporate-Agent-Frontend.git
   cd Corporate-Agent-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_API_URL=your_api_endpoint
   NEXT_PUBLIC_JWT_SECRET=your_jwt_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Credentials
For testing purposes, use these demo credentials:
- **Email**: `agent@gmail.com`
- **Password**: `ABcd123#`

## Responsive Breakpoints

The application is optimized for various screen sizes:

- **Mobile**: `< 640px` - Collapsed sidebar, mobile-optimized layouts
- **Tablet**: `640px - 1024px` - Condensed sidebar, touch-friendly interface
- **Desktop**: `1024px - 1536px` - Full sidebar, desktop-optimized experience
- **Ultra-wide**: `> 1536px` - Expanded layouts, maximum content visibility

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Deployment
npm run export       # Export static files
```

## Deployment

### Vercel Deployment (Recommended)
This project is optimized for Vercel deployment:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import your repository on [Vercel](https://vercel.com)
   - Configure environment variables
   - Deploy automatically

3. **Custom Domain** (Optional)
   - Add your custom domain in Vercel dashboard
   - Configure DNS settings

### Manual Deployment
```bash
npm run build        # Build the application
npm run start        # Start production server
```

## Configuration

### Next.js Configuration (`next.config.js`)
```javascript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
}
```

### Tailwind Configuration
Custom Tailwind setup with corporate theme colors and responsive breakpoints.

### Redux Store
Configured with Redux Toolkit for efficient state management and Redux Persist for data persistence.

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint
   npm run type-check
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Commit Convention
We use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code formatting
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## API Integration

The application integrates with the eChanneling backend API:

### Authentication Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Doctor Management
- `GET /doctors` - List all doctors
- `GET /doctors/search` - Search doctors
- `GET /doctors/:id` - Get doctor details

### Appointment Management
- `GET /appointments` - List appointments
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

### Payment Processing
- `GET /payments` - Payment history
- `POST /payments` - Process payment
- `GET /payments/invoices` - Generate invoices

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Type Errors**
```bash
# Run type checking
npm run type-check
```

**Styling Issues**
```bash
# Rebuild Tailwind
npm run build:css
```

### Performance Optimization
- Uses Next.js Image optimization
- Implements code splitting
- Lazy loading for heavy components
- Redux state normalization

## Team

- **Frontend Development**: React/Next.js Team
- **Backend Integration**: API Integration Team
- **UI/UX Design**: Design Team
- **Quality Assurance**: QA Team

---

**Built with by the eChanneling Development Team**
