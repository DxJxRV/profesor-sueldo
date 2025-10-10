import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Home2 from './pages/Home2'
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
      <div className="App">
        <Routes>
          <Route path="/" element={<Home2 />} />
          <Route path="/home2" element={<Home />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
