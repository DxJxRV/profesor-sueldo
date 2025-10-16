import { useState, useEffect } from 'react';
import '../styles/Home2.css';
import '../components/AdSense.css';
import ProfessorModal from '../components/ProfessorModal';
import AdSense from '../components/AdSense';
import { apiClient } from '../services/apiClient';

function Home2() {
  const [professorName, setProfessorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [entidadesFederativas, setEntidadesFederativas] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);

  // Efecto para reinicializar anuncios cuando cambian los resultados
  useEffect(() => {
    if (showResults && results.length > 0) {
      // Esperar a que el DOM se actualice antes de ejecutar push
      setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        } catch (error) {
          console.error('Error loading ads:', error);
        }
      }, 100);
    }
  }, [results, showResults]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (professorName.trim()) {
      setLoading(true);
      // Resetear filtros al hacer una nueva búsqueda
      setSelectedEntidad(null);
      setIsFilterOpen(false);
      
      try {
        const data = await apiClient.consultarProfesores({
          contenido: professorName,
          cantidad: 200,
          numeroPagina: 0,
        });

        console.log("✅ Resultado:", data);
        setResults(data.datosSolr || []);
        setShowResults(true);
        setHasSearched(true);
        
        // Usar entidades federativas directamente del response
        if (data.entidadesFederativas && data.entidadesFederativas.length > 0) {
          console.log('🏛️ Entidades Federativas del API:', data.entidadesFederativas);
          setEntidadesFederativas(data.entidadesFederativas);
        }
        
      } catch (error) {
        console.error("❌ Error en la solicitud:", error);
        alert(`Error al buscar información: ${error.message}`);
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
    console.log("🔄 Ejecutando búsqueda filtrada por entidad:", entidad);
    setLoading(true);
    
    try {
      const data = await apiClient.consultarProfesores({
        contenido: professorName,
        cantidad: 200,
        numeroPagina: 0,
        entidadFederativa: entidad,
      });

      console.log("✅ Resultado filtrado:", data);
      setResults(data.datosSolr || []);
      setIsFilterOpen(false); // Colapsar filtros después de la búsqueda
      
    } catch (error) {
      console.error("❌ Error en la búsqueda filtrada:", error);
      alert(`Error al filtrar resultados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeOriginalSearch = async () => {
    setLoading(true);
    console.log('🔍 Ejecutando búsqueda original sin filtros');
    
    try {
      const data = await apiClient.consultarProfesores({
        contenido: professorName,
        cantidad: 100,
        numeroPagina: 0,
      });

      console.log("✅ Resultado original:", data);
      setResults(data.datosSolr || []);
      
    } catch (error) {
      console.error("❌ Error en la búsqueda original:", error);
      alert(`Error al ejecutar búsqueda: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (professorData) => {
    setSelectedProfessor(professorData);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProfessor(null);
  };

  return (
    <div className="home2-container">
      {/* Hero Section */}
      <div className="home2-hero">
        <div className="home2-hero-content">
          <h1 className="home2-title">¿Cuánto gana mi profesor?</h1>
          <p className="home2-subtitle">
            Consulta información salarial de profesores en<br />
            cualquier institución pública de México
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="home2-search-section">
        <div className="home2-search-card">
          <form onSubmit={handleSubmit}>
            {/* Search Input */}
            <div className="home2-input-group">
              <label className="home2-input-label">Nombre del profesor</label>
              <div className="home2-input-container">
                <svg className="home2-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="21 21l-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  placeholder="Ingresa el nombre completo del profesor..."
                  className="home2-search-input"
                />
              </div>
            </div>

            {/* Filter Dropdown - Solo aparece después de la primera búsqueda */}
            {hasSearched && entidadesFederativas.length > 0 && (
              <div className="home2-filter-group">
                <button 
                  type="button"
                  className="home2-filter-dropdown"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <span>Filtrar por estado {selectedEntidad && `(${selectedEntidad})`}</span>
                  <svg className={`home2-dropdown-arrow ${isFilterOpen ? 'home2-dropdown-open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                {/* Expanded Filter Options */}
                {isFilterOpen && (
                  <div className="home2-filter-options">
                    <div className="home2-states-grid">
                      {entidadesFederativas.map((entidad) => (
                        <label key={entidad} className="home2-state-option">
                          <input
                            type="radio"
                            name="entidadFederativa"
                            checked={selectedEntidad === entidad}
                            onChange={() => selectEntidadFederativa(entidad)}
                            className="home2-state-checkbox"
                          />
                          <span className="home2-state-label">{entidad}</span>
                        </label>
                      ))}
                      {/* Opción para limpiar filtro */}
                      {selectedEntidad && (
                        <label className="home2-state-option home2-clear-filter">
                          <input
                            type="radio"
                            name="entidadFederativa"
                            checked={selectedEntidad === null}
                            onChange={() => selectEntidadFederativa(null)}
                            className="home2-state-checkbox"
                          />
                          <span className="home2-state-label">Mostrar todos</span>
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search Button */}
            <button 
              type="submit" 
              className="home2-search-button"
              disabled={loading}
            >
              <svg className="home2-search-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="21 21l-4.35-4.35"></path>
              </svg>
              {loading ? "Buscando..." : "Buscar profesor"}
            </button>
          </form>
        </div>
      </div>

      {/* Results Section */}
      {showResults && (
        <div className="home2-results-section">
          <div className="home2-results-header">
            <h2 className="home2-results-title">
              Resultados encontrados <span className="home2-results-count">({results.length})</span>
            </h2>
          </div>

          <div className="home2-results-list">
            {results.map((result, index) => (
              <div key={index}>
                {/* Mostrar anuncio cada 3 resultados empezando en 0 */}
                {(index % 3 === 0) && (
                  <div className="home2-ad-label">
                    
                    <AdSense 
                      adSlot="2345678901"
                      className="adsense-container adsense-middle"
                      style={{ display: 'block', minHeight: '250px' }}
                    />

                  </div>
                )}
                
                <div className="home2-result-card" onClick={() => handleCardClick(result)}>
                <div className="home2-result-header">
                  <h3 className="home2-professor-name">{result.nombre}</h3>
                  <div className="home2-professor-info">
                    <div className="home2-info-item">
                      <svg className="home2-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className="home2-info-text">{result.sujetoObligado}</span>
                    </div>
                    <div className="home2-info-item">
                      <svg className="home2-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className="home2-info-text">{result.entidadFederativa}</span>
                    </div>
                  </div>
                </div>

                <div className="home2-salary-info">
                  <div className="home2-salary-item">
                    <div className="home2-salary-label">SUELDO ACTUAL</div>
                    <div className="home2-salary-value home2-salary-actual">{result.sueldoActual}</div>
                  </div>
                  <div className="home2-salary-item">
                    <div className="home2-salary-label">SUELDO MÁXIMO</div>
                    <div className="home2-salary-value home2-salary-max">
                      {result.sueldoMax.monto}
                      <svg className="home2-trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"></polyline>
                        <polyline points="17,6 23,6 23,12"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professor Modal */}
      <ProfessorModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        professorData={selectedProfessor}
      />

      {/* Anuncio al Final */}
      {showResults && (
        <AdSense 
          adSlot="3456789012"
          className="adsense-container adsense-bottom"
          style={{ display: 'block', minHeight: '250px' }}
        />
      )}
    </div>
  );
}

export default Home2;