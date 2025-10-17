import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import '../styles/Analytics.css';

function ProfesoresMasVistos() {
  const navigate = useNavigate();
  const [topClickeados, setTopClickeados] = useState([]);
  const [totalVistasAcumuladas, setTotalVistasAcumuladas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopClickeados = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getProfesoresMasClickeados(20);
        setTopClickeados(data.data || []);
        setTotalVistasAcumuladas(data.totalVistasAcumuladas || 0);
      } catch (err) {
        console.error('Error al cargar profesores más vistos:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchTopClickeados();
  }, []);

  const handleProfessorClick = (profesor) => {
    // Buscar el profesor para obtener su professorId
    navigate('/', { 
      state: { 
        searchName: profesor.nombreProfesor 
      } 
    });
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="analytics-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="analytics-title">👁️ Profesores Más Vistos</h1>
        <p className="analytics-subtitle">
          Los perfiles de profesores que han generado más interés
        </p>
      </div>

      <div className="analytics-stats-card">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Profesores destacados</span>
            <span className="stat-value">{topClickeados.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total de vistas</span>
            <span className="stat-value">
              {totalVistasAcumuladas.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="analytics-list">
        {topClickeados.map((profesor, index) => (
          <div 
            key={index} 
            className="analytics-card analytics-card-clickable"
            onClick={() => handleProfessorClick(profesor)}
          >
            <div className="analytics-rank">
              <span className={`rank-badge ${index < 3 ? 'rank-top' : ''}`}>
                #{index + 1}
              </span>
            </div>
            
            <div className="analytics-content">
              <h3 className="analytics-name">{profesor.nombreProfesor}</h3>
              <div className="analytics-institution">
                <svg className="institution-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <span>{profesor.sujetoObligado}</span>
              </div>
              <div className="analytics-location">
                <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{profesor.entidadFederativa}</span>
              </div>
              
              <div className="analytics-metrics">
                <div className="metric">
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <div className="metric-info">
                    <span className="metric-value">{profesor.totalVistas}</span>
                    <span className="metric-label">Vistas totales</span>
                  </div>
                </div>
                
                <div className="metric">
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div className="metric-info">
                    <span className="metric-value">{profesor.usuariosUnicos}</span>
                    <span className="metric-label">Usuarios únicos</span>
                  </div>
                </div>
              </div>

              <div className="analytics-salary-info">
                <div className="salary-item">
                  <span className="salary-label">Sueldo Máximo Promedio</span>
                  <span className="salary-value">
                    ${parseFloat(profesor.promedioSueldoMaximo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="salary-item">
                  <span className="salary-label">Sueldo Acumulado Promedio</span>
                  <span className="salary-value salary-highlight">
                    ${parseFloat(profesor.promedioSueldoAcumulado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfesoresMasVistos;
