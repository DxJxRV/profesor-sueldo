import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Analytics.css';

function NombresMasBuscados() {
  const [topBusquedas, setTopBusquedas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopBusquedas = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getNombresMasBuscados(20);
        setTopBusquedas(data.data || []);
      } catch (err) {
        console.error('Error al cargar nombres más buscados:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchTopBusquedas();
  }, []);

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
        <h1 className="analytics-title">🔍 Nombres Más Buscados</h1>
        <p className="analytics-subtitle">
          Descubre qué profesores están generando más interés en la plataforma
        </p>
      </div>

      <div className="analytics-stats-card">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total de búsquedas únicas</span>
            <span className="stat-value">{topBusquedas.length}</span>
          </div>
        </div>
      </div>

      <div className="analytics-list">
        {topBusquedas.map((item, index) => (
          <div key={index} className="analytics-card">
            <div className="analytics-rank">
              <span className={`rank-badge ${index < 3 ? 'rank-top' : ''}`}>
                #{index + 1}
              </span>
            </div>
            
            <div className="analytics-content">
              <h3 className="analytics-name">{item.nombre_profesor}</h3>
              
              <div className="analytics-metrics">
                <div className="metric">
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="21 21l-4.35-4.35"></path>
                  </svg>
                  <div className="metric-info">
                    <span className="metric-value">{item.total_busquedas}</span>
                    <span className="metric-label">Búsquedas totales</span>
                  </div>
                </div>
                
                <div className="metric">
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div className="metric-info">
                    <span className="metric-value">{item.usuarios_unicos}</span>
                    <span className="metric-label">Usuarios únicos</span>
                  </div>
                </div>
                
                <div className="metric">
                  <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div className="metric-info">
                    <span className="metric-value">
                      {new Date(item.ultima_busqueda).toLocaleDateString('es-MX')}
                    </span>
                    <span className="metric-label">Última búsqueda</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NombresMasBuscados;
