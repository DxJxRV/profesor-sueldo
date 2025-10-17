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
import Layout from './components/Layout'
import { apiClient } from './services/apiClient'
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
          
          {/* Páginas legales */}
          <Route path="/politicas-cookies" element={<PoliticasCookies />} />
          <Route path="/aviso-legal" element={<AvisoLegal />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/contacto" element={<Contacto />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
