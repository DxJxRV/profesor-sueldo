import { useState } from 'react';
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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Función para formatear el periodo a Mes-Año
const formatPeriodToMonthYear = (periodo) => {
  // Extraer la fecha de inicio del periodo "01/07/2024 - 31/07/2024"
  const startDate = periodo.split(' - ')[0];
  const [day, month, year] = startDate.split('/');
  
  const months = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  
  return `${months[month]}-${year}`;
};

// Función para convertir monto string a número
const parseMontoToNumber = (monto) => {
  return parseFloat(monto.replace(/[$,]/g, ''));
};

// Componente Modal para mostrar detalles del profesor
function ProfessorModal({ professor, isOpen, onClose }) {
  if (!isOpen || !professor) return null;

  // Preparar datos para la gráfica
  const chartData = professor.periodoMontos
    .map(item => ({
      periodo: item.periodo,
      label: formatPeriodToMonthYear(item.periodo),
      monto: parseMontoToNumber(item.monto),
      fecha: new Date(item.periodo.split(' - ')[0].split('/').reverse().join('-'))
    }))
    .sort((a, b) => a.fecha - b.fecha) // Ordenar por fecha
    .slice(-12); // Mostrar solo los últimos 12 meses

  const data = {
    labels: chartData.map(item => item.label),
    datasets: [
      {
        label: 'Sueldo Mensual',
        data: chartData.map(item => item.monto),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Evolución de Sueldos',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        callbacks: {
          label: function(context) {
            return `Sueldo: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          color: '#ffffff',
          callback: function(value, index, values) {
            return '$' + value.toLocaleString();
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#ffffff',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{professor.nombre}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <div className="modal-institution">
            <p>{professor.sujetoObligado}</p>
          </div>
          
          <div className="modal-salary-summary">
            <div className="modal-salary-item">
              <span className="modal-salary-label">Sueldo Actual:</span>
              <span className="modal-salary-value current">{professor.sueldoActual}</span>
            </div>
            <div className="modal-salary-item">
              <span className="modal-salary-label">Sueldo Máximo:</span>
              <span className="modal-salary-value max">{professor.sueldoMax.monto}</span>
            </div>
          </div>

          <div className="modal-chart-section">
            <div className="modal-chart-container">
              <Line data={data} options={options} />
            </div>
          </div>

          <div className="modal-max-info">
            <h3>Sueldo Máximo Registrado</h3>
            <p><strong>{professor.sueldoMax.monto}</strong> en el periodo {professor.sueldoMax.periodo}</p>
          </div>

          <div className="modal-history">
            <h3>Historial de Sueldos</h3>
            <div className="modal-periods-list">
              {professor.periodoMontos.slice(-6).map((periodo, index) => (
                <div key={index} className="modal-period-item">
                  <span className="modal-period-date">{formatPeriodToMonthYear(periodo.periodo)}</span>
                  <span className="modal-period-amount">{periodo.monto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar una card de profesor
function ProfessorCard({ professor }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="professor-result-card">
        {/* Primera fila: Nombre con icono de tres puntos */}
        <div className="professor-header-row">
          <h3 className="professor-name">{professor.nombre}</h3>
          <button 
            className="three-dots-btn"
            onClick={() => setShowModal(true)}
            title="Ver más detalles"
          >
            ⋯
          </button>
        </div>

        {/* Segunda fila: Sueldos */}
        <div className="salary-row">
          <div className="salary-item">
            <span className="salary-label">Sueldo Actual:</span>
            <span className="salary-value current">{professor.sueldoActual}</span>
          </div>
          <div className="salary-item">
            <span className="salary-label">Sueldo Máximo:</span>
            <span className="salary-value max">{professor.sueldoMax.monto}</span>
          </div>
        </div>

        {/* Tercera fila: Sujeto obligado */}
        <div className="subject-row">
          <p className="subject-obligado">{professor.sujetoObligado}</p>
        </div>
      </div>

      <ProfessorModal 
        professor={professor}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

function Home() {
  const [professorName, setProfessorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [entidadesFederativas, setEntidadesFederativas] = useState([]);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (professorName.trim()) {
      setLoading(true);
      console.log('🔍 Buscando información del profesor:', professorName);
      
      try {
        const resp = await fetch("http://192.168.100.67:3001/api/consulta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contenido: professorName,
            cantidad: 100,
            numeroPagina: 0,
            coleccion: "SUELDOS",
            dePaginador: false,
            idCompartido: "",
            filtroSeleccionado: "",
            tipoOrdenamiento: "COINCIDENCIA",
            sujetosObligados: { seleccion: [], descartado: [] },
            organosGarantes: { seleccion: [], descartado: [] },
            anioFechaInicio: { seleccion: [], descartado: [] }
          })
        });

        if (!resp.ok) {
          const msg = await resp.text();
          throw new Error(`Proxy ${resp.status}: ${msg}`);
        }

        const data = await resp.json();
        console.log("✅ Resultado:", data);
        setResults(data.datosSolr || []);
        setEntidadesFederativas(data.entidadesFederativas || []);
        setShowResults(true);
        
      } catch (error) {
        console.error("❌ Error en la solicitud:", error);
        alert(`Error al buscar información: `);
        setResults([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const selectEntidadFederativa = async (entidad) => {
    const newSelectedEntidad = selectedEntidad === entidad ? null : entidad;
    setSelectedEntidad(newSelectedEntidad);
    
    // Si se selecciona una entidad, ejecutar búsqueda automáticamente
    if (newSelectedEntidad) {
      await executeFilteredSearch(newSelectedEntidad);
    } else {
      // Si se deselecciona, ejecutar búsqueda sin filtro
      await executeOriginalSearch();
    }
  };

  const executeFilteredSearch = async (entidad) => {
    setLoading(true);
    console.log('🔍 Buscando con filtro de entidad federativa:', entidad);
    
    try {
      const resp = await fetch("http://192.168.100.67:3001/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: professorName,
          cantidad: 20,
          numeroPagina: 0,
          coleccion: "SUELDOS",
          dePaginador: false,
          idCompartido: "",
          filtroSeleccionado: "",
          tipoOrdenamiento: "COINCIDENCIA",
          entidadFederativa: entidad,
          sujetosObligados: { seleccion: [], descartado: [] },
          organosGarantes: { seleccion: [], descartado: [] },
          anioFechaInicio: { seleccion: [], descartado: [] }
        })
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(`Proxy ${resp.status}: ${msg}`);
      }

      const data = await resp.json();
      console.log("✅ Resultado filtrado:", data);
      setResults(data.datosSolr || []);
      setFiltersCollapsed(true); // Colapsar filtros después de la búsqueda
      
    } catch (error) {
      console.error("❌ Error en la búsqueda filtrada:", error);
      alert(`Error al filtrar resultados: `);
    } finally {
      setLoading(false);
    }
  };

  const executeOriginalSearch = async () => {
    setLoading(true);
    console.log('🔍 Ejecutando búsqueda original sin filtros');
    
    try {
      const resp = await fetch("http://192.168.100.67:3001/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: professorName,
          cantidad: 20,
          numeroPagina: 0,
          coleccion: "SUELDOS",
          dePaginador: false,
          idCompartido: "",
          filtroSeleccionado: "",
          tipoOrdenamiento: "COINCIDENCIA",
          sujetosObligados: { seleccion: [], descartado: [] },
          organosGarantes: { seleccion: [], descartado: [] },
          anioFechaInicio: { seleccion: [], descartado: [] }
        })
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(`Proxy ${resp.status}: ${msg}`);
      }

      const data = await resp.json();
      console.log("✅ Resultado original:", data);
      setResults(data.datosSolr || []);
      setEntidadesFederativas(data.entidadesFederativas || []);
      setFiltersCollapsed(false); // Mostrar filtros al volver a la búsqueda original
      
    } catch (error) {
      console.error("❌ Error en la búsqueda original:", error);
      alert(`Error al buscar información: `);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="professor-card">
        <h1>¿Cuánto gana mi profesor?</h1>
        <form onSubmit={handleSubmit} className="professor-form">
          <div className="input-group">
            <label htmlFor="professorName">Nombre del profesor:</label>
            <input
              type="text"
              id="professorName"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              placeholder="Ingresa el nombre del profesor..."
              className="professor-input"
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? '🔍 Buscando...' : 'Buscar sueldo'}
          </button>
        </form>

        {showResults && (
          <div className="results-section">
            {entidadesFederativas.length > 0 && (
              <div className="filters-section">
                <div className="filters-header">
                  <h3>Filtrar por Entidad Federativa:</h3>
                  <button 
                    className="collapse-btn"
                    onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                  >
                    {filtersCollapsed ? '▼ Mostrar filtros' : '▲ Ocultar filtros'}
                  </button>
                </div>
                
                {!filtersCollapsed && (
                  <>
                    <div className="sujetos-buttons">
                      {entidadesFederativas.map((entidad, index) => (
                        <button
                          key={index}
                          className={`sujeto-button ${selectedEntidad === entidad ? 'selected' : ''}`}
                          onClick={() => selectEntidadFederativa(entidad)}
                          disabled={loading}
                        >
                          <div className="sujeto-info">
                            <span className="sujeto-name">
                              {loading && selectedEntidad === entidad ? '🔄' : '🏛️'} {entidad}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedEntidad && (
                      <div className="filter-actions">
                        <button 
                          className="clear-filter-btn" 
                          onClick={async () => {
                            setSelectedEntidad(null);
                            await executeOriginalSearch();
                          }}
                          disabled={loading}
                        >
                          {loading ? '🔄 Cargando...' : 'Quitar filtro'}
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {filtersCollapsed && selectedEntidad && (
                  <div className="selected-filter-summary">
                    <span className="filter-summary-text">
                      🏛️ Filtrando por: <strong>{selectedEntidad}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <h2>Resultados encontrados: {results.length}</h2>
            {results.length > 0 ? (
              <div className="results-grid">
                {results.map((professor, index) => (
                  <ProfessorCard key={index} professor={professor} />
                ))}
              </div>
            ) : (
              <p className="no-results">No se encontraron resultados para "{professorName}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;