import React, { createContext, useContext, useMemo, useState } from 'react';

export type Doctor = {
  id: number;
  name: string;
  specialization: string;
  hospital: string;
  experience: string;
  rating: number;
  reviews: number;
  fee: string;
  availableDates: string[];
  image: string;
};

export type Appointment = {
  id: string;
  patient: string;
  doctor: string;
  specialization: string;
  date: string;
  time: string;
  hospital: string;
  status: 'Confirmed' | 'Pending' | 'Payment Failed' | 'Cancelled';
  amount: string;
};

export type SearchFilters = {
  query?: string;
  specialization?: string;
  hospital?: string;
  date?: string;
  feeMin?: number;
  feeMax?: number;
};

type AppState = {
  doctors: Doctor[];
  appointments: Appointment[];
  filteredDoctors: Doctor[];
  filters: SearchFilters;
  searchDoctors: (filters: SearchFilters) => void;
  clearFilters: () => void;
  bookAppointment: (args: {
    doctor: Doctor;
    patient: string;
    date: string;
    time: string;
  }) => Appointment;
  cancelAppointment: (id: string) => void;
};

const AppStateContext = createContext<AppState | undefined>(undefined);

const initialDoctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Sarah Williams',
    specialization: 'Cardiologist',
    hospital: 'City Medical Center',
    experience: '15 years',
    rating: 4.8,
    reviews: 124,
    fee: 'Rs 2,500',
    availableDates: ['Today', 'Tomorrow', 'Oct 18', 'Oct 20'],
    image:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    specialization: 'Neurologist',
    hospital: 'Central Hospital',
    experience: '12 years',
    rating: 4.6,
    reviews: 98,
    fee: 'Rs 3,200',
    availableDates: ['Tomorrow', 'Oct 19', 'Oct 21'],
    image:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    name: 'Dr. Lisa Kumar',
    specialization: 'Dermatologist',
    hospital: 'Skin & Care Clinic',
    experience: '8 years',
    rating: 4.9,
    reviews: 156,
    fee: 'Rs 1,800',
    availableDates: ['Today', 'Oct 18', 'Oct 19', 'Oct 22'],
    image:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 4,
    name: 'Dr. James Rodriguez',
    specialization: 'Orthopedic',
    hospital: 'Orthopedic Specialty Center',
    experience: '20 years',
    rating: 4.7,
    reviews: 210,
    fee: 'Rs 3,500',
    availableDates: ['Oct 18', 'Oct 19', 'Oct 20', 'Oct 21'],
    image:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
];

function parseFeeToNumber(fee: string) {
  const n = parseInt(fee.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctors] = useState<Doctor[]>(initialDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const q = (filters.query || '').toLowerCase();
      const matchQuery = !q ||
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q);
      const matchSpec = !filters.specialization || d.specialization === filters.specialization;
      const matchHosp = !filters.hospital || d.hospital === filters.hospital;
      const matchDate = !filters.date || d.availableDates.includes(filters.date);
      const fee = parseFeeToNumber(d.fee);
      const matchMin = filters.feeMin == null || fee >= filters.feeMin;
      const matchMax = filters.feeMax == null || fee <= filters.feeMax;
      return matchQuery && matchSpec && matchHosp && matchDate && matchMin && matchMax;
    });
  }, [doctors, filters]);

  const searchDoctors = (f: SearchFilters) => {
    setFilters((prev) => ({ ...prev, ...f }));
  };

  const clearFilters = () => setFilters({});

  const bookAppointment: AppState['bookAppointment'] = ({ doctor, date, patient, time }) => {
    const newAppt: Appointment = {
      id: `APT-${Math.floor(10000 + Math.random() * 89999)}`,
      patient,
      doctor: doctor.name,
      specialization: doctor.specialization,
      date,
      time,
      hospital: doctor.hospital,
      status: 'Confirmed',
      amount: doctor.fee,
    };
    setAppointments((a) => [newAppt, ...a]);
    return newAppt;
  };

  const cancelAppointment = (id: string) => {
    setAppointments((a) => a.map((x) => (x.id === id ? { ...x, status: 'Cancelled' } : x)));
  };

  const value: AppState = {
    doctors,
    appointments,
    filteredDoctors,
    filters,
    searchDoctors,
    clearFilters,
    bookAppointment,
    cancelAppointment,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
