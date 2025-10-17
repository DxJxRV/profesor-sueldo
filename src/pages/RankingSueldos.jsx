import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import '../styles/Analytics.css';

function RankingSueldos() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('top'); // 'top' o 'bottom'
  const [topSueldos, setTopSueldos] = useState([]);
  const [bottomSueldos, setBottomSueldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSueldos = async () => {
      try {
        setLoading(true);
        const [topData, bottomData] = await Promise.all([
          apiClient.getTopSueldos(20),
          apiClient.getBottomSueldos(20)
        ]);
        setTopSueldos(topData.data || []);
        setBottomSueldos(bottomData.data || []);
      } catch (err) {
        console.error('Error al cargar sueldos:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchSueldos();
  }, []);

  const handleProfessorClick = (profesor) => {
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

  const currentData = activeTab === 'top' ? topSueldos : bottomSueldos;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="analytics-title">💰 Ranking de Sueldos</h1>
        <p className="analytics-subtitle">
          Comparativa de sueldos acumulados en instituciones públicas
        </p>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button 
          className={`tab-button ${activeTab === 'top' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"></polyline>
            <polyline points="17,6 23,6 23,12"></polyline>
          </svg>
          Mayores Sueldos
        </button>
        <button 
          className={`tab-button ${activeTab === 'bottom' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('bottom')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23,18 13.5,8.5 8.5,13.5 1,6"></polyline>
            <polyline points="17,18 23,18 23,12"></polyline>
          </svg>
          Menores Sueldos
        </button>
      </div>

      {/* Stats Summary */}
      <div className="analytics-stats-card">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">Profesores en ranking</span>
            <span className="stat-value">{currentData.length}</span>
          </div>
          {activeTab === 'top' && topSueldos.length > 0 && (
            <>
              <div className="stat-item">
                <span className="stat-label">Sueldo más alto</span>
                <span className="stat-value stat-highlight">
                  ${parseFloat(topSueldos[0]?.sueldoAcumulado || 0).toLocaleString('es-MX')}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Promedio top 20</span>
                <span className="stat-value">
                  ${(topSueldos.reduce((sum, p) => sum + parseFloat(p.sueldoAcumulado), 0) / topSueldos.length).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </>
          )}
          {activeTab === 'bottom' && bottomSueldos.length > 0 && (
            <>
              <div className="stat-item">
                <span className="stat-label">Sueldo más bajo</span>
                <span className="stat-value stat-highlight">
                  ${parseFloat(bottomSueldos[0]?.sueldoAcumulado || 0).toLocaleString('es-MX')}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Promedio bottom 20</span>
                <span className="stat-value">
                  ${(bottomSueldos.reduce((sum, p) => sum + parseFloat(p.sueldoAcumulado), 0) / bottomSueldos.length).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* List */}
      <div className="analytics-list">
        {currentData.map((profesor, index) => (
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
              
              <div className="analytics-salary-grid">
                <div className="salary-box salary-main">
                  <span className="salary-label">Sueldo Acumulado</span>
                  <span className="salary-value">
                    ${parseFloat(profesor.sueldoAcumulado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="salary-box">
                  <span className="salary-label">Sueldo Máximo</span>
                  <span className="salary-value">
                    ${parseFloat(profesor.sueldoMaximo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="salary-box">
                  <span className="salary-label">Último Sueldo</span>
                  <span className="salary-value">
                    ${parseFloat(profesor.ultimoSueldo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {profesor.totalVistas > 0 && (
                <div className="analytics-views">
                  <svg className="views-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>{profesor.totalVistas} vistas</span>
                </div>
              )}

              <div className="card-action">
                <span className="action-text">Ver detalles</span>
                <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RankingSueldos;
