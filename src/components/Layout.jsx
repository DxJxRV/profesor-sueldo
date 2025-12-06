import { Outlet, useSearchParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { getUtmKeyFromUrl, fetchUtmConfig } from '../utils/utmConfig'

function Layout() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [hasUtmConfig, setHasUtmConfig] = useState(false)
  const [isHomePage, setIsHomePage] = useState(false)

  useEffect(() => {
    // Verificar si estamos en la página principal
    setIsHomePage(location.pathname === '/')
  }, [location.pathname])

  useEffect(() => {
    const checkUtmConfig = async () => {
      const utmKey = getUtmKeyFromUrl(searchParams)

      if (utmKey) {
        const config = await fetchUtmConfig(utmKey)
        setHasUtmConfig(!!config)
      } else {
        setHasUtmConfig(false)
      }
    }

    checkUtmConfig()
  }, [searchParams])

  // Navbar transparente si hay UTM o si estamos en home sin UTM
  const shouldBeTransparent = hasUtmConfig || (isHomePage && !hasUtmConfig)

  return (
    <>
      <Navbar isTransparent={shouldBeTransparent} />
      <Outlet />
      <Footer />
    </>
  )
}

export default Layout
