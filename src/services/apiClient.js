/**
 * Cliente API centralizado para todas las peticiones HTTP
 * Usa rutas relativas (/api) para aprovechar el proxy de Vite en desarrollo
 * y funcionar correctamente en producción
 */

const API_BASE_URL = '/api';

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Método genérico para hacer peticiones
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error en petición a ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Consulta de profesores
   */
  async consultarProfesores({
    contenido,
    cantidad = 200,
    numeroPagina = 0,
    entidadFederativa = null,
  }) {
    const body = {
      contenido,
      cantidad,
      numeroPagina,
      coleccion: "SUELDOS",
      dePaginador: false,
      idCompartido: "",
      filtroSeleccionado: "",
      tipoOrdenamiento: "COINCIDENCIA",
      sujetosObligados: { seleccion: [], descartado: [] },
      organosGarantes: { seleccion: [], descartado: [] },
      anioFechaInicio: { seleccion: [], descartado: [] },
    };

    // Agregar filtro de entidad federativa si existe
    if (entidadFederativa) {
      body.entidadFederativa = entidadFederativa;
    }

    console.log('🔍 Consultando profesores:', { contenido, cantidad, entidadFederativa });

    return this.request('/consulta', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Registrar vista de profesor
   */
  async registrarVistaProfesor({
    professorId,
    nombreProfesor,
    sujetoObligado,
    entidadFederativa,
    sueldoMaximo,
    sueldoAcumulado,
    ultimoSueldo,
  }) {
    const body = {
      professorId,
      nombreProfesor,
      sujetoObligado,
      entidadFederativa,
      sueldoMaximo,
      sueldoAcumulado,
      ultimoSueldo,
    };

    console.log('📊 Registrando vista de profesor:', body);

    return this.request('/profesor-vista', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Ping para inicializar sesión (establece cookie sid)
   */
  async ping() {
    return this.request('/ping', {
      method: 'GET',
    });
  }
}

// Exportar una instancia única del cliente
export const apiClient = new ApiClient();

// Exportar la clase por si se necesita crear instancias personalizadas
export default ApiClient;
