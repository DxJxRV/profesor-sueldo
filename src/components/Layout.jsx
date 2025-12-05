import { Outlet, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import { getUtmKeyFromUrl, fetchUtmConfig } from '../utils/utmConfig'

function Layout() {
  const [searchParams] = useSearchParams()
  const [hasUtmConfig, setHasUtmConfig] = useState(false)

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

  return (
    <>
      <Navbar isTransparent={hasUtmConfig} />
      <Outlet />
      <Footer />
    </>
  )
}

export default Layout
