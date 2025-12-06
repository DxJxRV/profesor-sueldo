import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaSearch, FaShareAlt, FaFire, FaUser } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import '../styles/Home2.css';
import '../components/AdSense.css';
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
import hero800 from '../assets/hero2-800.webp';
import hero1200 from '../assets/hero2-1200.webp';
import hero1600 from '../assets/hero2-1600.webp';

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
  
  // Estados para paginación (ahora local)
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed para paginación local
  const [paginador, setPaginador] = useState(null);
  const [allResults, setAllResults] = useState([]); // Todos los resultados normalizados
  const resultsPerPage = 20; // Cantidad por página que mostramos al usuario

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

  // Estado para el input del hero
  const [heroSearchName, setHeroSearchName] = useState('Sheinbaum');

  // Ref para manejar clicks fuera del dropdown
  const dropdownRef = useRef(null);

  // Función para normalizar resultados: agrupa por nombre + institución
  const normalizeResults = (professors) => {
    const grouped = {};

    professors.forEach(prof => {
      // Normalizar nombre e institución para agrupar correctamente
      const normalizedNombre = prof.nombre.trim().toLowerCase().replace(/\s+/g, ' ');
      const normalizedInstitucion = prof.sujetoObligado
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.,;:!?]+$/g, ''); // Eliminar puntuación al final

      const key = `${normalizedNombre}|${normalizedInstitucion}`;

      if (!grouped[key]) {
        // Primera vez que vemos este nombre + institución
        grouped[key] = { ...prof };
      } else {
        // Ya existe, combinar periodos
        const existing = grouped[key];

        // Combinar periodoMontos si existen
        if (prof.periodoMontos && existing.periodoMontos) {
          // Crear un Set para evitar duplicados por periodo
          const periodosMap = new Map();

          [...existing.periodoMontos, ...prof.periodoMontos].forEach(periodo => {
            periodosMap.set(periodo.periodo, periodo);
          });

          existing.periodoMontos = Array.from(periodosMap.values());

          // Recalcular sueldo máximo y actual
          let maxMonto = 0;
          let maxPeriodo = '';
          existing.periodoMontos.forEach(p => {
            const monto = parseFloat(p.monto.replace(/[$,]/g, ''));
            if (monto > maxMonto) {
              maxMonto = monto;
              maxPeriodo = p.periodo;
            }
          });

          if (maxMonto > 0) {
            existing.sueldoMax = {
              monto: `$${maxMonto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              periodo: maxPeriodo
            };
          }

          // Actualizar sueldo actual (el del periodo más reciente)
          const sortedPeriodos = existing.periodoMontos.sort((a, b) => {
            const dateA = a.periodo.split(' - ')[0];
            const dateB = b.periodo.split(' - ')[0];
            return dateB.localeCompare(dateA);
          });

          if (sortedPeriodos.length > 0) {
            existing.sueldoActual = sortedPeriodos[0].monto;
          }
        }
      }
    });

    return Object.values(grouped);
  };

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

      // Ejecutar búsqueda con el nombre guardado usando la nueva lógica
      setLoading(true);
      fetchAndNormalizeResults(savedName)
        .then(({ normalizedResults, totalFromServer, entidades }) => {
          console.log("✅ Resultado desde location.state normalizado:", normalizedResults.length);

          // Guardar todos los resultados normalizados
          setAllResults(normalizedResults);

          // Mostrar primera página (primeros 20)
          const firstPage = normalizedResults.slice(0, resultsPerPage);
          setResults(firstPage);

          // Configurar paginador local
          const totalPages = Math.ceil(normalizedResults.length / resultsPerPage);
          setPaginador({
            total: normalizedResults.length,
            totalFromServer: totalFromServer,
            numeroPaginas: totalPages,
            cantidadPagina: resultsPerPage,
            paginaActual: 0
          });

          setShowResults(true);
          setHasSearched(true);
          setCurrentPage(0);

          if (entidades && entidades.length > 0) {
            setEntidadesFederativas(entidades);
          }

          // Actualizar URL con los parámetros de búsqueda
          updateURLParams(savedName, null);
        })
        .catch(error => {
          console.error("❌ Error al restaurar búsqueda:", error);
          setResults([]);
          setAllResults([]);
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

  // Función helper para traer 400 registros y normalizarlos
  const fetchAndNormalizeResults = async (contenido, entidadFederativa = null) => {
    console.log('🔍 Trayendo y normalizando 400 registros para:', contenido);

    try {
      // Traer página 0 (primeros 200)
      const page0Promise = apiClient.consultarProfesores({
        contenido,
        cantidad: 200,
        numeroPagina: 0,
        ...(entidadFederativa && { entidadFederativa })
      });

      // Traer página 1 (siguientes 200)
      const page1Promise = apiClient.consultarProfesores({
        contenido,
        cantidad: 200,
        numeroPagina: 1,
        ...(entidadFederativa && { entidadFederativa })
      });

      // Esperar ambas peticiones en paralelo
      const [data0, data1] = await Promise.all([page0Promise, page1Promise]);

      // Combinar resultados
      const allProfs = [...(data0.datosSolr || []), ...(data1.datosSolr || [])];

      console.log('📊 Total sin normalizar:', allProfs.length);

      // Normalizar (agrupar por nombre + institución)
      const normalized = normalizeResults(allProfs);

      console.log('✅ Total normalizado:', normalized.length);

      // Usar entidades del primer response (son las mismas)
      const entidades = data0.entidadesFederativas || [];

      return {
        normalizedResults: normalized,
        totalFromServer: data0.paginador?.total || 0, // Total en el servidor
        entidades
      };

    } catch (error) {
      console.error('❌ Error al traer y normalizar resultados:', error);
      throw error;
    }
  };

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
      const { normalizedResults, totalFromServer, entidades } = await fetchAndNormalizeResults(nombre, entidad);

      console.log("✅ Resultado desde URL normalizado:", normalizedResults.length);

      // Guardar todos los resultados normalizados
      setAllResults(normalizedResults);

      // Mostrar primera página (primeros 20)
      const firstPage = normalizedResults.slice(0, resultsPerPage);
      setResults(firstPage);

      // Configurar paginador local
      const totalPages = Math.ceil(normalizedResults.length / resultsPerPage);
      setPaginador({
        total: normalizedResults.length,
        totalFromServer: totalFromServer,
        numeroPaginas: totalPages,
        cantidadPagina: resultsPerPage,
        paginaActual: 0
      });

      setShowResults(true);
      setHasSearched(true);
      setCurrentPage(0);

      if (entidades && entidades.length > 0) {
        setEntidadesFederativas(entidades);
      }

    } catch (error) {
      console.error("❌ Error en búsqueda desde URL:", error);
      setResults([]);
      setAllResults([]);
      setPaginador(null);
    } finally {
      setLoading(false);
    }
  };

  const performInitialSearch = async () => {
    setProfessorName('Sheinbaum');
    setLoading(true);

    try {
      const { normalizedResults, totalFromServer, entidades } = await fetchAndNormalizeResults('Sheinbaum');

      console.log("✅ Resultado inicial normalizado:", normalizedResults.length);

      // Guardar todos los resultados normalizados
      setAllResults(normalizedResults);

      // Mostrar primera página (primeros 20)
      const firstPage = normalizedResults.slice(0, resultsPerPage);
      setResults(firstPage);

      // Configurar paginador local
      const totalPages = Math.ceil(normalizedResults.length / resultsPerPage);
      setPaginador({
        total: normalizedResults.length,
        totalFromServer: totalFromServer,
        numeroPaginas: totalPages,
        cantidadPagina: resultsPerPage,
        paginaActual: 0
      });

      setShowResults(true);
      setHasSearched(true);
      setCurrentPage(0);

      if (entidades && entidades.length > 0) {
        console.log('🏛️ Entidades Federativas del API:', entidades);
        setEntidadesFederativas(entidades);
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
      const { normalizedResults, totalFromServer, entidades } = await fetchAndNormalizeResults(nombre);

      console.log("✅ Resultado desde dropdown normalizado:", normalizedResults.length);

      // Guardar todos los resultados normalizados
      setAllResults(normalizedResults);

      // Mostrar primera página (primeros 20)
      const firstPage = normalizedResults.slice(0, resultsPerPage);
      setResults(firstPage);

      // Configurar paginador local
      const totalPages = Math.ceil(normalizedResults.length / resultsPerPage);
      setPaginador({
        total: normalizedResults.length,
        totalFromServer: totalFromServer,
        numeroPaginas: totalPages,
        cantidadPagina: resultsPerPage,
        paginaActual: 0
      });

      setShowResults(true);
      setHasSearched(true);
      setCurrentPage(0);

      if (entidades && entidades.length > 0) {
        setEntidadesFederativas(entidades);
      }

      // Actualizar URL
      updateURLParams(nombre, null);

    } catch (error) {
      console.error("❌ Error en búsqueda desde dropdown:", error);
      alert('Error al buscar información');
      setResults([]);
      setAllResults([]);
      setPaginador(null);
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

  // Función genérica para ejecutar búsqueda con un nombre específico
  const performSearch = async (searchName) => {
    if (!searchName || !searchName.trim()) return;

    setLoading(true);
    // Resetear filtros al hacer una nueva búsqueda
    setSelectedEntidad(null);
    setIsFilterOpen(false);

    // Cerrar dropdown si está abierto
    setShowDropdown(false);

    // Actualizar el nombre del profesor
    setProfessorName(searchName);

    // Tracking UTM: registrar click si hay configuración UTM activa
    if (utmKey) {
      await trackUtmClick(utmKey);
      trackUtmEvent('utm_custom_click', {
        utm_key: utmKey,
        search_query: searchName
      });
    }

    try {
      const { normalizedResults, totalFromServer, entidades } = await fetchAndNormalizeResults(searchName);

      console.log("✅ Resultado normalizado:", normalizedResults.length);

      // Guardar todos los resultados normalizados
      setAllResults(normalizedResults);

      // Mostrar primera página (primeros 20)
      const firstPage = normalizedResults.slice(0, resultsPerPage);
      setResults(firstPage);

      // Configurar paginador local
      const totalPages = Math.ceil(normalizedResults.length / resultsPerPage);
      setPaginador({
        total: normalizedResults.length,
        totalFromServer: totalFromServer,
        numeroPaginas: totalPages,
        cantidadPagina: resultsPerPage,
        paginaActual: 0
      });

      setShowResults(true);
      setHasSearched(true);
      setCurrentPage(0);

      // Usar entidades federativas directamente del response
      if (entidades && entidades.length > 0) {
        console.log('🏛️ Entidades Federativas del API:', entidades);
        setEntidadesFederativas(entidades);
      }

      // Agregar al historial
      const nuevoHistorial = addToHistorial(searchName);
      setHistorial(nuevoHistorial);

      // Actualizar URL con parámetros de búsqueda
      updateURLParams(searchName, null);

    } catch (error) {
      console.error("❌ Error en la solicitud:", error);
      alert(`Error al buscar información`);
      setResults([]);
      setAllResults([]);
      setPaginador(null);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performSearch(professorName);
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
      const { normalizedResults, totalFromServer, entidades } = await fetchAndNormalizeResults(professorName, entidad);

      console.log("✅ Resultado filtrado normalizado:", normalizedResults.length);

      // Guardar todos los resultados normalizados
      setAllResults(normalizedResults);

      // Mostrar primera página (primeros 20)
      const firstPage = normalizedResults.slice(0, resultsPerPage);
      setResults(firstPage);

      // Configurar paginador local
      const totalPages = Math.ceil(normalizedResults.length / resultsPerPage);
      setPaginador({
        total: normalizedResults.length,
        totalFromServer: totalFromServer,
        numeroPaginas: totalPages,
        cantidadPagina: resultsPerPage,
        paginaActual: 0
      });

      setCurrentPage(0);
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
      const { normalizedResults, totalFromServer, entidades } = await fetchAndNormalizeResults(professorName);

      console.log("✅ Resultado original normalizado:", normalizedResults.length);

      // Guardar todos los resultados normalizados
      setAllResults(normalizedResults);

      // Mostrar primera página (primeros 20)
      const firstPage = normalizedResults.slice(0, resultsPerPage);
      setResults(firstPage);

      // Configurar paginador local
      const totalPages = Math.ceil(normalizedResults.length / resultsPerPage);
      setPaginador({
        total: normalizedResults.length,
        totalFromServer: totalFromServer,
        numeroPaginas: totalPages,
        cantidadPagina: resultsPerPage,
        paginaActual: 0
      });

      setCurrentPage(0);

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

  // Funciones de paginación - ahora local (no hace peticiones al servidor)
  const totalPages = paginador ? paginador.numeroPaginas : 0;

  const paginate = (pageNumber) => {
    if (pageNumber < 0 || pageNumber >= totalPages) return;

    // Calcular el rango de resultados para esta página
    const start = pageNumber * resultsPerPage;
    const end = start + resultsPerPage;

    // Obtener resultados de la página desde allResults
    const pageResults = allResults.slice(start, end);

    setResults(pageResults);
    setCurrentPage(pageNumber);

    // Actualizar paginador
    if (paginador) {
      setPaginador({
        ...paginador,
        paginaActual: pageNumber
      });
    }

    // Scroll suave al inicio de los resultados
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (paginador && currentPage < totalPages - 1) {
      paginate(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      paginate(currentPage - 1);
    }
  };

  return (
    <div className="home2-container">
      {/* Hero Landing Section - Solo cuando NO hay UTM */}
      {!utmConfig && (
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '95vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginTop: '-70px',
          paddingTop: '70px'
        }}>
          {/* Imagen de fondo responsive */}
          <picture style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0
          }}>
            <source media="(min-width: 1200px)" srcSet={hero1600} />
            <source media="(min-width: 768px)" srcSet={hero1200} />
            <img
              src={hero800}
              alt="Hero background"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          </picture>

          {/* Overlay oscuro con gradiente radial */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0.1) 100%)',
            zIndex: 1
          }} />

          {/* Contenido del hero */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <h1 style={{
              fontSize: window.innerWidth <= 768 ? '2rem' : '3.5rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '1.5rem',
              textShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
              lineHeight: 1.2
            }}>
              Descubre cuánto ganan los servidores públicos de México
            </h1>

            <p style={{
              fontSize: window.innerWidth <= 768 ? '1rem' : '1.25rem',
              color: '#ffffff',
              marginBottom: '2.5rem',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
              lineHeight: 1.6,
              maxWidth: '700px',
              margin: '0 auto 2.5rem'
            }}>
              Accede a información oficial de transparencia sobre salarios de gobernadores, funcionarios del IMSS, SEP y más.
            </p>

            {/* Input de búsqueda con botón */}
            <div style={{
              maxWidth: '600px',
              margin: '0 auto',
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              gap: '0'
            }}>
              <input
                type="text"
                value={heroSearchName}
                onChange={(e) => setHeroSearchName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && heroSearchName.trim()) {
                    e.preventDefault();
                    await performSearch(heroSearchName);
                    setTimeout(() => {
                      window.scrollTo({
                        top: 1170,
                        behavior: 'smooth'
                      });
                    }, 300);
                  }
                }}
                placeholder="Ingresa un nombre..."
                style={{
                  flex: 1,
                  height: '60px',
                  padding: '0 1.5rem',
                  fontSize: window.innerWidth <= 768 ? '1rem' : '1.125rem',
                  border: 'none',
                  borderRadius: '0.75rem 0 0 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.75)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  outline: 'none',
                  fontWeight: 500,
                  color: '#1f2937',
                  transition: 'all 0.3s ease',
                  animation: 'bounceScale 2s ease-in-out infinite'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.animation = 'none';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.25)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.animation = 'bounceScale 2s ease-in-out infinite';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
                }}
              />

              <button
                onClick={async (e) => {
                  if (!heroSearchName.trim()) return;
                  e.preventDefault();
                  await performSearch(heroSearchName);
                  setTimeout(() => {
                    window.scrollTo({
                      top: 1100,
                      behavior: 'smooth'
                    });
                  }, 300);
                }}
                title="Buscar Sueldos"
                disabled={!heroSearchName.trim()}
                style={{
                  padding: '0',
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #d91c5c 0%, #ffd600 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0 0.75rem 0.75rem 0',
                  cursor: heroSearchName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 6px 20px rgba(217, 28, 92, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  animation: 'bounceScale 2s ease-in-out infinite',
                  opacity: heroSearchName.trim() ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  if (heroSearchName.trim()) {
                    e.currentTarget.style.animation = 'none';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(217, 28, 92, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (heroSearchName.trim()) {
                    e.currentTarget.style.animation = 'bounceScale 2s ease-in-out infinite';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 28, 92, 0.4)';
                  }
                }}
              >
                <FiSearch size={28} />
              </button>
            </div>

            <style>{`
              @keyframes bounceScale {
                0%, 100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.05);
                }
              }
            `}</style>
          </div>
        </div>
      )}

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
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      if (!loading) {
                        handleSubmit(e);
                      }
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
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = '#111827';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1f2937';
                      e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <FaSearch size={15} color="white" />
                  </div>
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
              Resultados encontrados <span className="home2-results-count">
                ({paginador ? paginador.total : results.length})
              </span>
            </h2>
            {paginador && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Página {currentPage + 1} de {totalPages} - Mostrando {results.length} resultados
              </p>
            )}
          </div>

          <div className="home2-results-list">
            {results.map((result, index) => (
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
                disabled={currentPage === 0 || loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Anterior</span>
              </button>

              <div className="pagination-numbers">
                {[...Array(totalPages)].map((_, index) => {
                  const pageIndex = index; // 0-based para el backend
                  const displayNumber = index + 1; // 1-based para mostrar al usuario

                  // Mostrar primera, última y páginas cercanas a la actual
                  if (
                    pageIndex === 0 ||
                    pageIndex === totalPages - 1 ||
                    (pageIndex >= currentPage - 1 && pageIndex <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageIndex}
                        className={`pagination-number ${currentPage === pageIndex ? 'active' : ''}`}
                        onClick={() => paginate(pageIndex)}
                        disabled={loading}
                      >
                        {displayNumber}
                      </button>
                    );
                  } else if (
                    pageIndex === currentPage - 2 ||
                    pageIndex === currentPage + 2
                  ) {
                    return <span key={pageIndex} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                className="pagination-button pagination-next"
                onClick={nextPage}
                disabled={currentPage === totalPages - 1 || loading}
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