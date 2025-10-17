import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Analytics.css';

function EstadisticasGenerales() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getEstadisticasGenerales();
        setEstadisticas(data.data || null);
      } catch (err) {
        console.error('Error al cargar estadísticas generales:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, []);

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">Cargando estadísticas...</div>
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

  if (!estadisticas) {
    return (
      <div className="analytics-container">
        <div className="analytics-error">No se encontraron datos</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="analytics-title">📊 Estadísticas Generales</h1>
        <p className="analytics-subtitle">
          Resumen de la actividad del sistema
        </p>
      </div>

      {/* Estadísticas Totales */}
      <div className="analytics-stats-card">
        <h2 className="stats-section-title">Totales Acumulados</h2>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total de Búsquedas</span>
            <span className="stat-value">
              {estadisticas.totales?.busquedas?.toLocaleString() || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total de Vistas</span>
            <span className="stat-value">
              {estadisticas.totales?.vistas?.toLocaleString() || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Usuarios Únicos</span>
            <span className="stat-value">
              {estadisticas.totales?.usuariosUnicos?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas de las Últimas 24 Horas */}
      <div className="analytics-stats-card" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <h2 className="stats-section-title" style={{ color: 'white' }}>Últimas 24 Horas</h2>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Búsquedas</span>
            <span className="stat-value">
              {estadisticas.ultimas24Horas?.busquedas?.toLocaleString() || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Vistas</span>
            <span className="stat-value">
              {estadisticas.ultimas24Horas?.vistas?.toLocaleString() || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Usuarios Nuevos</span>
            <span className="stat-value">
              {estadisticas.ultimas24Horas?.usuariosNuevos?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Métricas Adicionales */}
      <div className="analytics-list" style={{ marginTop: '2rem' }}>
        <div className="analytics-card">
          <div className="analytics-content">
            <h3 className="analytics-name">Análisis de Actividad</h3>
            
            <div className="analytics-metrics">
              <div className="metric">
                <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"></polyline>
                  <polyline points="17,6 23,6 23,12"></polyline>
                </svg>
                <div className="metric-info">
                  <span className="metric-value">
                    {estadisticas.totales?.busquedas && estadisticas.totales?.usuariosUnicos
                      ? (estadisticas.totales.busquedas / estadisticas.totales.usuariosUnicos).toFixed(2)
                      : '0'}
                  </span>
                  <span className="metric-label">Búsquedas por Usuario</span>
                </div>
              </div>
              
              <div className="metric">
                <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <div className="metric-info">
                  <span className="metric-value">
                    {estadisticas.totales?.vistas && estadisticas.totales?.usuariosUnicos
                      ? (estadisticas.totales.vistas / estadisticas.totales.usuariosUnicos).toFixed(2)
                      : '0'}
                  </span>
                  <span className="metric-label">Vistas por Usuario</span>
                </div>
              </div>
              
              <div className="metric">
                <svg className="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <div className="metric-info">
                  <span className="metric-value">
                    {estadisticas.ultimas24Horas?.busquedas && estadisticas.totales?.busquedas
                      ? ((estadisticas.ultimas24Horas.busquedas / estadisticas.totales.busquedas) * 100).toFixed(2)
                      : '0'}%
                  </span>
                  <span className="metric-label">% Actividad Reciente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EstadisticasGenerales;
