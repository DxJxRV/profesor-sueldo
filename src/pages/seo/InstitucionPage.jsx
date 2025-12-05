import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';
import { getSeoMetadata, getSeoContent } from '../../utils/seoUtils';
import { apiClient } from '../../services/apiClient';
import '../../styles/Home2.css';

function InstitucionPage() {
  const { institucionSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [institucionData, setInstitucionData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const institucionNombre = institucionSlug.replace(/-/g, ' ')
          .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        const data = await apiClient.consultarProfesores({
          contenido: institucionNombre,
          cantidad: 200,
          numeroPagina: 0
        });

        setResults(data.datosSolr || []);
        setInstitucionData({
          nombre: institucionNombre,
          slug: institucionSlug,
          totalResultados: data.datosSolr?.length || 0
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [institucionSlug]);

  if (loading || !institucionData) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando...</div>;
  }

  const metadata = getSeoMetadata({ type: 'institucion', data: institucionData });
  const content = getSeoContent({ type: 'institucion', data: institucionData });

  return (
    <div className="home2-container">
      <SEOHead metadata={metadata} />
      <div className="home2-hero">
        <div className="home2-hero-content">
          <h1 className="home2-title">{content.h1}</h1>
          <p className="home2-subtitle">{content.intro}</p>
        </div>
      </div>

      <div className="home2-results-section">
        <h2 className="home2-results-title">Empleados ({results.length})</h2>
        <div className="home2-results-list">
          {results.slice(0, 20).map((result, index) => (
            <div
              key={index}
              className="home2-result-card"
              onClick={() => navigate(`/profesor/${result.professorId}/${encodeURIComponent(result.nombre)}`)}
              style={{ cursor: 'pointer' }}
            >
              <h3 className="home2-professor-name">{result.nombre}</h3>
              <div className="home2-salary-info">
                <div className="home2-salary-item">
                  <div className="home2-salary-label">SUELDO ACTUAL</div>
                  <div className="home2-salary-value">{result.sueldoActual}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InstitucionPage;
