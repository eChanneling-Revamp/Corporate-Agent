# Component Usage Guide
## Quick Reference for New Components

This guide provides quick examples and usage instructions for all newly created components.

---

## 📊 Dashboard Components

### StatisticsCard (Enhanced)

**Location**: `components/dashboard/StatisticsCard.tsx`

**Usage**:
```tsx
import StatisticsCard from '../components/dashboard/StatisticsCard'
import { CalendarCheck } from 'lucide-react'

<StatisticsCard
  title="Today's Appointments"
  value="24"
  change="+12%"
  isPositive={true}
  icon={<CalendarCheck size={20} className="text-blue-500" />}
  bgColor="bg-blue-50"
  trend="up"
  loading={false}
  subtitle="Scheduled for today"
  onClick={() => console.log('Card clicked')}
/>
```

**Props**:
- `title` (string): Card title
- `value` (string): Main value to display
- `change` (string): Percentage change
- `isPositive` (boolean): Whether change is positive
- `icon` (ReactNode): Icon element
- `bgColor` (string): Background color class
- `trend?` ('up' | 'down' | 'neutral'): Trend indicator
- `loading?` (boolean): Show loading state
- `subtitle?` (string): Additional context
- `onClick?` (function): Click handler

---

### AnalyticsChart

**Location**: `components/dashboard/AnalyticsChart.tsx`

**Usage**:
```tsx
import AnalyticsChart from '../components/dashboard/AnalyticsChart'

const data = [
  { name: 'Mon', appointments: 12, revenue: 42000 },
  { name: 'Tue', appointments: 19, revenue: 66500 },
  // ... more data
]

<AnalyticsChart 
  data={data}
  title="Weekly Performance Overview"
  subtitle="Appointments and revenue trends"
/>
```

**Props**:
- `data` (array): Chart data with name, appointments, revenue
- `title` (string): Chart title
- `subtitle?` (string): Chart subtitle

**Features**:
- Toggle between Line, Bar, and Area charts
- Custom tooltips
- Responsive design
- Gradient fills for area charts

---

### PerformanceMetrics

**Location**: `components/dashboard/PerformanceMetrics.tsx`

**Usage**:
```tsx
import PerformanceMetrics from '../components/dashboard/PerformanceMetrics'

<PerformanceMetrics />
```

**Props**: None (uses internal mock data)

**Features**:
- Displays 4 key performance metrics
- Progress bars with target indicators
- Color-coded by metric type
- Responsive grid layout

---

## 🔍 Doctor Search Components

### DoctorCard

**Location**: `components/doctor/DoctorCard.tsx`

**Usage**:
```tsx
import DoctorCard from '../components/doctor/DoctorCard'

const doctor = {
  id: 1,
  name: 'Dr. Sarah Johnson',
  specialization: 'Cardiologist',
  hospital: 'City General Hospital',
  location: 'Colombo 03',
  fee: 3500,
  rating: 4.8,
  availability: ['2024-01-15 09:00', '2024-01-15 14:00'],
  image: '/doctor-image.jpg',
  experience: 15,
  patients: 2500,
  languages: ['English', 'Sinhala', 'Tamil']
}

<DoctorCard 
  doctor={doctor}
  onBook={(id) => console.log('Book doctor', id)}
  onViewDetails={(id) => console.log('View details', id)}
/>
```

**Props**:
- `doctor` (object): Doctor information
  - `id` (number)
  - `name` (string)
  - `specialization` (string)
  - `hospital` (string)
  - `location` (string)
  - `fee` (number)
  - `rating` (number)
  - `availability` (string[])
  - `image` (string)
  - `experience?` (number)
  - `patients?` (number)
  - `languages?` (string[])
- `onBook` (function): Booking handler
- `onViewDetails?` (function): View details handler

**Features**:
- Favorite/bookmark toggle
- Expandable availability slots
- Responsive layout
- Professional design

---

### AdvancedFilters

**Location**: `components/doctor/AdvancedFilters.tsx`

**Usage**:
```tsx
import AdvancedFilters from '../components/doctor/AdvancedFilters'

const [filters, setFilters] = useState({
  specialization: '',
  hospital: '',
  location: '',
  feeMin: '',
  feeMax: '',
  rating: '',
  availability: '',
  gender: '',
  experience: ''
})

const handleFilterChange = (name: string, value: any) => {
  setFilters(prev => ({ ...prev, [name]: value }))
}

<AdvancedFilters
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  filters={filters}
  onFilterChange={handleFilterChange}
  onApply={() => console.log('Apply filters')}
  onReset={() => setFilters({...initialFilters})}
  specializations={['Cardiologist', 'Neurologist']}
  hospitals={['City General', 'National Hospital']}
  locations={['Colombo 03', 'Colombo 10']}
/>
```

**Props**:
- `isOpen` (boolean): Modal visibility
- `onClose` (function): Close handler
- `filters` (object): Current filter values
- `onFilterChange` (function): Filter change handler
- `onApply` (function): Apply filters handler
- `onReset` (function): Reset filters handler
- `specializations` (string[]): Available specializations
- `hospitals` (string[]): Available hospitals
- `locations` (string[]): Available locations

---

## 📈 Reports Components

### ExportModal

**Location**: `components/reports/ExportModal.tsx`

**Usage**:
```tsx
import ExportModal from '../components/reports/ExportModal'

<ExportModal
  isOpen={showExportModal}
  onClose={() => setShowExportModal(false)}
  reportType="overview"
/>
```

**Props**:
- `isOpen` (boolean): Modal visibility
- `onClose` (function): Close handler
- `reportType` (string): Type of report being exported

**Features**:
- Multiple export formats (PDF, Excel, CSV, PNG)
- Date range selection
- Export options (charts, raw data)
- Preview information
- Loading states

---

## 🎨 Styling Guidelines

### Color Palette
```tsx
// Primary Colors
bg-blue-600    // Primary actions
bg-green-600   // Success states
bg-red-600     // Danger/delete actions
bg-amber-600   // Warning states
bg-purple-600  // Special features

// Background Colors
bg-blue-50     // Light blue backgrounds
bg-green-50    // Light green backgrounds
bg-gray-50     // Neutral backgrounds

// Text Colors
text-gray-900  // Primary text
text-gray-600  // Secondary text
text-gray-500  // Tertiary text
```

### Spacing Scale
```tsx
p-2    // 8px
p-3    // 12px
p-4    // 16px
p-6    // 24px
p-8    // 32px

gap-2  // 8px
gap-3  // 12px
gap-4  // 16px
gap-6  // 24px
```

### Border Radius
```tsx
rounded-md    // 6px - Default for cards
rounded-lg    // 8px - Larger cards
rounded-full  // 9999px - Pills and avatars
rounded-xl    // 12px - Special elements
```

---

## 🔄 State Management Patterns

### Loading States
```tsx
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  setLoading(true)
  try {
    await someAsyncOperation()
    toast.success('Success!')
  } catch (error) {
    toast.error('Error occurred')
  } finally {
    setLoading(false)
  }
}
```

### Filter State
```tsx
const [filters, setFilters] = useState({
  field1: '',
  field2: '',
  // ...
})

const handleFilterChange = (name: string, value: any) => {
  setFilters(prev => ({ ...prev, [name]: value }))
}

const handleReset = () => {
  setFilters({
    field1: '',
    field2: '',
    // ...
  })
}
```

### Modal State
```tsx
const [isOpen, setIsOpen] = useState(false)

// Open modal
<button onClick={() => setIsOpen(true)}>Open</button>

// Modal component
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

---

## 📱 Responsive Design Patterns

### Grid Layouts
```tsx
// Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Content */}
</div>

// Mobile: 1 column, Desktop: 2 columns
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  {/* Content */}
</div>
```

### Flex Layouts
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">
  {/* Content */}
</div>

// Responsive spacing
<div className="p-4 sm:p-6">
  {/* Content */}
</div>
```

### Typography
```tsx
// Responsive text sizes
<h1 className="text-xl sm:text-2xl font-bold">Title</h1>
<p className="text-sm sm:text-base">Body text</p>
```

---

## 🎯 Common Patterns

### Button Styles
```tsx
// Primary button
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  Primary Action
</button>

// Secondary button
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
  Secondary Action
</button>

// Danger button
<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
  Delete
</button>

// Disabled button
<button 
  disabled={loading}
  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
>
  Submit
</button>
```

### Input Fields
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  placeholder="Enter text..."
/>
```

### Select Dropdowns
```tsx
<select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
  <option value="">Select option</option>
  <option value="1">Option 1</option>
</select>
```

### Cards
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
  {/* Card content */}
</div>
```

---

## 🔔 Toast Notifications

```tsx
import toast from 'react-hot-toast'

// Success
toast.success('Operation completed successfully!')

// Error
toast.error('An error occurred')

// Custom
toast('Custom message', { icon: '🎉' })

// Loading
const toastId = toast.loading('Processing...')
// Later...
toast.success('Done!', { id: toastId })
```

---

## 🎨 Icon Usage

```tsx
import { 
  Calendar, 
  User, 
  Settings, 
  Download 
} from 'lucide-react'

// Basic usage
<Calendar size={20} />

// With color
<Calendar size={20} className="text-blue-600" />

// In button
<button className="flex items-center space-x-2">
  <Download size={16} />
  <span>Export</span>
</button>
```

---

## 📝 Best Practices

1. **Always use TypeScript interfaces** for component props
2. **Implement loading states** for async operations
3. **Add error handling** with try-catch blocks
4. **Use toast notifications** for user feedback
5. **Make components responsive** from the start
6. **Follow naming conventions** (PascalCase for components)
7. **Keep components focused** (single responsibility)
8. **Use meaningful variable names**
9. **Add comments** for complex logic
10. **Test on multiple screen sizes**

---

## 🚀 Quick Start Checklist

When creating a new component:

- [ ] Create TypeScript interface for props
- [ ] Add prop validation
- [ ] Implement responsive design
- [ ] Add loading states
- [ ] Add error handling
- [ ] Include hover effects
- [ ] Test on mobile
- [ ] Add accessibility features
- [ ] Document usage
- [ ] Add to this guide

---

**Last Updated**: 2025-10-09  
**Maintained by**: Frontend Team
