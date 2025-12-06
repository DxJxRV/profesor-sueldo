import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { apiClient } from '../services/apiClient';
import AdSense from '../components/AdSense';
import '../styles/ProfessorDetail.css';
import '../components/AdSense.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ProfessorDetail() {
  const { professorId, nombreCompleto } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [professorData, setProfessorData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('institution'); // Default to institution tab
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sameLastNamePeople, setSameLastNamePeople] = useState([]);
  const [sameInstitutionPeople, setSameInstitutionPeople] = useState([]);
  const [loadingRelations, setLoadingRelations] = useState(false);

  // Guardar el nombre de búsqueda que viene de Home2
  const searchName = location.state?.searchName;

  useEffect(() => {
    const fetchProfessorData = async () => {
      setLoading(true);
      try {
        // Buscar por nombre completo
        const data = await apiClient.consultarProfesores({
          contenido: nombreCompleto,
          cantidad: 200,
          numeroPagina: 0,
        });

        // Encontrar el profesor específico por ID
        const professor = data.datosSolr?.find(p => p.professorId === professorId);

        if (professor) {
          setProfessorData(professor);
          const processedData = processPeriodData(professor.periodoMontos, selectedYear);
          setChartData(processedData);

          // Registrar vista del profesor
          logProfessorView(professor);

          // Buscar personas relacionadas (pasamos data completo para obtener IDs)
          fetchRelatedPeople(professor, data);
        } else {
          console.error('Profesor no encontrado');
          navigate('/');
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del profesor:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessorData();
  }, [professorId, nombreCompleto, navigate]);

  useEffect(() => {
    if (professorData && professorData.periodoMontos) {
      const processedData = processPeriodData(professorData.periodoMontos, selectedYear);
      setChartData(processedData);
    }
  }, [selectedYear, professorData]);

  const fetchRelatedPeople = async (professor, data) => {
    setLoadingRelations(true);
    try {
      // Extraer apellidos del nombre completo
      const nombrePartes = professor.nombre.trim().split(' ');
      const apellidoPaterno = nombrePartes.length > 2 ? nombrePartes[nombrePartes.length - 2] : '';
      const apellidoMaterno = nombrePartes.length > 2 ? nombrePartes[nombrePartes.length - 1] : '';

      // Buscar personas con mismo apellido
      if (apellidoPaterno) {
        const resultApellidos = await apiClient.buscarPorApellido({
          apellidoPaterno,
          apellidoMaterno,
          excludeProfessorId: professor.professorId
        });

        if (resultApellidos.success && resultApellidos.data) {
          setSameLastNamePeople(resultApellidos.data);
        }
      }

      // Extraer identificadorGrupo de data.sujetosObligados
      let identificadorGrupo = null;
      let idEntidadFederativa = null;

      // Buscar la institución correspondiente en sujetosObligados
      if (data.sujetosObligados && Array.isArray(data.sujetosObligados)) {
        const institucion = data.sujetosObligados.find(s =>
          s.nombreGrupo && (
            s.nombreGrupo.includes(professor.sujetoObligado) ||
            professor.sujetoObligado.includes(s.nombreGrupo)
          )
        );

        if (institucion) {
          identificadorGrupo = institucion.identificadorGrupo;
          console.log('✅ Identificador de grupo encontrado:', identificadorGrupo);
        } else {
          console.warn('⚠️ No se encontró el identificadorGrupo para:', professor.sujetoObligado);
        }
      }

      // Extraer idEntidadFederativa si está disponible
      if (data.datosSolr && data.datosSolr[0] && data.datosSolr[0].identidadfederativa) {
        idEntidadFederativa = data.datosSolr[0].identidadfederativa;
        console.log('✅ ID Entidad Federativa encontrado:', idEntidadFederativa);
      }

      // Buscar personas de la misma institución solo si tenemos el identificadorGrupo
      if (identificadorGrupo) {
        const resultInstitucion = await apiClient.buscarPorInstitucion({
          identificadorGrupo,
          idEntidadFederativa,
          sujetoObligado: professor.sujetoObligado,
          excludeProfessorId: professor.professorId
        });

        if (resultInstitucion.success && resultInstitucion.data) {
          setSameInstitutionPeople(resultInstitucion.data);
        }
      } else {
        console.warn('⚠️ No se puede buscar por institución sin identificadorGrupo');
      }
    } catch (error) {
      console.error('❌ Error al cargar personas relacionadas:', error);
    } finally {
      setLoadingRelations(false);
    }
  };

  const logProfessorView = async (professor) => {
    try {
      const sueldoAcumulado = professor.periodoMontos.reduce((total, periodo) => {
        const monto = parseFloat(periodo.monto.replace(/[$,]/g, ''));
        return total + monto;
      }, 0);

      const sueldoMaximo = parseFloat(professor.sueldoMax.monto.replace(/[$,]/g, ''));
      const ultimoSueldo = parseFloat(professor.sueldoActual.replace(/[$,]/g, ''));

      await apiClient.registrarVistaProfesor({
        professorId: professor.professorId,
        nombreProfesor: professor.nombre,
        sujetoObligado: professor.sujetoObligado,
        entidadFederativa: professor.entidadFederativa,
        sueldoMaximo: sueldoMaximo,
        sueldoAcumulado: sueldoAcumulado,
        ultimoSueldo: ultimoSueldo
      });
    } catch (error) {
      console.error('❌ Error al registrar vista del profesor:', error);
    }
  };

  const getAvailableYears = (periodoMontos) => {
    if (!periodoMontos) return [];

    const years = new Set();
    periodoMontos.forEach(periodo => {
      const startDate = periodo.periodo.split(' - ')[0];
      const [day, month, year] = startDate.split('/');
      years.add(year);
    });

    return Array.from(years).sort((a, b) => b - a);
  };

  const processPeriodData = (periodoMontos, filterYear = 'all') => {
    let filteredPeriodos = periodoMontos;
    if (filterYear !== 'all') {
      filteredPeriodos = periodoMontos.filter(periodo => {
        const startDate = periodo.periodo.split(' - ')[0];
        const [day, month, year] = startDate.split('/');
        return year === filterYear;
      });
    }

    const monthlyData = {};

    filteredPeriodos.forEach(periodo => {
      const startDate = periodo.periodo.split(' - ')[0];
      const [day, month, year] = startDate.split('/');
      const monthKey = `${month}/${year}`;

      const amount = parseFloat(periodo.monto.replace(/[$,]/g, ''));

      if (monthlyData[monthKey]) {
        monthlyData[monthKey] += amount;
      } else {
        monthlyData[monthKey] = amount;
      }
    });

    let sortedData = Object.entries(monthlyData)
      .map(([month, amount]) => ({
        month,
        amount,
        sortDate: new Date(month.split('/')[1], month.split('/')[0] - 1)
      }))
      .sort((a, b) => b.sortDate - a.sortDate);

    if (filterYear === 'all') {
      sortedData = sortedData.slice(0, 12);
    }

    sortedData = sortedData
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ month, amount }) => ({ month, amount }));

    return sortedData;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (month) => {
    const [monthNum, year] = month.split('/');
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${monthNames[parseInt(monthNum) - 1]}-${year}`;
  };

  const formatPeriodDate = (period) => {
    if (!period) return '';

    const startDate = period.split(' - ')[0];
    const [day, month, year] = startDate.split('/');

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getChartData = () => {
    return {
      labels: chartData.map(item => formatDate(item.month)),
      datasets: [
        {
          label: 'Sueldo',
          data: chartData.map(item => item.amount),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          tension: 0.1,
          fill: false,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return formatCurrency(context.parsed.y);
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: '#f3f4f6',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          fontSize: 11,
        },
      },
      y: {
        grid: {
          color: '#f3f4f6',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          fontSize: 12,
          callback: function(value) {
            return '$' + (value / 1000).toFixed(0) + 'k';
          }
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="professor-detail-loading">
        <div className="loading-spinner">Cargando...</div>
      </div>
    );
  }

  if (!professorData) {
    return null;
  }

  const currentSalary = professorData.sueldoActual;
  const maxSalary = professorData.sueldoMax.monto;
  const maxSalaryPeriod = professorData.sueldoMax.periodo;

  return (
    <div className="professor-detail-page">
      <div className="professor-detail-container">
        {/* Dashboard Grid Layout */}
        <div className="dashboard-grid">
          {/* Header with integrated salaries */}
          <div className="detail-header">
            <button className="back-button" onClick={() => navigate('/', { state: { searchName } })}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Volver
            </button>
            <div className="detail-header-content">
              <div className="detail-title-section">
                <h1 className="detail-professor-name">{professorData.nombre}</h1>
                <p className="detail-institution">{professorData.sujetoObligado}</p>
                <p className="detail-location">{professorData.entidadFederativa}</p>
              </div>
              <div className="detail-header-salaries">
                <div className="detail-header-salary">
                  <span className="detail-header-salary-label">Actual</span>
                  <span className="detail-header-salary-amount current">{currentSalary}</span>
                </div>
                <div className="detail-header-salary">
                  <span className="detail-header-salary-label">Máximo</span>
                  <span className="detail-header-salary-amount maximum">{maxSalary}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation - Reordered: Institution, Lastname, Chart, History */}
          <div className="detail-tabs-nav">
            <button
              className={`detail-tab-button tab-institution ${activeTab === 'institution' ? 'active' : ''}`}
              onClick={() => setActiveTab('institution')}
            >
              <svg className="detail-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Misma Institución
            </button>
            <button
              className={`detail-tab-button ${activeTab === 'lastname' ? 'active' : ''}`}
              onClick={() => setActiveTab('lastname')}
            >
              <svg className="detail-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Mismo Apellido
            </button>
            <button
              className={`detail-tab-button ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <svg className="detail-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"></polyline>
                <polyline points="17,6 23,6 23,12"></polyline>
              </svg>
              Evolución
            </button>
            <button
              className={`detail-tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <svg className="detail-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Historial
            </button>
          </div>

          {/* Tab Content */}
          <div className="detail-tab-content">
            {activeTab === 'institution' && (
              <div className="detail-institution-tab">
                {loadingRelations ? (
                  <div className="related-people-empty">Cargando...</div>
                ) : sameInstitutionPeople.length > 0 ? (
                  <div className="related-people-list">
                    {sameInstitutionPeople.map((person, index) => (
                      <Link
                        key={index}
                        to={`/profesor/${person.professorId}/${encodeURIComponent(person.nombre)}`}
                        className="related-people-item"
                      >
                        <div className="related-people-info">
                          <div className="related-people-name">{person.nombre}</div>
                          <div className="related-people-institution">{person.entidadFederativa}</div>
                        </div>
                        <div className="related-people-salary">{person.sueldoActual}</div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="related-people-empty">No se encontraron personas de la misma institución</div>
                )}
              </div>
            )}

            {activeTab === 'lastname' && (
              <div className="detail-lastname-tab">
                {loadingRelations ? (
                  <div className="related-people-empty">Cargando...</div>
                ) : sameLastNamePeople.length > 0 ? (
                  <div className="related-people-list">
                    {sameLastNamePeople.map((person, index) => (
                      <Link
                        key={index}
                        to={`/profesor/${person.professorId}/${encodeURIComponent(person.nombre)}`}
                        className="related-people-item"
                      >
                        <div className="related-people-info">
                          <div className="related-people-name">{person.nombre}</div>
                          <div className="related-people-institution">{person.entidadFederativa}</div>
                        </div>
                        <div className="related-people-salary">{person.sueldoActual}</div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="related-people-empty">No se encontraron personas con el mismo apellido</div>
                )}
              </div>
            )}

            {activeTab === 'chart' && (
            <div className="detail-chart-tab">
              <div className="detail-chart-header">
                <span className="detail-chart-period">
                  {selectedYear === 'all' ? 'Últimos 12 meses' : `Año ${selectedYear}`}
                </span>
                <select
                  className="detail-year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Últimos 12 meses</option>
                  {professorData && getAvailableYears(professorData.periodoMontos).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="detail-chart-container">
                {chartData.length > 0 && (
                  <Line data={getChartData()} options={chartOptions} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="detail-history-tab">
              <div className="detail-chart-header">
                <span className="detail-chart-period">
                  {selectedYear === 'all' ? 'Últimos 12 meses' : `Año ${selectedYear}`}
                </span>
                <select
                  className="detail-year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Últimos 12 meses</option>
                  {professorData && getAvailableYears(professorData.periodoMontos).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="detail-history-list">
                {chartData.map((item, index) => (
                  <div key={index} className="detail-history-item">
                    <div className="detail-history-date">
                      <svg className="detail-calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {formatDate(item.month)}
                    </div>
                    <div className="detail-history-amount">{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Anuncio al final */}
          <div className="detail-ad-container">
            <AdSense
              adSlot="3456789012"
              className="adsense-container adsense-bottom"
              style={{ display: 'block', minHeight: '250px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessorDetail;
