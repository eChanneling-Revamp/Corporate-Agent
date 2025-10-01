import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import KPI from '../components/KPI'
import { fetchKpis, fetchReportSeries } from '../slices/reportsSlice'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function Dashboard() {
  const dispatch = useDispatch()
  const { kpis, series } = useSelector(s => s.reports)

  useEffect(() => {
    dispatch(fetchKpis())
    dispatch(fetchReportSeries('30d'))
  }, [dispatch])

  const data = {
    labels: series.map(x => x.label),
    datasets: [
      { label: 'Appointments', data: series.map(x => x.appointments), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.2)' },
      { label: 'Revenue', data: series.map(x => x.revenue), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)' },
    ]
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total Appointments" value={kpis?.totalAppointments ?? 0} delta={kpis?.appointmentsDelta ?? 0} />
        <KPI label="Confirmed (ACB)" value={kpis?.confirmed ?? 0} delta={kpis?.confirmedDelta ?? 0} />
        <KPI label="Revenue" value={`LKR ${kpis?.revenue ?? 0}`} delta={kpis?.revenueDelta ?? 0} />
        <KPI label="Cancellations" value={kpis?.cancellations ?? 0} delta={kpis?.cancellationsDelta ?? 0} />
      </div>

      <div className="card">
        <div className="card-header">30-day Performance</div>
        <div className="card-body">
          <Line data={data} />
        </div>
      </div>
    </div>
  )
}
