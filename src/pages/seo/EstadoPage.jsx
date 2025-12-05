import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';
import { getSeoMetadata, getSeoContent } from '../../utils/seoUtils';
import { apiClient } from '../../services/apiClient';
import '../../styles/Home2.css';

function EstadoPage() {
  const { estadoSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [estadoData, setEstadoData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20;

  useEffect(() => {
    fetchEstadoData();
  }, [estadoSlug]);

  const fetchEstadoData = async () => {
    setLoading(true);
    try {
      const estadoNombre = estadoSlug.replace(/-/g, ' ')
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      const data = await apiClient.consultarProfesores({
        contenido: '',
        cantidad: 200,
        numeroPagina: 0,
        entidadFederativa: estadoNombre
      });

      setResults(data.datosSolr || []);

      const sueldos = data.datosSolr
        ?.map(r => parseFloat(r.sueldoActual?.replace(/[$,]/g, '') || 0))
        .filter(s => s > 0) || [];
      const salarioPromedio = sueldos.length > 0
        ? sueldos.reduce((a, b) => a + b, 0) / sueldos.length
        : null;

      setEstadoData({
        nombre: estadoNombre,
        slug: estadoSlug,
        salarioPromedio,
        totalResultados: data.datosSolr?.length || 0
      });
    } catch (error) {
      console.error('Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
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

  if (!estadoData || results.length === 0) {
    return (
      <div className="home2-container">
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h1>No se encontraron resultados para {estadoSlug}</h1>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const metadata = getSeoMetadata({ type: 'estado', data: estadoData });
  const content = getSeoContent({ type: 'estado', data: estadoData });

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(results.length / resultsPerPage);

  return (
    <div className="home2-container">
      <SEOHead metadata={metadata} />

      <div className="home2-hero">
        <div className="home2-hero-content">
          <h1 className="home2-title">{content.h1}</h1>
          <p className="home2-subtitle">{content.intro}</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {content.sections.map((section, index) => (
          <div key={index} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {section.title}
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ background: '#f3f4f6', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Estadísticas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Total de servidores públicos</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{estadoData.totalResultados}</p>
            </div>
            {estadoData.salarioPromedio && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Salario promedio</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                  ${estadoData.salarioPromedio.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="home2-results-section">
        <div className="home2-results-header">
          <h2 className="home2-results-title">
            Resultados <span className="home2-results-count">({results.length})</span>
          </h2>
        </div>

        <div className="home2-results-list">
          {currentResults.map((result, index) => (
            <div
              key={index}
              className="home2-result-card"
              onClick={() => navigate(`/profesor/${result.professorId}/${encodeURIComponent(result.nombre)}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="home2-result-header">
                <h3 className="home2-professor-name">{result.nombre}</h3>
                <div className="home2-professor-info">
                  <div className="home2-info-item">
                    <span className="home2-info-text">{result.sujetoObligado}</span>
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

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EstadoPage;
