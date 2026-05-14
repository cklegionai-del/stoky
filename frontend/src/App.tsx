import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardPage from './pages/Dashboard'
import Navbar from './components/Navbar'
import { QueryClientProvider } from '@tanstack/react-query'

function App() {
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <QueryClientProvider>
        <div className="min-h-screen">
          <Navbar />
          <Suspense fallback="Loading...">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
            </Routes>
          </Suspense>
        </div>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

export default App
