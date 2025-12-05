import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaSearch, FaShareAlt, FaSpinner, FaFire, FaUser } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import '../styles/Home2.css';
import '../components/AdSense.css';
import AdSense from '../components/AdSense';
import { apiClient } from '../services/apiClient';
import { getHistorial, addToHistorial, removeFromHistorial } from '../utils/historial';
import {
  getUtmKeyFromUrl,
  fetchUtmConfig,
  trackUtmView,
  trackUtmClick,
  getUtmStyles,
  getUtmText,
  getSuggestedProfessor,
  trackUtmEvent
} from '../utils/utmConfig';

function Home2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [professorName, setProfessorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [entidadesFederativas, setEntidadesFederativas] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  // Estados para dropdown de autocompletado
  const [showDropdown, setShowDropdown] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [masBuscados, setMasBuscados] = useState([]);
  const [isLoadingMasBuscados, setIsLoadingMasBuscados] = useState(false);

  // Estados para UTM Config
  const [utmConfig, setUtmConfig] = useState(null);
  const [utmKey, setUtmKey] = useState(null);
  const [utmLoading, setUtmLoading] = useState(true);

  // Estados para Targeted Messages
  const [targetedMessages, setTargetedMessages] = useState([]);
  const [showTargetedMessage, setShowTargetedMessage] = useState(true);

  // Ref para manejar clicks fuera del dropdown
  const dropdownRef = useRef(null);

  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Cargar configuración UTM si existe
  useEffect(() => {
    const loadUtmConfig = async () => {
      const key = getUtmKeyFromUrl(searchParams);

      if (!key) {
        setUtmLoading(false);
        return;
      }

      console.log('🎯 UTM Key detectado:', key);
      setUtmKey(key);

      const config = await fetchUtmConfig(key);

      if (config) {
        console.log('✅ Configuración UTM cargada:', config);
        setUtmConfig(config);

        // Registrar vista automáticamente
        await trackUtmView(key);

        // Tracking GA4
        trackUtmEvent('utm_landing_detected', {
          utm_key: key,
          utm_title: config.title
        });

        // Si hay un profesor sugerido, pre-llenar el input
        const suggestedProf = getSuggestedProfessor(config);
        if (suggestedProf && suggestedProf.name) {
          setProfessorName(suggestedProf.name);
        }
      }

      setUtmLoading(false);
    };

    loadUtmConfig();
  }, [searchParams]);

  // Cargar historial desde localStorage al montar
  useEffect(() => {
    const historialGuardado = getHistorial();
    setHistorial(historialGuardado);
  }, []);

  // Cargar mensajes dirigidos para el usuario actual
  useEffect(() => {
    const fetchTargetedMessages = async () => {
      try {
        const response = await apiClient.getActiveTargetedMessages();
        if (response?.data && response.data.length > 0) {
          setTargetedMessages(response.data);
          // Registrar vista del primer mensaje
          await apiClient.incrementTargetedMessageShowCount(response.data[0].id);
        }
      } catch (error) {
        console.error('Error al cargar mensajes dirigidos:', error);
      }
    };

    fetchTargetedMessages();
  }, []);

  // Cargar nombres más buscados desde el backend
  useEffect(() => {
    const fetchMasBuscados = async () => {
      setIsLoadingMasBuscados(true);
      try {
        const response = await apiClient.getNombresMasBuscados(10);
        // La respuesta viene como: { success: true, data: [...], total: 7 }
        // data es un array de objetos: [{ nombre_profesor, total_busquedas, usuarios_unicos, ultima_busqueda }, ...]
        setMasBuscados(response?.data || []);
      } catch (error) {
        console.error('❌ Error al cargar nombres más buscados:', error);
        setMasBuscados([]);
      } finally {
        setIsLoadingMasBuscados(false);
      }
    };

    fetchMasBuscados();
  }, []);

  // Manejar clicks fuera del dropdown para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Restaurar estado de búsqueda si viene del detalle de profesor o de URL params
  useEffect(() => {
    // Prioridad 1: Verificar si viene de página de detalle con state
    if (location.state?.searchName) {
      const savedName = location.state.searchName;
      setProfessorName(savedName);
      
      // Ejecutar búsqueda con el nombre guardado
      setLoading(true);
      apiClient.consultarProfesores({
        contenido: savedName,
        cantidad: 200,
        numeroPagina: 0,
      })
      .then(data => {
        setResults(data.datosSolr || []);
        setShowResults(true);
        setHasSearched(true);
        if (data.entidadesFederativas && data.entidadesFederativas.length > 0) {
          setEntidadesFederativas(data.entidadesFederativas);
        }
        
        // Actualizar URL con los parámetros de búsqueda
        updateURLParams(savedName, null);
      })
      .catch(error => {
        console.error("❌ Error al restaurar búsqueda:", error);
        setResults([]);
      })
      .finally(() => {
        setLoading(false);
      });
      
      // Limpiar el state para que no se restaure de nuevo
      window.history.replaceState({}, document.title);
      return; // No ejecutar la búsqueda inicial
    }
    
    // Prioridad 2: Verificar si hay parámetros en la URL
    const nombreParam = searchParams.get('nombre');
    const entidadParam = searchParams.get('entidad');
    
    if (nombreParam) {
      setProfessorName(nombreParam);
      if (entidadParam) {
        setSelectedEntidad(entidadParam);
      }
      performSearchFromURL(nombreParam, entidadParam);
      return;
    }
    
    // Prioridad 3: Búsqueda inicial por defecto
    performInitialSearch();
  }, [location.state]); // Solo depende de location.state, los params se manejan internamente

  // Función para actualizar URL params sin recargar
  const updateURLParams = (nombre, entidad) => {
    const params = new URLSearchParams();
    if (nombre) {
      params.set('nombre', nombre);
    }
    if (entidad) {
      params.set('entidad', entidad);
    }
    
    // Actualizar URL sin recargar (replace para no agregar a historial)
    if (nombre) {
      setSearchParams(params, { replace: true });
    }
  };

  // Búsqueda desde parámetros URL
  const performSearchFromURL = async (nombre, entidad) => {
    setLoading(true);
    
    try {
      const data = await apiClient.consultarProfesores({
        contenido: nombre,
        cantidad: 200,
        numeroPagina: 0,
        ...(entidad && { entidadFederativa: entidad })
      });

      console.log("✅ Resultado desde URL:", data);
      setResults(data.datosSolr || []);
      setShowResults(true);
      setHasSearched(true);
      
      if (data.entidadesFederativas && data.entidadesFederativas.length > 0) {
        setEntidadesFederativas(data.entidadesFederativas);
      }
      
    } catch (error) {
      console.error("❌ Error en búsqueda desde URL:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const performInitialSearch = async () => {
    setProfessorName('Sheinbaum');
    setLoading(true);
    
    try {
      const data = await apiClient.consultarProfesores({
        contenido: 'Sheinbaum',
        cantidad: 200,
        numeroPagina: 0,
      });

      console.log("✅ Resultado inicial:", data);
      setResults(data.datosSolr || []);
      setShowResults(true);
      setHasSearched(true);
      
      if (data.entidadesFederativas && data.entidadesFederativas.length > 0) {
        console.log('🏛️ Entidades Federativas del API:', data.entidadesFederativas);
        setEntidadesFederativas(data.entidadesFederativas);
      }
      
    } catch (error) {
      console.error("❌ Error en búsqueda inicial:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // ============================================
  // FUNCIONES HELPER PARA DROPDOWN
  // ============================================

  // Abrir dropdown cuando se hace focus en el input
  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  // Seleccionar un item del dropdown (historial o más buscados)
  const handleSelect = async (nombre) => {
    if (!nombre || !nombre.trim()) return;

    // Autocompletar el input
    setProfessorName(nombre);

    // Cerrar el dropdown
    setShowDropdown(false);

    // Resetear filtros
    setSelectedEntidad(null);
    setIsFilterOpen(false);

    // Agregar al historial
    const nuevoHistorial = addToHistorial(nombre);
    setHistorial(nuevoHistorial);

    // Ejecutar búsqueda automáticamente
    setLoading(true);
    try {
      const data = await apiClient.consultarProfesores({
        contenido: nombre,
        cantidad: 200,
        numeroPagina: 0,
      });

      console.log("✅ Resultado desde dropdown:", data);
      setResults(data.datosSolr || []);
      setShowResults(true);
      setHasSearched(true);

      if (data.entidadesFederativas && data.entidadesFederativas.length > 0) {
        setEntidadesFederativas(data.entidadesFederativas);
      }

      // Actualizar URL
      updateURLParams(nombre, null);

    } catch (error) {
      console.error("❌ Error en búsqueda desde dropdown:", error);
      alert('Error al buscar información');
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un item del historial
  const handleRemoveItem = (e, nombre) => {
    e.stopPropagation(); // Evitar que se dispare el click del parent
    const nuevoHistorial = removeFromHistorial(nombre);
    setHistorial(nuevoHistorial);
  };

  // Compartir búsqueda de una persona usando Web Share API
  const handleShare = async (e, result) => {
    e.preventDefault(); // Prevenir navegación
    e.stopPropagation(); // Prevenir que se dispare el click del card

    const shareUrl = `${window.location.origin}/?nombre=${encodeURIComponent(result.nombre)}`;
    const shareData = {
      title: `¿Cuánto gana ${result.nombre}?`,
      text: `Consulta el sueldo de ${result.nombre} - ${result.sujetoObligado} en Sueldos México`,
      url: shareUrl
    };

    try {
      // Verificar si el navegador soporta Web Share API
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('✅ Compartido exitosamente');
      } else {
        // Fallback: copiar al clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('✅ Link copiado al portapapeles');
      }
    } catch (error) {
      // El usuario canceló o hubo un error
      if (error.name !== 'AbortError') {
        console.error('❌ Error al compartir:', error);
        // Fallback: intentar copiar al clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('✅ Link copiado al portapapeles');
        } catch (clipboardError) {
          console.error('❌ Error al copiar:', clipboardError);
        }
      }
    }
  };

  // ============================================
  // FIN FUNCIONES DROPDOWN
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (professorName.trim()) {
      setLoading(true);
      // Resetear filtros al hacer una nueva búsqueda
      setSelectedEntidad(null);
      setIsFilterOpen(false);

      // Cerrar dropdown si está abierto
      setShowDropdown(false);

      // Tracking UTM: registrar click si hay configuración UTM activa
      if (utmKey) {
        await trackUtmClick(utmKey);
        trackUtmEvent('utm_custom_click', {
          utm_key: utmKey,
          search_query: professorName
        });
      }

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

        // Agregar al historial
        const nuevoHistorial = addToHistorial(professorName);
        setHistorial(nuevoHistorial);

        // Actualizar URL con parámetros de búsqueda
        updateURLParams(professorName, null);

      } catch (error) {
        console.error("❌ Error en la solicitud:", error);
        alert(`Error al buscar información`);
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
      
      // Actualizar URL con nombre y entidad
      updateURLParams(professorName, entidad);
      
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
      const data = await apiClient.consultarProfesores({
        contenido: professorName,
        cantidad: 100,
        numeroPagina: 0,
      });

      console.log("✅ Resultado original:", data);
      setResults(data.datosSolr || []);
      
      // Actualizar URL sin entidad (solo nombre)
      updateURLParams(professorName, null);
      
    } catch (error) {
      console.error("❌ Error en la búsqueda original:", error);
      alert(`Error al ejecutar búsqueda: `);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (e, professorData) => {
    e.preventDefault(); // Prevenir navegación por defecto del <a>
    
    // Guardar solo el nombre de búsqueda actual
    const searchName = professorName;
    
    // Navegar a la página de detalle con parámetros URL y estado
    const encodedName = encodeURIComponent(professorData.nombre);
    navigate(`/profesor/${professorData.professorId}/${encodedName}`, {
      state: { searchName }
    });
  };

  // Función para generar la URL del profesor
  const getProfessorURL = (professorData) => {
    const encodedName = encodeURIComponent(professorData.nombre);
    return `/profesor/${professorData.professorId}/${encodedName}`;
  };

  // Funciones de paginación
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(results.length / resultsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll suave al inicio de los resultados
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  // Resetear paginación cuando cambien los resultados
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  return (
    <div className="home2-container">
      {/* Hero Section */}
      <div className="home2-hero" style={utmConfig ? getUtmStyles(utmConfig) : {}}>
        <div className="home2-hero-content">
          <h1 className="home2-title" style={{
            color: utmConfig?.text_color || (utmConfig?.image_url ? '#ffffff' : undefined),
            textShadow: utmConfig?.image_url ? '0 2px 8px rgba(0, 0, 0, 0.5)' : 'none'
          }}>
            {utmConfig ? getUtmText(utmConfig, 'title', '¿Cuánto gana mi servidor público?') : '¿Cuánto gana mi servidor público?'}
          </h1>
          <p className="home2-subtitle" style={{
            color: utmConfig?.text_color || (utmConfig?.image_url ? '#ffffff' : undefined),
            textShadow: utmConfig?.image_url ? '0 2px 6px rgba(0, 0, 0, 0.4)' : 'none'
          }}>
            {utmConfig && utmConfig.subtitle
              ? utmConfig.subtitle
              : 'Gobernadores | SEP | IMSS | Institutos | Secretarías'}
            <br />
            {!utmConfig && 'Consulta información salarial de cualquier servidor público de México'}
          </p>

          {/* Mensaje especial personalizado si existe */}
          {utmConfig && utmConfig.special_message && (
            <div style={{
              marginTop: '2rem',
              borderRadius: utmConfig.image_url ? '0' : '1rem',
              boxShadow: utmConfig.image_url ? 'none' : '0 8px 32px -8px rgba(99, 102, 241, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              padding: '1.5rem 2rem',
              background: utmConfig.image_url
                ? 'transparent'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 255, 0.95) 100%)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              border: utmConfig.image_url
                ? 'none'
                : '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <div style={{
                position: 'relative',
                zIndex: 1,
                width: '100%'
              }}>
                <p style={{
                  margin: '0 0 1rem 0',
                  color: utmConfig.image_url ? '#ffffff' : '#1e293b',
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  textAlign: 'center',
                  lineHeight: '1.6',
                  textShadow: utmConfig.image_url ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none'
                }}>
                  {utmConfig.special_message}
                </p>
              </div>
            </div>
          )}

          {/* Mostrar profesor sugerido si existe */}
          {utmConfig && getSuggestedProfessor(utmConfig) && (
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: utmConfig.image_url ? '#ffffff' : '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                textShadow: utmConfig.image_url ? '0 2px 8px rgba(0, 0, 0, 0.5)' : 'none'
              }}>
                <span>👤</span>
                <span>{getSuggestedProfessor(utmConfig).name}</span>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Ejecutar búsqueda
                  if (!loading) {
                    handleSubmit(e);
                    // Scroll suave hacia los resultados después de un breve delay
                    setTimeout(() => {
                      window.scrollTo({
                        top: 800,
                        behavior: 'smooth'
                      });
                    }, 500);
                  }
                }}
                style={{
                  padding: '0.875rem 2rem',
                  background: utmConfig?.button_color || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: utmConfig?.button_color
                    ? `0 4px 12px ${utmConfig.button_color}40`
                    : '0 4px 12px rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    if (utmConfig?.button_color) {
                      e.currentTarget.style.boxShadow = `0 6px 16px ${utmConfig.button_color}60`;
                    } else {
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    if (utmConfig?.button_color) {
                      e.currentTarget.style.boxShadow = `0 4px 12px ${utmConfig.button_color}40`;
                    } else {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                    }
                  }
                }}
              >
                <FiSearch size={20} />
                <span>{getUtmText(utmConfig, 'button_text', 'Buscar información')}</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Targeted Message Banner - for returning users */}
      {targetedMessages.length > 0 && showTargetedMessage && (
        <div style={{
          maxWidth: '1200px',
          margin: '2rem auto',
          padding: '0 1rem'
        }}>
          <div style={{
            backgroundColor: targetedMessages[0].background_color || '#8b5cf6',
            color: targetedMessages[0].text_color || '#ffffff',
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            animation: 'slideDown 0.5s ease-out'
          }}>
            {/* Botón de cerrar */}
            <button
              onClick={() => setShowTargetedMessage(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              aria-label="Cerrar mensaje"
            >
              ×
            </button>

            <div style={{ paddingRight: '2rem' }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: 'inherit'
              }}>
                {targetedMessages[0].title}
              </h3>

              {targetedMessages[0].subtitle && (
                <p style={{
                  fontSize: '1rem',
                  marginBottom: '0.75rem',
                  opacity: 0.9,
                  color: 'inherit'
                }}>
                  {targetedMessages[0].subtitle}
                </p>
              )}

              <p style={{
                fontSize: '1rem',
                lineHeight: '1.6',
                marginBottom: targetedMessages[0].button_text ? '1rem' : '0',
                color: 'inherit'
              }}>
                {targetedMessages[0].message}
              </p>

              {targetedMessages[0].button_text && targetedMessages[0].button_url && (
                <a
                  href={targetedMessages[0].button_url}
                  onClick={async () => {
                    await apiClient.incrementTargetedMessageClickCount(targetedMessages[0].id);
                  }}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'inherit',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {targetedMessages[0].button_text}
                </a>
              )}
            </div>

            <style>{`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="home2-search-section">
        <div className="home2-search-card">
          <form onSubmit={handleSubmit}>
            {/* Search Input */}
            <div className="home2-input-group" ref={dropdownRef}>
              <label className="home2-input-label">Nombre del servidor público</label>
              <div style={{ position: 'relative' }}>
                <div className="home2-input-container" style={{ paddingRight: '3.5rem' }}>
                  <svg className="home2-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="21 21l-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    value={professorName}
                    onChange={(e) => {
                      setProfessorName(e.target.value);
                      // Cerrar dropdown cuando el usuario empieza a escribir
                      if (e.target.value.length > 0) {
                        setShowDropdown(false);
                      }
                    }}
                    onFocus={handleInputFocus}
                    onKeyDown={(e) => {
                      // Ejecutar búsqueda al presionar Enter
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Ingresa el nombre del servidor público..."
                    className="home2-search-input"
                    autoComplete="off"
                    style={{ paddingRight: '3.5rem' }}
                  />
                  {/* Botón de búsqueda dentro del input */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(e);
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#111827';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1f2937';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                    disabled={loading}
                  >
                    <FaSearch size={20} color="white" />
                  </button>
                </div>

                {/* Top 3 más buscados + sugerencias - Badges debajo del input */}
                {!showDropdown && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginTop: '0.75rem',
                    padding: '0 0.25rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      alignSelf: 'center',
                      whiteSpace: 'nowrap'
                    }}>
                      Populares:
                    </span>

                    {/* Top 3 desde el backend */}
                    {masBuscados.slice(0, 3).map((item, index) => (
                      <button
                        key={`badge-${index}`}
                        type="button"
                        onClick={() => handleSelect(item.nombre_profesor)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#fef3c7',
                          border: '1px solid #fbbf24',
                          borderRadius: '9999px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                          color: '#92400e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontWeight: 600
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fde68a';
                          e.currentTarget.style.borderColor = '#f59e0b';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef3c7';
                          e.currentTarget.style.borderColor = '#fbbf24';
                        }}
                      >
                        <FaFire size={14} color="#dc2626" />
                        {item.nombre_profesor}
                      </button>
                    ))}

                    {/* Sugerencias adicionales */}
                    {['profesor', 'doctor', 'vecino'].map((termino, index) => (
                      <button
                        key={`sugerencia-${index}`}
                        type="button"
                        onClick={() => handleSelect(termino)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #93c5fd',
                          borderRadius: '9999px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                          color: '#1e40af',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                          e.currentTarget.style.borderColor = '#60a5fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                          e.currentTarget.style.borderColor = '#93c5fd';
                        }}
                      >
                        <FaUser size={12} color="#3b82f6" />
                        Tu {termino}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dropdown de autocompletado - Mejorado */}
                {showDropdown && (historial.length > 0 || masBuscados.length > 0) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    marginTop: '0.5rem',
                    maxHeight: '20rem',
                    overflowY: 'auto',
                    zIndex: 50
                  }}>

                    {/* Sección: Historial de búsquedas */}
                    {historial.length > 0 && (
                      <div>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #f3f4f6'
                        }}>
                          📋 Tu historial
                        </div>
                        {historial.map((item, index) => (
                          <div
                            key={`historial-${index}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                              borderBottom: index < historial.length - 1 ? '1px solid #f3f4f6' : 'none'
                            }}
                            className="dropdown-item-hover"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <span
                              onClick={() => handleSelect(item)}
                              style={{
                                flex: 1,
                                fontSize: '0.875rem',
                                color: '#1f2937'
                              }}
                            >
                              🕐 {item}
                            </span>
                            <button
                              onClick={(e) => handleRemoveItem(e, item)}
                              style={{
                                marginLeft: '0.5rem',
                                padding: '0.25rem',
                                color: '#9ca3af',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                lineHeight: 1,
                                transition: 'color 0.15s'
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                              onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                              title="Eliminar del historial"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Separador entre secciones */}
                    {historial.length > 0 && masBuscados.length > 0 && (
                      <div style={{ height: '0.5rem', backgroundColor: '#f9fafb' }} />
                    )}

                    {/* Sección: Más buscados */}
                    {masBuscados.length > 0 && (
                      <div>
                        <div style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FaFire size={12} color="#dc2626" />
                          Más buscados
                        </div>
                        {isLoadingMasBuscados ? (
                          <div style={{
                            padding: '2rem 1rem',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                          }}>
                            Cargando...
                          </div>
                        ) : (
                          masBuscados.map((item, index) => (
                            <div
                              key={`buscado-${index}`}
                              style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s',
                                borderBottom: index < masBuscados.length - 1 ? '1px solid #f3f4f6' : 'none'
                              }}
                              onClick={() => handleSelect(item.nombre_profesor)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.5rem'
                              }}>
                                <span style={{
                                  fontSize: '0.875rem',
                                  color: '#1f2937',
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {item.nombre_profesor}
                                </span>
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#9ca3af',
                                  backgroundColor: '#f3f4f6',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {item.total_busquedas}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>
                )}
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
              {loading
                ? "Buscando..."
                : utmConfig && utmConfig.button_text
                ? utmConfig.button_text
                : "Buscar servidor público"}
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
            {currentResults.map((result, index) => (
              <>
                {/* Anuncios en posiciones específicas */}
                {/* {(index === 1 || index === 4 || index === 7) && (
                  <div key={`ad-${index}`} className="home2-ad-container">
                    <AdSense 
                      adSlot="1234567890"
                      className="adsense-container"
                      style={{ display: 'block', minHeight: '150px', margin: '1rem 0' }}
                    />
                  </div>
                )} */}
                
                <a
                  key={index}
                  href={getProfessorURL(result)}
                  className="home2-result-card home2-result-link"
                  onClick={(e) => handleCardClick(e, result)}
                  style={{ position: 'relative' }}
                >
                  {/* Icono de compartir en esquina superior derecha */}
                  <div
                    onClick={(e) => handleShare(e, result)}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      zIndex: 10,
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Compartir"
                  >
                    <FaShareAlt size={20} color="#6b7280" />
                  </div>

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

                  <div className="home2-card-action">
                    <span className="home2-action-text">Ver detalles</span>
                    <svg className="home2-action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </a>
              </>
            ))}
          </div>

          {/* Paginador */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button pagination-prev"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Anterior</span>
              </button>

              <div className="pagination-numbers">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Mostrar primera, última y páginas cercanas a la actual
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                        onClick={() => paginate(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                className="pagination-button pagination-next"
                onClick={nextPage}
                disabled={currentPage === totalPages}
              >
                <span>Siguiente</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Anuncio al Final */}
      {/* {showResults && (
        <AdSense 
          adSlot="3456789012"
          className="adsense-container adsense-bottom"
          style={{ display: 'block', minHeight: '250px' }}
        />
      )} */}
    </div>
  );
}

export default Home2;