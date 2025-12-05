import { useState, useEffect } from 'react';
import { FiBarChart2, FiChevronRight, FiUsers, FiEye, FiClock } from 'react-icons/fi';
import { MdOutlineCookie } from 'react-icons/md';
import { apiClient } from '../services/apiClient';

function DashboardAnalytics() {
  const [summaryStats, setSummaryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedUtm, setExpandedUtm] = useState(null);
  const [utmUsers, setUtmUsers] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUtmAnalyticsSummary();
      setSummaryStats(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar analytics:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const toggleUtmExpand = async (utmSource) => {
    if (expandedUtm === utmSource) {
      setExpandedUtm(null);
      return;
    }

    setExpandedUtm(utmSource);

    // Si ya tenemos los datos, no volver a cargar
    if (utmUsers[utmSource]) {
      return;
    }

    // Cargar usuarios para este UTM
    try {
      setLoadingUsers(true);
      const response = await apiClient.getUsersByUtmSource(utmSource);
      setUtmUsers(prev => ({
        ...prev,
        [utmSource]: response.data || []
      }));
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const calculateConversionRate = (usersWithQueries, totalUsers) => {
    if (totalUsers === 0) return 0;
    return ((usersWithQueries / totalUsers) * 100).toFixed(1);
  };

  const calculateClickThroughRate = (clicks, views) => {
    if (views === 0) return 0;
    return ((clicks / views) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>Cargando estadísticas...</div>
      </div>
    );
  }

  // Calcular totales
  const totals = summaryStats.reduce((acc, stat) => ({
    totalUsers: acc.totalUsers + parseInt(stat.total_users || 0),
    totalQueries: acc.totalQueries + parseInt(stat.total_queries || 0),
    totalViews: acc.totalViews + parseInt(stat.landing_views || 0),
    totalClicks: acc.totalClicks + parseInt(stat.landing_clicks || 0),
    totalProfesorViews: acc.totalProfesorViews + parseInt(stat.total_profesor_views || 0)
  }), { totalUsers: 0, totalQueries: 0, totalViews: 0, totalClicks: 0, totalProfesorViews: 0 });

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.875rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FiBarChart2 size={isMobile ? 24 : 28} />
          Analytics de UTM
        </h2>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Estadísticas de usuarios segmentados por origen UTM
        </p>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Tarjetas de resumen global */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Usuarios</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {totals.totalUsers.toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #10b981'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Consultas</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {totals.totalQueries.toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #f59e0b'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Vistas Landing</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {totals.totalViews.toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Clicks Landing</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {totals.totalClicks.toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '2px solid #ec4899'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Vistas de Profesores</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
            {totals.totalProfesorViews.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabla de estadísticas por UTM */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: isMobile ? '0.5rem' : '0' }}>
            Estadísticas por Fuente UTM
          </h3>
          {isMobile && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FiChevronRight size={14} />
              Desliza horizontalmente para ver todas las columnas
            </p>
          )}
        </div>

        {summaryStats.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              No hay datos disponibles aún
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? '800px' : 'auto'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: 600, color: '#374151', width: '40px' }}>

                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    UTM Source
                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                    Usuarios
                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                    Consultas
                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                    Conversión
                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                    Vistas Landing
                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                    Clicks Landing
                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                    CTR
                  </th>
                  <th style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                    Vistas Profesores
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaryStats.map((stat, index) => {
                  const conversionRate = calculateConversionRate(
                    parseInt(stat.users_with_queries || 0),
                    parseInt(stat.total_users || 0)
                  );
                  const ctr = calculateClickThroughRate(
                    parseInt(stat.landing_clicks || 0),
                    parseInt(stat.landing_views || 0)
                  );
                  const isExpanded = expandedUtm === stat.utm_source;
                  const users = utmUsers[stat.utm_source] || [];

                  return (
                    <>
                      <tr
                        key={index}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'background-color 0.2s',
                          backgroundColor: isExpanded ? '#f9fafb' : 'white'
                        }}
                      >
                        <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem' }}>
                          <button
                            onClick={() => toggleUtmExpand(stat.utm_source)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#3b82f6',
                              fontSize: isMobile ? '1rem' : '1.25rem',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                            title="Ver usuarios"
                          >
                            ▶
                          </button>
                        </td>
                        <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', fontWeight: 500, color: '#1f2937', fontFamily: 'monospace' }}>
                          {stat.utm_source}
                        </td>
                        <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', color: '#4b5563' }}>
                          {parseInt(stat.total_users || 0).toLocaleString()}
                        </td>
                      <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', color: '#4b5563' }}>
                        {parseInt(stat.total_queries || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right' }}>
                        <span style={{
                          padding: isMobile ? '0.2rem 0.4rem' : '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: conversionRate >= 50 ? '#d1fae5' : conversionRate >= 25 ? '#fef3c7' : '#fee2e2',
                          color: conversionRate >= 50 ? '#065f46' : conversionRate >= 25 ? '#92400e' : '#991b1b',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          {conversionRate}%
                        </span>
                      </td>
                      <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', color: '#4b5563' }}>
                        {parseInt(stat.landing_views || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', color: '#4b5563' }}>
                        {parseInt(stat.landing_clicks || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right' }}>
                        <span style={{
                          padding: isMobile ? '0.2rem 0.4rem' : '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: ctr >= 10 ? '#ddd6fe' : ctr >= 5 ? '#fef3c7' : '#fee2e2',
                          color: ctr >= 10 ? '#5b21b6' : ctr >= 5 ? '#92400e' : '#991b1b',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          {ctr}%
                        </span>
                      </td>
                      <td style={{ padding: isMobile ? '0.75rem 0.5rem' : '1rem', textAlign: 'right', color: '#4b5563' }}>
                        {parseInt(stat.total_profesor_views || 0).toLocaleString()}
                      </td>
                    </tr>

                    {/* Expanded row showing user details */}
                    {isExpanded && (
                      <tr key={`${index}-expanded`}>
                        <td colSpan="9" style={{
                          padding: '0',
                          backgroundColor: '#f9fafb',
                          borderBottom: '2px solid #e5e7eb'
                        }}>
                          <div style={{ padding: '1.5rem' }}>
                            {loadingUsers ? (
                              <div style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: '#6b7280',
                                fontSize: '0.875rem'
                              }}>
                                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                  <FiClock size={16} />
                                  Cargando usuarios...
                                </div>
                              </div>
                            ) : users.length === 0 ? (
                              <div style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: '#6b7280',
                                fontSize: '0.875rem'
                              }}>
                                No hay usuarios registrados para este UTM
                              </div>
                            ) : (
                              <>
                                <div style={{
                                  marginBottom: '1rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <FiUsers size={16} />
                                  Usuarios ({users.length})
                                </div>

                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
                                  gap: '1rem'
                                }}>
                                  {users.map((user) => (
                                    <div
                                      key={user.sid}
                                      style={{
                                        backgroundColor: 'white',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.75rem'
                                      }}
                                    >
                                      <div style={{ marginBottom: '0.75rem' }}>
                                        <div style={{
                                          color: '#6b7280',
                                          marginBottom: '0.25rem',
                                          fontSize: '0.7rem',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.5px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem'
                                        }}>
                                          <MdOutlineCookie size={12} />
                                          Cookie (SID)
                                        </div>
                                        <div style={{
                                          fontFamily: 'monospace',
                                          color: '#1f2937',
                                          fontSize: '0.7rem',
                                          wordBreak: 'break-all',
                                          backgroundColor: '#f3f4f6',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '0.25rem'
                                        }}>
                                          {user.sid}
                                        </div>
                                      </div>

                                      <div style={{
                                        display: 'grid',
                                        gap: '0.5rem',
                                        color: '#4b5563'
                                      }}>
                                        <div>
                                          <strong style={{ color: '#374151' }}>IP:</strong> {user.ip_address || 'N/A'}
                                        </div>
                                        <div>
                                          <strong style={{ color: '#374151' }}>Primera visita:</strong>{' '}
                                          {new Date(user.first_seen).toLocaleString('es-MX', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>

                                        {user.utm_medium && (
                                          <div>
                                            <strong style={{ color: '#374151' }}>UTM Medium:</strong> {user.utm_medium}
                                          </div>
                                        )}

                                        {user.utm_campaign && (
                                          <div>
                                            <strong style={{ color: '#374151' }}>UTM Campaign:</strong> {user.utm_campaign}
                                          </div>
                                        )}

                                        <div style={{
                                          marginTop: '0.5rem',
                                          paddingTop: '0.5rem',
                                          borderTop: '1px solid #e5e7eb'
                                        }}>
                                          <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <FiBarChart2 size={12} style={{ color: '#374151' }} />
                                            <strong style={{ color: '#374151' }}>Consultas:</strong> {user.total_queries}
                                          </div>
                                          <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <FiEye size={12} style={{ color: '#374151' }} />
                                            <strong style={{ color: '#374151' }}>Vistas de profesores:</strong> {user.total_profesor_views}
                                          </div>
                                          {user.last_query && (
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                              Última consulta: {new Date(user.last_query).toLocaleString('es-MX', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </div>
                                          )}
                                          {user.last_view && (
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                              Última vista: {new Date(user.last_view).toLocaleString('es-MX', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </div>
                                          )}
                                        </div>

                                        {user.user_agent && (
                                          <div style={{
                                            marginTop: '0.5rem',
                                            paddingTop: '0.5rem',
                                            borderTop: '1px solid #e5e7eb',
                                            fontSize: '0.65rem',
                                            color: '#9ca3af'
                                          }}>
                                            <strong style={{ color: '#6b7280' }}>User Agent:</strong>
                                            <div style={{
                                              marginTop: '0.25rem',
                                              wordBreak: 'break-all'
                                            }}>
                                              {user.user_agent}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
          Definiciones
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '0.75rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div>
            <strong style={{ color: '#374151' }}>Usuarios:</strong> Total de usuarios únicos desde ese UTM
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Consultas:</strong> Total de búsquedas realizadas
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Conversión:</strong> % de usuarios que realizaron al menos una consulta
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Vistas Landing:</strong> Veces que se vio la página personalizada de ese UTM
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Clicks Landing:</strong> Clicks en el botón de la landing personalizada
          </div>
          <div>
            <strong style={{ color: '#374151' }}>CTR:</strong> Click Through Rate (Clicks / Vistas) del landing
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Vistas Profesores:</strong> Cards de profesores visualizados por usuarios de ese UTM
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAnalytics;
