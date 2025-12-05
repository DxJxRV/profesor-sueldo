import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Analytics.css';
import DashboardUtmConfig from '../components/DashboardUtmConfig';

function EstadisticasGenerales() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('estadisticas'); // 'estadisticas' o 'utm'

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
        <h1 className="analytics-title">📊 Panel de Administración</h1>
        <p className="analytics-subtitle">
          Estadísticas y configuraciones del sistema
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('estadisticas')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'estadisticas' ? '#3b82f6' : 'transparent',
            color: activeTab === 'estadisticas' ? 'white' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === 'estadisticas' ? '3px solid #3b82f6' : 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          📊 Estadísticas Generales
        </button>
        <button
          onClick={() => setActiveTab('utm')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: activeTab === 'utm' ? '#3b82f6' : 'transparent',
            color: activeTab === 'utm' ? 'white' : '#6b7280',
            border: 'none',
            borderBottom: activeTab === 'utm' ? '3px solid #3b82f6' : 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          🎯 Configuraciones UTM
        </button>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'utm' ? (
        <DashboardUtmConfig />
      ) : (
        <>
          {/* Contenido original de estadísticas */}

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
        </>
      )}
    </div>
  );
}

export default EstadisticasGenerales;
