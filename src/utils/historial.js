/**
 * Utilidades para el manejo del historial de búsquedas en localStorage
 */

const HISTORIAL_KEY = 'historial_busquedas';
const MAX_HISTORIAL_ITEMS = 10;

/**
 * Obtiene el historial desde localStorage
 * @returns {string[]} Array de nombres buscados
 */
export function getHistorial() {
  try {
    const historial = localStorage.getItem(HISTORIAL_KEY);
    return historial ? JSON.parse(historial) : [];
  } catch (error) {
    console.error('Error al leer historial:', error);
    return [];
  }
}

/**
 * Guarda el historial en localStorage
 * @param {string[]} historial - Array de nombres buscados
 */
export function saveHistorial(historial) {
  try {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  } catch (error) {
    console.error('Error al guardar historial:', error);
  }
}

/**
 * Agrega un nombre al historial (al inicio)
 * - Evita duplicados
 * - Mantiene máximo de items definido
 * @param {string} nombre - Nombre a agregar
 * @returns {string[]} Nuevo historial
 */
export function addToHistorial(nombre) {
  if (!nombre || !nombre.trim()) return getHistorial();

  const nombreTrimmed = nombre.trim();
  let historial = getHistorial();

  // Eliminar el nombre si ya existe (para moverlo al inicio)
  historial = historial.filter(item => item.toLowerCase() !== nombreTrimmed.toLowerCase());

  // Agregar al inicio
  historial.unshift(nombreTrimmed);

  // Mantener solo los últimos N items
  if (historial.length > MAX_HISTORIAL_ITEMS) {
    historial = historial.slice(0, MAX_HISTORIAL_ITEMS);
  }

  saveHistorial(historial);
  return historial;
}

/**
 * Elimina un nombre específico del historial
 * @param {string} nombre - Nombre a eliminar
 * @returns {string[]} Nuevo historial
 */
export function removeFromHistorial(nombre) {
  const historial = getHistorial();
  const nuevoHistorial = historial.filter(
    item => item.toLowerCase() !== nombre.toLowerCase()
  );
  saveHistorial(nuevoHistorial);
  return nuevoHistorial;
}

/**
 * Limpia todo el historial
 */
export function clearHistorial() {
  try {
    localStorage.removeItem(HISTORIAL_KEY);
  } catch (error) {
    console.error('Error al limpiar historial:', error);
  }
}
