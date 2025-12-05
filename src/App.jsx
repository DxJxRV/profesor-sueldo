import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Home2 from './pages/Home2'
import ProfessorDetail from './pages/ProfessorDetail'
import ProfessorRedirect from './pages/ProfessorRedirect'
import PoliticasCookies from './pages/PoliticasCookies'
import AvisoLegal from './pages/AvisoLegal'
import PoliticaPrivacidad from './pages/PoliticaPrivacidad'
import Contacto from './pages/Contacto'
import NombresMasBuscados from './pages/NombresMasBuscados'
import ProfesoresMasVistos from './pages/ProfesoresMasVistos'
import RankingSueldos from './pages/RankingSueldos'
import EstadisticasGenerales from './pages/EstadisticasGenerales'
import AdminDashboard from './pages/AdminDashboard'
import Layout from './components/Layout'
import { apiClient } from './services/apiClient'
// SEO Pages
import ProfesionPage from './pages/seo/ProfesionPage'
import EstadoPage from './pages/seo/EstadoPage'
import InstitucionPage from './pages/seo/InstitucionPage'
import './App.css'

function App() {
  // Inicializar sesión al cargar la aplicación
  useEffect(() => {
  const initializeSession = async () => {
    try {
      const data = await apiClient.ping();

      if (data && typeof data === "object") {
        console.log("✅ Sesión inicializada correctamente:", data);
      } else {
        console.log("✅ Sesión inicializada correctamente (sin datos JSON)");
      }
    } catch (error) {
      console.error("❌ Error iniciando sesión:", error.message);
      console.warn("⚠️ No se pudo inicializar la sesión");
    }
  };

  initializeSession();
}, []);
 // Solo se ejecuta una vez al montar el componente

  return (
    <>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home2 />} />
            <Route path="/home2" element={<Home />} />
            <Route path="/profesor" element={<ProfessorRedirect />} />
            <Route path="/profesor/:professorId/:nombreCompleto" element={<ProfessorDetail />} />
            
            {/* Rutas de Analytics */}
            <Route path="/nombres-mas-buscados" element={<NombresMasBuscados />} />
            <Route path="/profesores-mas-vistos" element={<ProfesoresMasVistos />} />
            <Route path="/ranking-sueldos" element={<RankingSueldos />} />
            <Route path="/dxjx663" element={<EstadisticasGenerales />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />

            {/* Rutas SEO - Páginas estáticas generadas */}
            <Route path="/cuanto-gana/:profesionSlug" element={<ProfesionPage />} />
            <Route path="/salarios/por-estado/:estadoSlug" element={<EstadoPage />} />
            <Route path="/salarios/por-institucion/:institucionSlug" element={<InstitucionPage />} />

            {/* Páginas legales */}
            <Route path="/politicas-cookies" element={<PoliticasCookies />} />
            <Route path="/aviso-legal" element={<AvisoLegal />} />
            <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
            <Route path="/contacto" element={<Contacto />} />
          </Route>
        </Routes>
      </Router>
      
      {/* Mensaje fijo en la parte inferior */}
      <div className="bottom-support-message">
        ❤️ Los anuncios nos permiten mantener la app gratuita ❤️
      </div>
    </>
  )
}

export default App
