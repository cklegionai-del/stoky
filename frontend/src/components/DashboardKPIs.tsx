import { useTranslation } from 'react-i18next'
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon, ShoppingBagIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const DashboardKPIs = ({ data }: { data: any }) => {
  const { t } = useTranslation()

  if (!data) return null

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Products */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <ShoppingBagIcon className="h-6 w-6 text-blue-500" />
          <h3 className="ml-4 text-lg font-medium text-gray-900">{t('Total Products')}</h3>
        </div>
        <p className="mt-2 text-3xl font-bold">{data.total_products}</p>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
          <h3 className="ml-4 text-lg font-medium text-gray-900">{t('Low Stock Alerts')}</h3>
        </div>
        <p className="mt-2 text-3xl font-bold flex items-center">
          {data.low_stock_alerts}
        </p>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
          <h3 className="ml-4 text-lg font-medium text-gray-900">{t('Monthly Revenue')}</h3>
        </div>
        <p className="mt-2 text-3xl font-bold flex items-center">
          ${data.monthly_revenue.toLocaleString()}
        </p>
      </div>

      {/* Total Invoices */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 text-indigo-500" />
          <h3 className="ml-4 text-lg font-medium text-gray-900">{t('Total Invoices')}</h3>
        </div>
        <p className="mt-2 text-3xl font-bold">{data.total_invoices}</p>
      </div>
    </div>
  )
}

export default DashboardKPIs
