import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import DashboardKPIs from '../components/DashboardKPIs'
import InventoryAlerts from '../components/InventoryAlerts'
import TopProducts from '../components/TopProducts'
import SalesTrends from '../components/SalesTrends'

const DashboardPage = () => {
  const fetchDashboardData = async () => {
    const response = await axios.get('/api/dashboard/kpis')
    return response.data
  }

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  })

  return (
    <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8 space-y-8">
      <DashboardKPIs data={data} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProducts />
        <InventoryAlerts />
      </div>
      <SalesTrends />
    </div>
  )
}

export default DashboardPage
