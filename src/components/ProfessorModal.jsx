import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
import AdSense from './AdSense';
import '../styles/ProfessorModal.css';
import './AdSense.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProfessorModal = ({ isOpen, onClose, professorData }) => {
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState('chart');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    if (professorData && professorData.periodoMontos) {
      console.log("Profesor data: ", professorData)
      // Procesar los datos para el gráfico
      const processedData = processPeriodData(professorData.periodoMontos, selectedYear);
      setChartData(processedData);
    }
  }, [professorData, selectedYear]);

  // Bloquear scroll del body cuando el modal esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: restaurar scroll cuando el componente se desmonte
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Registrar vista del profesor cuando se abre el modal
  useEffect(() => {
    if (isOpen && professorData) {
      logProfessorView(professorData);
    }
  }, [isOpen, professorData]);

  const logProfessorView = async (professor) => {
    try {
      // Calcular sueldo acumulado sumando todos los montos
      const sueldoAcumulado = professor.periodoMontos.reduce((total, periodo) => {
        const monto = parseFloat(periodo.monto.replace(/[$,]/g, ''));
        return total + monto;
      }, 0);

      // Convertir sueldoMaximo a número
      const sueldoMaximo = parseFloat(professor.sueldoMax.monto.replace(/[$,]/g, ''));

      // Convertir ultimoSueldo (sueldo actual) a número
      const ultimoSueldo = parseFloat(professor.sueldoActual.replace(/[$,]/g, ''));

      const result = await apiClient.registrarVistaProfesor({
        professorId: professor.professorId,
        nombreProfesor: professor.nombre,
        sujetoObligado: professor.sujetoObligado,
        entidadFederativa: professor.entidadFederativa,
        sueldoMaximo: sueldoMaximo,
        sueldoAcumulado: sueldoAcumulado,
        ultimoSueldo: ultimoSueldo
      });

      console.log('✅ Vista registrada:', result);
    } catch (error) {
      console.error('❌ Error al registrar vista del profesor:', error);
      // No mostramos el error al usuario para no interrumpir la experiencia
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
    
    return Array.from(years).sort((a, b) => b - a); // Más reciente primero
  };

  const processPeriodData = (periodoMontos, filterYear = 'all') => {
    // Filtrar por año si no es 'all'
    let filteredPeriodos = periodoMontos;
    if (filterYear !== 'all') {
      filteredPeriodos = periodoMontos.filter(periodo => {
        const startDate = periodo.periodo.split(' - ')[0];
        const [day, month, year] = startDate.split('/');
        return year === filterYear;
      });
    }

    // Agrupar por mes y sumar los montos
    const monthlyData = {};
    
    filteredPeriodos.forEach(periodo => {
      const startDate = periodo.periodo.split(' - ')[0];
      const [day, month, year] = startDate.split('/');
      const monthKey = `${month}/${year}`;
      
      // Convertir monto a número (remover $ y comas)
      const amount = parseFloat(periodo.monto.replace(/[$,]/g, ''));
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey] += amount;
      } else {
        monthlyData[monthKey] = amount;
      }
    });

    // Convertir a array y ordenar por fecha
    let sortedData = Object.entries(monthlyData)
      .map(([month, amount]) => ({ 
        month, 
        amount,
        sortDate: new Date(month.split('/')[1], month.split('/')[0] - 1) // Para ordenar
      }))
      .sort((a, b) => b.sortDate - a.sortDate); // Más reciente primero

    // Si es 'all', tomar solo los últimos 12 meses
    if (filterYear === 'all') {
      sortedData = sortedData.slice(0, 12);
    }

    // Ordenar cronológicamente y remover sortDate
    sortedData = sortedData
      .sort((a, b) => a.sortDate - b.sortDate) // Cronológico (más antiguo a más reciente)
      .map(({ month, amount }) => ({ month, amount })); // Remover sortDate

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
    
    // Extraer la fecha de inicio del período (formato: "01/01/2023 - 31/01/2023")
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

  if (!isOpen || !professorData) return null;

  const currentSalary = professorData.sueldoActual;
  const maxSalary = professorData.sueldoMax.monto;
  const maxSalaryPeriod = professorData.sueldoMax.periodo;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-professor-name">{professorData.nombre}</h2>
            <p className="modal-institution">{professorData.sujetoObligado}</p>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Anuncio en el modal */}
        <div className="modal-ad-container">
          <AdSense 
            adSlot="4567890123"
            adFormat="rectangle"
            style={{ display: 'block', width: '100%', maxWidth: '336px', height: '90px', margin: '0 auto' }}
          />
        </div>

        {/* Fixed Tabs Navigation */}
        <div className="modal-tabs-nav-fixed">
          <div className="modal-tabs-nav">
            <button
              className={`modal-tab-button ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <svg className="modal-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"></polyline>
                <polyline points="17,6 23,6 23,12"></polyline>
              </svg>
              Evolución de Sueldos
            </button>
            <button
              className={`modal-tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <svg className="modal-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Historial de Sueldos
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="modal-main-content">
          {/* Tab Content */}
          <div className="modal-tab-content">
            {activeTab === 'chart' && (
              <div className="modal-chart-tab">
                <div className="modal-chart-header">
                  <span className="modal-chart-period">
                    {selectedYear === 'all' ? 'Últimos 12 meses' : `Año ${selectedYear}`}
                  </span>
                  <select 
                    className="modal-year-filter"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="all">Últimos 12 meses</option>
                    {professorData && getAvailableYears(professorData.periodoMontos).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-chart-container">
                  {chartData.length > 0 && (
                    <Line data={getChartData()} options={chartOptions} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="modal-history-tab">
                <div className="modal-chart-header">
                  <span className="modal-chart-period">
                    {selectedYear === 'all' ? 'Últimos 12 meses' : `Año ${selectedYear}`}
                  </span>
                  <select 
                    className="modal-year-filter"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="all">Últimos 12 meses</option>
                    {professorData && getAvailableYears(professorData.periodoMontos).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-history-list">
                  {chartData.map((item, index) => (
                    <div key={index} className="modal-history-item">
                      <div className="modal-history-date">
                        <svg className="modal-calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {formatDate(item.month)}
                      </div>
                      <div className="modal-history-amount">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Salary Cards at Bottom */}
        <div className="modal-salary-cards-fixed">
          <div className="modal-salary-card">
            <div className="modal-salary-label">Sueldo Actual</div>
            <div className="modal-salary-amount modal-current">{currentSalary}</div>
            <div className="modal-salary-date">Septiembre 2024</div>
          </div>
          <div className="modal-salary-card">
            <div className="modal-salary-label">Sueldo Máximo</div>
            <div className="modal-salary-amount modal-maximum">{maxSalary}</div>
            <div className="modal-salary-date">{formatPeriodDate(maxSalaryPeriod)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorModal;