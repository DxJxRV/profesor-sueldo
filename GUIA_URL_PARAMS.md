# 🔗 Guía de Parámetros URL - Búsquedas Compartibles

## 🎯 Descripción General

La página principal (`Home2`) ahora soporta **parámetros URL** que permiten compartir búsquedas específicas. Cuando realizas una búsqueda, la URL se actualiza automáticamente **sin recargar la página**, permitiendo que los usuarios compartan esos enlaces con otras personas.

---

## 📋 Parámetros Disponibles

### 1. `nombre` (requerido para búsquedas con URL)

**Descripción:** El nombre del profesor a buscar.

**Ejemplo:**
```
https://sueldosmexico.com/?nombre=Sheinbaum
```

### 2. `entidad` (opcional)

**Descripción:** Filtra resultados por entidad federativa (estado).

**Ejemplo:**
```
https://sueldosmexico.com/?nombre=Sheinbaum&entidad=Morelos
```

---

## 🚀 Casos de Uso

### Caso 1: URL sin parámetros (Búsqueda por defecto)

**URL:**
```
https://sueldosmexico.com/
```

**Comportamiento:**
- Carga la página
- Ejecuta automáticamente búsqueda de "Sheinbaum"
- **NO** actualiza la URL con parámetros

---

### Caso 2: URL con nombre de profesor

**URL:**
```
https://sueldosmexico.com/?nombre=Mario
```

**Comportamiento:**
1. Carga la página
2. Lee el parámetro `nombre` de la URL
3. Ejecuta búsqueda automática de "Mario"
4. Muestra resultados
5. **Permite compartir este enlace** con otros usuarios

**Flujo:**
```
Usuario entra → Lee ?nombre=Mario → Busca "Mario" → Muestra resultados
```

---

### Caso 3: URL con nombre + entidad federativa

**URL:**
```
https://sueldosmexico.com/?nombre=Juan&entidad=Morelos
```

**Comportamiento:**
1. Carga la página
2. Lee parámetros `nombre` y `entidad`
3. Ejecuta búsqueda de "Juan" filtrada por "Morelos"
4. Pre-selecciona "Morelos" en el filtro de estados
5. Muestra resultados filtrados

**Flujo:**
```
Usuario entra → Lee ?nombre=Juan&entidad=Morelos → Busca "Juan" en Morelos → Muestra resultados filtrados
```

---

## 🔄 Actualización Automática de URL

### Al realizar una búsqueda manual

**Acción del usuario:**
1. Escribe "Sheinbaum" en el campo de búsqueda
2. Presiona "Buscar profesor"

**Resultado:**
- URL se actualiza a: `/?nombre=Sheinbaum`
- **NO recarga la página**
- Usuario puede copiar y compartir la URL actualizada

### Al seleccionar un filtro de estado

**Acción del usuario:**
1. Tiene búsqueda activa de "Sheinbaum"
2. Selecciona filtro "Morelos"

**Resultado:**
- URL se actualiza a: `/?nombre=Sheinbaum&entidad=Morelos`
- **NO recarga la página**
- Ejecuta nueva búsqueda filtrada
- URL es compartible

### Al quitar filtro de estado

**Acción del usuario:**
1. Tiene búsqueda `/?nombre=Sheinbaum&entidad=Morelos`
2. Deselecciona el filtro "Morelos"

**Resultado:**
- URL se actualiza a: `/?nombre=Sheinbaum`
- **NO recarga la página**
- Ejecuta búsqueda sin filtro
- Muestra todos los resultados para "Sheinbaum"

---

## 🧭 Flujo de Navegación

### Desde página de detalle de profesor

**Escenario:**
1. Usuario busca "Mario"
2. URL: `/?nombre=Mario`
3. Hace click en una card de profesor
4. Va a `/profesor/ABC123/Juan%20Pérez`
5. Presiona botón "Volver"

**Resultado:**
- Regresa a `/?nombre=Mario`
- Re-ejecuta búsqueda de "Mario"
- Restaura resultados

---

## 💡 Ejemplos de URLs Reales

### Búsqueda simple
```
https://sueldosmexico.com/?nombre=Claudia
```

### Búsqueda con nombre compuesto (URL encoded)
```
https://sueldosmexico.com/?nombre=Claudia%20Sheinbaum
```

### Búsqueda con filtro de estado
```
https://sueldosmexico.com/?nombre=Juan&entidad=Ciudad%20de%20M%C3%A9xico
```

### Búsqueda específica en Morelos
```
https://sueldosmexico.com/?nombre=Carlos&entidad=Morelos
```

---

## 🔧 Implementación Técnica

### Hooks utilizados

```javascript
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();
```

### Leer parámetros de URL

```javascript
const nombreParam = searchParams.get('nombre');
const entidadParam = searchParams.get('entidad');
```

### Actualizar URL sin recargar

```javascript
const updateURLParams = (nombre, entidad) => {
  const params = new URLSearchParams();
  
  if (nombre) {
    params.set('nombre', nombre);
  }
  
  if (entidad) {
    params.set('entidad', entidad);
  }
  
  // replace: true = no agregar entrada al historial
  setSearchParams(params, { replace: true });
};
```

---

## 🎨 Prioridades de Carga

El sistema maneja 3 casos en orden de prioridad:

### 1. State de React Router (Prioridad más alta)
Cuando vienes de la página de detalle con `location.state.searchName`

**Uso:** Navegación interna de la app

### 2. Parámetros URL
Cuando la URL tiene `?nombre=...`

**Uso:** Enlaces compartidos, acceso directo

### 3. Búsqueda por defecto (Fallback)
Si no hay state ni parámetros

**Uso:** Primera visita a la página principal

---

## 📱 Ejemplos de Compartir

### Compartir en WhatsApp

```
https://sueldosmexico.com/?nombre=Sheinbaum&entidad=Morelos

¡Mira cuánto gana el profesor Sheinbaum en Morelos!
```

### Compartir en redes sociales

```
https://sueldosmexico.com/?nombre=Juan%20P%C3%A9rez

Consulta los sueldos de profesores en instituciones públicas de México 📊
```

### Email

```
Subject: Información salarial - Profesor Mario

Hola,

Te comparto este enlace con la información del profesor Mario:
https://sueldosmexico.com/?nombre=Mario

Saludos
```

---

## ⚠️ Notas Importantes

1. **URL Encoding:** Los espacios y caracteres especiales se codifican automáticamente
   - "Juan Pérez" → "Juan%20P%C3%A9rez"
   - "Ciudad de México" → "Ciudad%20de%20M%C3%A9xico"

2. **No recarga:** Todas las actualizaciones de URL usan `replace: true` para no recargar

3. **Compartible:** Cualquier URL con parámetros puede ser copiada y compartida

4. **SEO Friendly:** Los motores de búsqueda pueden indexar búsquedas específicas

5. **Historial limpio:** Al usar `replace: true`, no se llena el historial del navegador

---

## 🐛 Testing

### Pruebas manuales

1. **Test básico:**
   ```
   Entra a: /?nombre=Test
   Verifica: Se busca "Test" automáticamente
   ```

2. **Test con entidad:**
   ```
   Entra a: /?nombre=Juan&entidad=Morelos
   Verifica: Búsqueda filtrada + filtro pre-seleccionado
   ```

3. **Test de navegación:**
   ```
   1. Busca "Mario" manualmente
   2. Verifica URL cambió a /?nombre=Mario
   3. Recarga página (F5)
   4. Verifica: Búsqueda de "Mario" se ejecuta de nuevo
   ```

4. **Test de filtros:**
   ```
   1. Busca "Sheinbaum"
   2. URL: /?nombre=Sheinbaum
   3. Selecciona "Morelos"
   4. URL actualiza a: /?nombre=Sheinbaum&entidad=Morelos
   5. Deselecciona "Morelos"
   6. URL regresa a: /?nombre=Sheinbaum
   ```

---

## 🚀 Casos de Uso Reales

### Marketing
```
https://sueldosmexico.com/?nombre=Sheinbaum

Úsala en campañas publicitarias para búsquedas específicas
```

### Soporte
```
Usuario reporta problema con búsqueda de "Mario en Morelos"
Soporte puede recrear exactamente con:
https://sueldosmexico.com/?nombre=Mario&entidad=Morelos
```

### Analytics
```
Trackea qué búsquedas compartidas son más populares
analizando parámetros URL en Google Analytics
```

---

¡Ahora tus usuarios pueden compartir búsquedas específicas con un simple enlace! 🎉
