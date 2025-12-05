import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';
import { getSeoMetadata, getSeoContent, slugify } from '../../utils/seoUtils';
import { apiClient } from '../../services/apiClient';
import '../../styles/Home2.css';

/**
 * Página SEO para profesiones específicas
 * Ejemplo: /cuanto-gana/maestro
 */
function ProfesionPage() {
  const { profesionSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [profesionData, setProfesionData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20;

  useEffect(() => {
    fetchProfesionData();
  }, [profesionSlug]);

  const fetchProfesionData = async () => {
    setLoading(true);
    try {
      // Convertir slug a término de búsqueda
      const termino = profesionSlug.replace(/-/g, ' ');

      // Buscar en la API
      const data = await apiClient.consultarProfesores({
        contenido: termino,
        cantidad: 200,
        numeroPagina: 0
      });

      setResults(data.datosSolr || []);

      // Calcular salario promedio
      const sueldos = data.datosSolr
        ?.map(r => parseFloat(r.sueldoActual?.replace(/[$,]/g, '') || 0))
        .filter(s => s > 0) || [];

      const salarioPromedio = sueldos.length > 0
        ? sueldos.reduce((a, b) => a + b, 0) / sueldos.length
        : null;

      setProfesionData({
        nombre: termino.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        slug: profesionSlug,
        salarioPromedio,
        totalResultados: data.datosSolr?.length || 0
      });
    } catch (error) {
      console.error('Error fetching profesion data:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    const encodedName = encodeURIComponent(result.nombre);
    navigate(`/profesor/${result.professorId}/${encodedName}`);
  };

  if (loading) {
    return (
      <div className="home2-container">
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!profesionData || results.length === 0) {
    return (
      <div className="home2-container">
        <SEOHead metadata={getSeoMetadata({ type: 'profesion', data: { nombre: profesionSlug, slug: profesionSlug } })} />
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h1>No se encontraron resultados para {profesionSlug}</h1>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const metadata = getSeoMetadata({ type: 'profesion', data: profesionData });
  const content = getSeoContent({ type: 'profesion', data: profesionData });

  // Paginación
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(results.length / resultsPerPage);

  return (
    <div className="home2-container">
      <SEOHead metadata={metadata} />

      {/* Hero Section - SEO Optimizado */}
      <div className="home2-hero">
        <div className="home2-hero-content">
          <h1 className="home2-title">{content.h1}</h1>
          <p className="home2-subtitle">{content.intro}</p>
        </div>
      </div>

      {/* Contenido SEO */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {content.sections.map((section, index) => (
          <div key={index} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {section.title}
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {section.content}
            </p>
          </div>
        ))}

        {/* Estadísticas */}
        <div style={{
          background: '#f3f4f6',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Estadísticas
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Total de resultados</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profesionData.totalResultados}</p>
            </div>
            {profesionData.salarioPromedio && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Salario promedio</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                  ${profesionData.salarioPromedio.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="home2-results-section">
        <div className="home2-results-header">
          <h2 className="home2-results-title">
            Resultados encontrados <span className="home2-results-count">({results.length})</span>
          </h2>
        </div>

        <div className="home2-results-list">
          {currentResults.map((result, index) => (
            <div
              key={index}
              className="home2-result-card"
              onClick={() => handleResultClick(result)}
              style={{ cursor: 'pointer' }}
            >
              <div className="home2-result-header">
                <h3 className="home2-professor-name">{result.nombre}</h3>
                <div className="home2-professor-info">
                  <div className="home2-info-item">
                    <span className="home2-info-text">{result.sujetoObligado}</span>
                  </div>
                  <div className="home2-info-item">
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
                  <div className="home2-salary-value home2-salary-max">{result.sueldoMax.monto}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación simple */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage === 1 ? '#e5e7eb' : '#2563eb',
                color: currentPage === 1 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Anterior
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage === totalPages ? '#e5e7eb' : '#2563eb',
                color: currentPage === totalPages ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Enlaces relacionados para SEO */}
      <div style={{
        maxWidth: '1200px',
        margin: '3rem auto',
        padding: '2rem 1rem',
        background: '#f9fafb',
        borderRadius: '0.5rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Búsquedas relacionadas
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['maestro', 'doctor', 'ingeniero', 'secretario', 'director', 'coordinador'].map(prof => (
            <Link
              key={prof}
              to={`/cuanto-gana/${prof}`}
              style={{
                padding: '0.5rem 1rem',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem',
                color: '#2563eb',
                textDecoration: 'none'
              }}
            >
              {prof.charAt(0).toUpperCase() + prof.slice(1)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProfesionPage;
