import { useTranslation } from 'react-i18next'
import { Bars3Icon } from '@heroicons/react/24/outline'

const Navbar = () => {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('Dashboard')}</h1>
        <div className="flex space-x-4">
          <button onClick={() => changeLanguage('en')} className="text-gray-700">EN</button>
          <button onClick={() => changeLanguage('fr')} className="text-gray-700">FR</button>
          <button onClick={() => changeLanguage('ar')} className="text-gray-700">AR</button>
          <Bars3Icon className="h-8 w-8" />
        </div>
      </div>
    </header>
  )
}

export default Navbar
