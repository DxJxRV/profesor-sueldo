/**
 * Utilidades para manejar configuraciones UTM personalizadas
 */

import React from 'react';
import { apiClient } from '../services/apiClient';

/**
 * Extrae el parámetro UTM de la URL
 * Busca primero 'src', luego 'utm_source'
 * @param {URLSearchParams} searchParams - Parámetros de búsqueda de la URL
 * @returns {string|null} El valor del parámetro UTM o null
 */
export function getUtmKeyFromUrl(searchParams) {
  // Primero buscar 'src' (más simple)
  const src = searchParams.get('src');
  if (src) {
    return src;
  }

  // Luego buscar 'utm_source'
  const utmSource = searchParams.get('utm_source');
  if (utmSource) {
    return utmSource;
  }

  return null;
}

/**
 * Obtiene la configuración UTM desde el backend
 * @param {string} utmKey - La key UTM a buscar
 * @returns {Promise<Object|null>} La configuración o null si no existe
 */
export async function fetchUtmConfig(utmKey) {
  if (!utmKey) return null;

  try {
    const response = await apiClient.getUtmConfigByKey(utmKey);

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error al obtener configuración UTM:', error);
    return null;
  }
}

/**
 * Registra una vista de la configuración UTM (incrementa contador)
 * @param {string} utmKey - La key UTM
 */
export async function trackUtmView(utmKey) {
  if (!utmKey) return;

  try {
    await apiClient.incrementUtmViewCount(utmKey);
    console.log('✅ Vista UTM registrada:', utmKey);
  } catch (error) {
    console.error('⚠️ Error al registrar vista UTM:', error);
    // No lanzamos error para no afectar la experiencia del usuario
  }
}

/**
 * Registra un click en la configuración UTM (incrementa contador)
 * @param {string} utmKey - La key UTM
 */
export async function trackUtmClick(utmKey) {
  if (!utmKey) return;

  try {
    await apiClient.incrementUtmClickCount(utmKey);
    console.log('✅ Click UTM registrado:', utmKey);
  } catch (error) {
    console.error('⚠️ Error al registrar click UTM:', error);
    // No lanzamos error para no afectar la experiencia del usuario
  }
}

/**
 * Aplica estilos personalizados de la configuración UTM
 * @param {Object} config - Configuración UTM
 * @returns {Object} Objeto con estilos CSS inline
 */
export function getUtmStyles(config) {
  if (!config) return {};

  const styles = {};

  if (config.background_color) {
    styles.backgroundColor = config.background_color;
  }

  if (config.text_color) {
    styles.color = config.text_color;
  }

  return styles;
}

/**
 * Obtiene el texto personalizado o el texto por defecto
 * @param {Object} config - Configuración UTM
 * @param {string} field - Campo a obtener (title, subtitle, button_text, etc.)
 * @param {string} defaultValue - Valor por defecto si no existe
 * @returns {string} El texto personalizado o el valor por defecto
 */
export function getUtmText(config, field, defaultValue = '') {
  if (!config) return defaultValue;

  return config[field] || defaultValue;
}

/**
 * Verifica si hay un profesor sugerido en la configuración
 * @param {Object} config - Configuración UTM
 * @returns {Object|null} Objeto con nombre e ID del profesor o null
 */
export function getSuggestedProfessor(config) {
  if (!config) return null;

  if (config.suggested_name) {
    return {
      name: config.suggested_name,
      id: config.suggested_professor_id || null
    };
  }

  return null;
}

/**
 * Hook personalizado para usar configuración UTM en componentes React
 * Nota: Este es un hook de React, debe usarse dentro de un componente funcional
 */
export function useUtmConfig(searchParams) {
  const [utmConfig, setUtmConfig] = React.useState(null);
  const [utmKey, setUtmKey] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUtmConfig = async () => {
      const key = getUtmKeyFromUrl(searchParams);

      if (!key) {
        setLoading(false);
        return;
      }

      setUtmKey(key);

      const config = await fetchUtmConfig(key);

      if (config) {
        setUtmConfig(config);
        // Registrar vista automáticamente
        await trackUtmView(key);
      }

      setLoading(false);
    };

    loadUtmConfig();
  }, [searchParams]);

  return { utmConfig, utmKey, loading };
}

/**
 * Tracking de evento GA4 para UTM
 * @param {string} eventName - Nombre del evento
 * @param {Object} params - Parámetros adicionales del evento
 */
export function trackUtmEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...params,
      event_category: 'UTM',
      timestamp: new Date().toISOString()
    });
    console.log('📊 Evento GA4 enviado:', eventName, params);
  } else {
    console.warn('⚠️ Google Analytics no está disponible');
  }
}
