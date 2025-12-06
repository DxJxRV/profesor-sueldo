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
   * Extrae parámetros UTM de la URL actual
   */
  getUtmParamsFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('src') || urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_content: urlParams.get('utm_content'),
      utm_term: urlParams.get('utm_term'),
    };
  }

  /**
   * Método genérico para hacer peticiones
   */
  async request(endpoint, options = {}) {
    let url = `${this.baseURL}${endpoint}`;

    // Si es el ping o la primera petición, agregar parámetros UTM a la URL
    if (endpoint === '/ping' || endpoint.includes('/consulta') || endpoint.includes('/profesor-vista')) {
      const utmParams = this.getUtmParamsFromUrl();

      // Solo agregar si hay al menos un parámetro UTM
      if (Object.values(utmParams).some(val => val)) {
        const queryParams = new URLSearchParams();

        // Agregar parámetros UTM
        Object.entries(utmParams).forEach(([key, value]) => {
          if (value) {
            queryParams.set(key, value);
          }
        });

        // Si la URL ya tiene query params, mantenerlos
        const [baseUrl, existingQuery] = url.split('?');
        if (existingQuery) {
          const existingParams = new URLSearchParams(existingQuery);
          existingParams.forEach((value, key) => {
            if (!queryParams.has(key)) {
              queryParams.set(key, value);
            }
          });
        }

        url = `${baseUrl}?${queryParams.toString()}`;
        console.log('🏷️ Enviando parámetros UTM al backend:', utmParams);
      }
    }

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

  /**
   * Analytics: Nombres más buscados
   */
  async getNombresMasBuscados(limit = 20) {
    console.log('📊 Obteniendo nombres más buscados');
    return this.request(`/analytics/nombres-mas-buscados?limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * Analytics: Profesores más clickeados
   */
  async getProfesoresMasClickeados(limit = 20) {
    console.log('📊 Obteniendo profesores más clickeados');
    return this.request(`/analytics/profesores-mas-clickeados?limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * Analytics: Top sueldos (mayores)
   */
  async getTopSueldos(limit = 20) {
    console.log('📊 Obteniendo top sueldos');
    return this.request(`/analytics/top-sueldos?limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * Analytics: Bottom sueldos (menores)
   */
  async getBottomSueldos(limit = 20) {
    console.log('📊 Obteniendo bottom sueldos');
    return this.request(`/analytics/bottom-sueldos?limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * Analytics: Estadísticas generales
   */
  async getEstadisticasGenerales() {
    console.log('📊 Obteniendo estadísticas generales');
    return this.request('/analytics/estadisticas-generales', {
      method: 'GET',
    });
  }

  /**
   * UTM Configs: Obtener todas las configuraciones
   */
  async getAllUtmConfigs() {
    console.log('🎯 Obteniendo todas las configuraciones UTM');
    return this.request('/utm-configs', {
      method: 'GET',
    });
  }

  /**
   * UTM Configs: Obtener configuración por key
   */
  async getUtmConfigByKey(key) {
    console.log('🎯 Obteniendo configuración UTM para key:', key);
    return this.request(`/utm-configs/${encodeURIComponent(key)}`, {
      method: 'GET',
    });
  }

  /**
   * UTM Configs: Crear nueva configuración
   */
  async createUtmConfig(config) {
    console.log('🎯 Creando configuración UTM:', config);
    return this.request('/utm-configs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * UTM Configs: Actualizar configuración
   */
  async updateUtmConfig(id, config) {
    console.log('🎯 Actualizando configuración UTM ID:', id);
    return this.request(`/utm-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * UTM Configs: Eliminar configuración
   */
  async deleteUtmConfig(id) {
    console.log('🎯 Eliminando configuración UTM ID:', id);
    return this.request(`/utm-configs/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * UTM Configs: Incrementar contador de vistas
   */
  async incrementUtmViewCount(key) {
    return this.request(`/utm-configs/${encodeURIComponent(key)}/view`, {
      method: 'POST',
    });
  }

  /**
   * UTM Configs: Incrementar contador de clicks
   */
  async incrementUtmClickCount(key) {
    return this.request(`/utm-configs/${encodeURIComponent(key)}/click`, {
      method: 'POST',
    });
  }

  // ============================================
  // TARGETED MESSAGES
  // ============================================

  /**
   * Targeted Messages: Obtener todos los mensajes dirigidos
   */
  async getAllTargetedMessages() {
    console.log('💌 Obteniendo todos los mensajes dirigidos');
    return this.request('/targeted-messages', {
      method: 'GET',
    });
  }

  /**
   * Targeted Messages: Obtener mensajes activos para el usuario actual
   */
  async getActiveTargetedMessages() {
    console.log('💌 Obteniendo mensajes activos para usuario actual');
    return this.request('/targeted-messages/active', {
      method: 'GET',
    });
  }

  /**
   * Targeted Messages: Crear nuevo mensaje dirigido
   */
  async createTargetedMessage(message) {
    console.log('💌 Creando mensaje dirigido:', message);
    return this.request('/targeted-messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  /**
   * Targeted Messages: Actualizar mensaje dirigido
   */
  async updateTargetedMessage(id, message) {
    console.log('💌 Actualizando mensaje dirigido ID:', id);
    return this.request(`/targeted-messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(message),
    });
  }

  /**
   * Targeted Messages: Eliminar mensaje dirigido
   */
  async deleteTargetedMessage(id) {
    console.log('💌 Eliminando mensaje dirigido ID:', id);
    return this.request(`/targeted-messages/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Targeted Messages: Incrementar contador de visualizaciones
   */
  async incrementTargetedMessageShowCount(id) {
    return this.request(`/targeted-messages/${id}/show`, {
      method: 'POST',
    });
  }

  /**
   * Targeted Messages: Incrementar contador de clicks
   */
  async incrementTargetedMessageClickCount(id) {
    return this.request(`/targeted-messages/${id}/click`, {
      method: 'POST',
    });
  }

  // ============================================
  // UTM ANALYTICS
  // ============================================

  /**
   * UTM Analytics: Obtener analytics detallados por fecha
   */
  async getUtmAnalytics() {
    console.log('📊 Obteniendo analytics de UTM');
    return this.request('/utm-analytics', {
      method: 'GET',
    });
  }

  /**
   * UTM Analytics: Obtener resumen de estadísticas por UTM source
   */
  async getUtmAnalyticsSummary() {
    console.log('📊 Obteniendo resumen de analytics de UTM');
    return this.request('/utm-analytics/summary', {
      method: 'GET',
    });
  }

  /**
   * UTM Analytics: Obtener usuarios por UTM source
   */
  async getUsersByUtmSource(utmSource) {
    console.log('📊 Obteniendo usuarios para UTM:', utmSource);
    return this.request(`/utm-analytics/users/${encodeURIComponent(utmSource)}`, {
      method: 'GET',
    });
  }

  /**
   * UTM Analytics: Obtener conteo de usuarios por UTM
   */
  async getUtmUserCounts() {
    console.log('📊 Obteniendo conteo de usuarios por UTM');
    return this.request('/utm-analytics/user-counts', {
      method: 'GET',
    });
  }

  // ============================================
  // PROFESSOR RELATIONS
  // ============================================

  /**
   * Buscar personas con el mismo apellido
   */
  async buscarPorApellido({ apellidoPaterno, apellidoMaterno, excludeProfessorId }) {
    console.log('👨‍👩‍👧‍👦 Buscando personas con apellido:', apellidoPaterno, apellidoMaterno);
    return this.request('/same-lastname', {
      method: 'POST',
      body: JSON.stringify({ apellidoPaterno, apellidoMaterno, excludeProfessorId }),
    });
  }

  /**
   * Buscar personas de la misma institución
   */
  async buscarPorInstitucion({ identificadorGrupo, idEntidadFederativa, sujetoObligado, excludeProfessorId }) {
    console.log('🏛️ Buscando personas de la institución:', sujetoObligado);
    console.log('📋 ID Grupo:', identificadorGrupo);
    return this.request('/same-institution', {
      method: 'POST',
      body: JSON.stringify({ identificadorGrupo, idEntidadFederativa, sujetoObligado, excludeProfessorId }),
    });
  }
}

// Exportar una instancia única del cliente
export const apiClient = new ApiClient();

// Exportar la clase por si se necesita crear instancias personalizadas
export default ApiClient;
