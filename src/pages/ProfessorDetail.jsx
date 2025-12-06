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

  // Paginación del servidor para listas de personas relacionadas
  const [lastNamePaginador, setLastNamePaginador] = useState(null);
  const [institutionPaginador, setInstitutionPaginador] = useState(null);

  // Estados para almacenar información necesaria para paginación
  const [professorRelationData, setProfessorRelationData] = useState(null);

  // Cache de datos completos para paginación rápida
  const [lastNameFullData, setLastNameFullData] = useState([]);
  const [institutionFullData, setInstitutionFullData] = useState([]);

  // Estados para búsqueda por texto
  const [lastNameSearchText, setLastNameSearchText] = useState('');
  const [institutionSearchText, setInstitutionSearchText] = useState('');

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

  // Limpiar cache cuando cambia el profesor
  useEffect(() => {
    setLastNameFullData([]);
    setInstitutionFullData([]);
    setLastNameSearchText('');
    setInstitutionSearchText('');
  }, [professorId]);

  // Debounced search para apellidos
  useEffect(() => {
    if (!professorRelationData) return;

    const timeoutId = setTimeout(() => {
      // Limpiar cache cuando cambia el texto de búsqueda
      setLastNameFullData([]);
      fetchLastNamePeople(
        professorRelationData.apellidoPaterno,
        professorRelationData.apellidoMaterno,
        professorRelationData.excludeProfessorId,
        0,
        lastNameSearchText
      );
    }, 500); // 500ms de debounce

    return () => clearTimeout(timeoutId);
  }, [lastNameSearchText]);

  // Debounced search para institución
  useEffect(() => {
    if (!professorRelationData) return;

    const timeoutId = setTimeout(() => {
      // Limpiar cache cuando cambia el texto de búsqueda
      setInstitutionFullData([]);
      fetchInstitutionPeople(
        professorRelationData.identificadorGrupo,
        professorRelationData.idEntidadFederativa,
        professorRelationData.sujetoObligado,
        professorRelationData.excludeProfessorId,
        0,
        institutionSearchText
      );
    }, 500); // 500ms de debounce

    return () => clearTimeout(timeoutId);
  }, [institutionSearchText]);

  const fetchRelatedPeople = async (professor, data) => {
    setLoadingRelations(true);
    try {
      // Extraer apellidos del nombre completo
      const nombrePartes = professor.nombre.trim().split(' ');
      const apellidoPaterno = nombrePartes.length > 2 ? nombrePartes[nombrePartes.length - 2] : '';
      const apellidoMaterno = nombrePartes.length > 2 ? nombrePartes[nombrePartes.length - 1] : '';

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

      // Guardar información para paginación posterior
      setProfessorRelationData({
        apellidoPaterno,
        apellidoMaterno,
        identificadorGrupo,
        idEntidadFederativa,
        sujetoObligado: professor.sujetoObligado,
        excludeProfessorId: professor.professorId
      });

      // Buscar personas con mismo apellido (página 0)
      if (apellidoPaterno) {
        await fetchLastNamePeople(apellidoPaterno, apellidoMaterno, professor.professorId, 0);
      }

      // Buscar personas de la misma institución (página 0)
      if (identificadorGrupo) {
        await fetchInstitutionPeople(identificadorGrupo, idEntidadFederativa, professor.sujetoObligado, professor.professorId, 0);
      } else {
        console.warn('⚠️ No se puede buscar por institución sin identificadorGrupo');
      }
    } catch (error) {
      console.error('❌ Error al cargar personas relacionadas:', error);
    } finally {
      setLoadingRelations(false);
    }
  };

  // Función para buscar personas por apellido con paginación progresiva
  const fetchLastNamePeople = async (apellidoPaterno, apellidoMaterno, excludeProfessorId, numeroPagina, searchText = '') => {
    try {
      // Si hay búsqueda activa o no hay cache, limpiar cache y hacer búsqueda nueva
      if (searchText || lastNameFullData.length === 0) {
        // Decidir cuántos registros traer según la página solicitada
        const maxRecords = numeroPagina >= 2 ? 5000 : 200; // Página 3+ (índice 2+) = traer todos
        console.log(`🔍 Trayendo ${maxRecords} registros máximo para página ${numeroPagina + 1}`);

        const resultApellidos = await apiClient.buscarPorApellido({
          apellidoPaterno,
          apellidoMaterno,
          excludeProfessorId,
          numeroPagina: 0, // Siempre empezar desde 0
          fetchAll: false,
          maxRecords,
          searchText
        });

        if (resultApellidos.success && resultApellidos.data) {
          // Si trajimos todos los datos (página 3+) y NO hay búsqueda, cachear
          if (maxRecords === 5000 && !resultApellidos.paginador.hasMore && !searchText) {
            console.log('💾 Cacheando todos los datos de apellidos');
            setLastNameFullData(resultApellidos.data);
          }

          // Paginar localmente
          const cantidadPorPagina = 10;
          const inicio = numeroPagina * cantidadPorPagina;
          const fin = inicio + cantidadPorPagina;
          const datosPaginados = resultApellidos.data.slice(inicio, fin);

          setSameLastNamePeople(datosPaginados);
          setLastNamePaginador({
            numeroPaginas: Math.ceil(resultApellidos.data.length / cantidadPorPagina),
            cantidadPagina: cantidadPorPagina,
            total: resultApellidos.data.length,
            paginaActual: numeroPagina,
            cantidadElementos: datosPaginados.length,
            hasMore: resultApellidos.paginador.hasMore,
            totalEnServidor: resultApellidos.paginador.totalEnServidor,
            paginasEnServidor: resultApellidos.paginador.paginasEnServidor
          });
        }
        return;
      }

      // Si ya tenemos cache completo y NO hay búsqueda, paginar localmente
      if (lastNameFullData.length > 0 && !searchText) {
        console.log('📦 Usando cache local para apellidos');
        const cantidadPorPagina = 10;
        const inicio = numeroPagina * cantidadPorPagina;
        const fin = inicio + cantidadPorPagina;
        const datosPaginados = lastNameFullData.slice(inicio, fin);

        setSameLastNamePeople(datosPaginados);
        setLastNamePaginador({
          numeroPaginas: Math.ceil(lastNameFullData.length / cantidadPorPagina),
          cantidadPagina: cantidadPorPagina,
          total: lastNameFullData.length,
          paginaActual: numeroPagina,
          cantidadElementos: datosPaginados.length,
          hasMore: false,
          totalEnServidor: lastNameFullData.length, // Cuando usamos cache, es el total completo
          paginasEnServidor: Math.ceil(lastNameFullData.length / cantidadPorPagina)
        });
        return;
      }

    } catch (error) {
      console.error('❌ Error al buscar personas por apellido:', error);
    }
  };

  // Función para buscar personas de la misma institución con paginación progresiva
  const fetchInstitutionPeople = async (identificadorGrupo, idEntidadFederativa, sujetoObligado, excludeProfessorId, numeroPagina, searchText = '') => {
    try {
      // Si hay búsqueda activa o no hay cache, limpiar cache y hacer búsqueda nueva
      if (searchText || institutionFullData.length === 0) {
        // Decidir cuántos registros traer según la página solicitada
        const maxRecords = numeroPagina >= 2 ? 5000 : 200; // Página 3+ (índice 2+) = traer todos
        console.log(`🔍 Trayendo ${maxRecords} registros máximo para página ${numeroPagina + 1}`);

        const resultInstitucion = await apiClient.buscarPorInstitucion({
          identificadorGrupo,
          idEntidadFederativa,
          sujetoObligado,
          excludeProfessorId,
          numeroPagina: 0, // Siempre empezar desde 0
          fetchAll: false,
          maxRecords,
          searchText
        });

        if (resultInstitucion.success && resultInstitucion.data) {
          // Si trajimos todos los datos (página 3+) y NO hay búsqueda, cachear
          if (maxRecords === 5000 && !resultInstitucion.paginador.hasMore && !searchText) {
            console.log('💾 Cacheando todos los datos de institución');
            setInstitutionFullData(resultInstitucion.data);
          }

          // Paginar localmente
          const cantidadPorPagina = 10;
          const inicio = numeroPagina * cantidadPorPagina;
          const fin = inicio + cantidadPorPagina;
          const datosPaginados = resultInstitucion.data.slice(inicio, fin);

          setSameInstitutionPeople(datosPaginados);
          setInstitutionPaginador({
            numeroPaginas: Math.ceil(resultInstitucion.data.length / cantidadPorPagina),
            cantidadPagina: cantidadPorPagina,
            total: resultInstitucion.data.length,
            paginaActual: numeroPagina,
            cantidadElementos: datosPaginados.length,
            hasMore: resultInstitucion.paginador.hasMore,
            totalEnServidor: resultInstitucion.paginador.totalEnServidor,
            paginasEnServidor: resultInstitucion.paginador.paginasEnServidor
          });
        }
        return;
      }

      // Si ya tenemos cache completo y NO hay búsqueda, paginar localmente
      if (institutionFullData.length > 0 && !searchText) {
        console.log('📦 Usando cache local para institución');
        const cantidadPorPagina = 10;
        const inicio = numeroPagina * cantidadPorPagina;
        const fin = inicio + cantidadPorPagina;
        const datosPaginados = institutionFullData.slice(inicio, fin);

        setSameInstitutionPeople(datosPaginados);
        setInstitutionPaginador({
          numeroPaginas: Math.ceil(institutionFullData.length / cantidadPorPagina),
          cantidadPagina: cantidadPorPagina,
          total: institutionFullData.length,
          paginaActual: numeroPagina,
          cantidadElementos: datosPaginados.length,
          hasMore: false,
          totalEnServidor: institutionFullData.length, // Cuando usamos cache, es el total completo
          paginasEnServidor: Math.ceil(institutionFullData.length / cantidadPorPagina)
        });
        return;
      }


    } catch (error) {
      console.error('❌ Error al buscar personas por institución:', error);
    }
  };

  // Handlers para cambio de página - lastname
  const handleLastNamePrevPage = () => {
    if (!professorRelationData || !lastNamePaginador || lastNamePaginador.paginaActual === 0) return;

    const newPage = lastNamePaginador.paginaActual - 1;
    fetchLastNamePeople(
      professorRelationData.apellidoPaterno,
      professorRelationData.apellidoMaterno,
      professorRelationData.excludeProfessorId,
      newPage,
      lastNameSearchText
    );
  };

  const handleLastNameNextPage = () => {
    if (!professorRelationData || !lastNamePaginador) return;

    // Calcular el total de páginas reales
    const totalPaginasReales = lastNamePaginador.totalEnServidor
      ? Math.ceil(lastNamePaginador.totalEnServidor / 10)
      : lastNamePaginador.numeroPaginas;

    if (lastNamePaginador.paginaActual >= totalPaginasReales - 1) return;

    const newPage = lastNamePaginador.paginaActual + 1;
    fetchLastNamePeople(
      professorRelationData.apellidoPaterno,
      professorRelationData.apellidoMaterno,
      professorRelationData.excludeProfessorId,
      newPage,
      lastNameSearchText
    );
  };

  // Handlers para cambio de página - institution
  const handleInstitutionPrevPage = () => {
    if (!professorRelationData || !institutionPaginador || institutionPaginador.paginaActual === 0) return;

    const newPage = institutionPaginador.paginaActual - 1;
    fetchInstitutionPeople(
      professorRelationData.identificadorGrupo,
      professorRelationData.idEntidadFederativa,
      professorRelationData.sujetoObligado,
      professorRelationData.excludeProfessorId,
      newPage,
      institutionSearchText
    );
  };

  const handleInstitutionNextPage = () => {
    if (!professorRelationData || !institutionPaginador) return;

    // Calcular el total de páginas reales
    const totalPaginasReales = institutionPaginador.totalEnServidor
      ? Math.ceil(institutionPaginador.totalEnServidor / 10)
      : institutionPaginador.numeroPaginas;

    if (institutionPaginador.paginaActual >= totalPaginasReales - 1) return;

    const newPage = institutionPaginador.paginaActual + 1;
    fetchInstitutionPeople(
      professorRelationData.identificadorGrupo,
      professorRelationData.idEntidadFederativa,
      professorRelationData.sujetoObligado,
      professorRelationData.excludeProfessorId,
      newPage,
      institutionSearchText
    );
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

  // Helper para resaltar apellidos con gradiente cuando hay match exacto
  const highlightMatchingLastNames = (fullName, matchExacto) => {
    if (!matchExacto || !professorData) return fullName;

    // Extraer apellidos del profesor actual
    const nombrePartes = professorData.nombre.trim().split(' ');
    const apellidoPaterno = nombrePartes.length > 2 ? nombrePartes[nombrePartes.length - 2] : '';
    const apellidoMaterno = nombrePartes.length > 2 ? nombrePartes[nombrePartes.length - 1] : '';

    if (!apellidoPaterno) return fullName;

    // Crear patrón para encontrar los apellidos en el nombre
    const parts = fullName.split(' ');

    return (
      <span>
        {parts.map((part, index) => {
          const isMatchingLastName = (
            part.toLowerCase() === apellidoPaterno.toLowerCase() ||
            (apellidoMaterno && part.toLowerCase() === apellidoMaterno.toLowerCase())
          );

          if (isMatchingLastName) {
            return (
              <span
                key={index}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700
                }}
              >
                {part}{index < parts.length - 1 ? ' ' : ''}
              </span>
            );
          }
          return <span key={index}>{part}{index < parts.length - 1 ? ' ' : ''}</span>;
        })}
      </span>
    );
  };

  // Ya no necesitamos cálculos de paginación local
  // Los datos ya vienen paginados del servidor

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
                {/* Search input for institution */}
                <div style={{
                  marginBottom: '1rem',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      width: '1rem',
                      height: '1rem',
                      color: '#9ca3af',
                      pointerEvents: 'none'
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={institutionSearchText}
                    onChange={(e) => setInstitutionSearchText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  {institutionSearchText && (
                    <button
                      onClick={() => setInstitutionSearchText('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>

                {loadingRelations ? (
                  <div className="related-people-empty">Cargando...</div>
                ) : sameInstitutionPeople.length > 0 ? (
                  <>
                    {institutionPaginador && (
                      <div style={{ marginBottom: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        Mostrando {institutionPaginador.paginaActual * institutionPaginador.cantidadPagina + 1}-{institutionPaginador.paginaActual * institutionPaginador.cantidadPagina + institutionPaginador.cantidadElementos} de {institutionPaginador.totalEnServidor || institutionPaginador.total} personas
                      </div>
                    )}
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
                    {institutionPaginador && institutionPaginador.numeroPaginas > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem'
                      }}>
                        <button
                          onClick={handleInstitutionPrevPage}
                          disabled={institutionPaginador.paginaActual === 0}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: institutionPaginador.paginaActual === 0 ? '#e5e7eb' : '#2563eb',
                            color: institutionPaginador.paginaActual === 0 ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: institutionPaginador.paginaActual === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          Anterior
                        </button>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Página {institutionPaginador.paginaActual + 1} de {institutionPaginador.totalEnServidor ? Math.ceil(institutionPaginador.totalEnServidor / 10) : institutionPaginador.numeroPaginas}
                        </span>
                        <button
                          onClick={handleInstitutionNextPage}
                          disabled={institutionPaginador.paginaActual === (institutionPaginador.totalEnServidor ? Math.ceil(institutionPaginador.totalEnServidor / 10) : institutionPaginador.numeroPaginas) - 1}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: institutionPaginador.paginaActual === (institutionPaginador.totalEnServidor ? Math.ceil(institutionPaginador.totalEnServidor / 10) : institutionPaginador.numeroPaginas) - 1 ? '#e5e7eb' : '#2563eb',
                            color: institutionPaginador.paginaActual === (institutionPaginador.totalEnServidor ? Math.ceil(institutionPaginador.totalEnServidor / 10) : institutionPaginador.numeroPaginas) - 1 ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: institutionPaginador.paginaActual === (institutionPaginador.totalEnServidor ? Math.ceil(institutionPaginador.totalEnServidor / 10) : institutionPaginador.numeroPaginas) - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="related-people-empty">No se encontraron personas de la misma institución</div>
                )}
              </div>
            )}

            {activeTab === 'lastname' && (
              <div className="detail-lastname-tab">
                {/* Search input for lastname */}
                <div style={{
                  marginBottom: '1rem',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      width: '1rem',
                      height: '1rem',
                      color: '#9ca3af',
                      pointerEvents: 'none'
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={lastNameSearchText}
                    onChange={(e) => setLastNameSearchText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  {lastNameSearchText && (
                    <button
                      onClick={() => setLastNameSearchText('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>

                {loadingRelations ? (
                  <div className="related-people-empty">Cargando...</div>
                ) : sameLastNamePeople.length > 0 ? (
                  <>
                    {lastNamePaginador && (
                      <div style={{ marginBottom: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        Mostrando {lastNamePaginador.paginaActual * lastNamePaginador.cantidadPagina + 1}-{lastNamePaginador.paginaActual * lastNamePaginador.cantidadPagina + lastNamePaginador.cantidadElementos} de {lastNamePaginador.totalEnServidor || lastNamePaginador.total} personas
                      </div>
                    )}
                    <div className="related-people-list">
                      {sameLastNamePeople.map((person, index) => (
                        <Link
                          key={index}
                          to={`/profesor/${person.professorId}/${encodeURIComponent(person.nombre)}`}
                          className="related-people-item"
                          style={{
                            border: person.matchExacto ? '1px solid #fbbf24' : '1px solid transparent',
                            backgroundColor: person.matchExacto ? '#fffbeb' : '#f9fafb'
                          }}
                        >
                          <div className="related-people-info">
                            <div className="related-people-name">
                              {highlightMatchingLastNames(person.nombre, person.matchExacto)}
                            </div>
                            <div className="related-people-institution">{person.entidadFederativa}</div>
                          </div>
                          <div className="related-people-salary">{person.sueldoActual}</div>
                        </Link>
                      ))}
                    </div>
                    {lastNamePaginador && lastNamePaginador.numeroPaginas > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem'
                      }}>
                        <button
                          onClick={handleLastNamePrevPage}
                          disabled={lastNamePaginador.paginaActual === 0}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: lastNamePaginador.paginaActual === 0 ? '#e5e7eb' : '#2563eb',
                            color: lastNamePaginador.paginaActual === 0 ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: lastNamePaginador.paginaActual === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          Anterior
                        </button>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Página {lastNamePaginador.paginaActual + 1} de {lastNamePaginador.totalEnServidor ? Math.ceil(lastNamePaginador.totalEnServidor / 10) : lastNamePaginador.numeroPaginas}
                        </span>
                        <button
                          onClick={handleLastNameNextPage}
                          disabled={lastNamePaginador.paginaActual === (lastNamePaginador.totalEnServidor ? Math.ceil(lastNamePaginador.totalEnServidor / 10) : lastNamePaginador.numeroPaginas) - 1}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: lastNamePaginador.paginaActual === (lastNamePaginador.totalEnServidor ? Math.ceil(lastNamePaginador.totalEnServidor / 10) : lastNamePaginador.numeroPaginas) - 1 ? '#e5e7eb' : '#2563eb',
                            color: lastNamePaginador.paginaActual === (lastNamePaginador.totalEnServidor ? Math.ceil(lastNamePaginador.totalEnServidor / 10) : lastNamePaginador.numeroPaginas) - 1 ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: lastNamePaginador.paginaActual === (lastNamePaginador.totalEnServidor ? Math.ceil(lastNamePaginador.totalEnServidor / 10) : lastNamePaginador.numeroPaginas) - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
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
