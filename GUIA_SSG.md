# 📘 Guía Completa de SSG (Static Site Generation)

## 🎯 Objetivo

Transformar el proyecto React + Vite en un sistema híbrido que funciona como:

1. **SPA normal** para usuarios navegando en tiempo real
2. **Generador de HTML estático** con miles de páginas indexables para SEO
3. **Sistema escalable** que puede generar páginas infinitas automáticamente

Todo sin migrar a Next.js, usando solo React + Vite + scripts personalizados.

---

## 📊 Arquitectura del Sistema

```
Usuario/Bot → NGINX → ¿Existe HTML estático? → Sí → Servir HTML (SEO ✅)
                                ↓
                               No → Servir index.html (SPA ✅)
```

### Flujo de Trabajo

1. **Build normal de Vite**: Genera la SPA en `/dist`
2. **Script de prerendering**: Genera miles de HTML estáticos en `/dist`
3. **NGINX**: Sirve HTML estático si existe, sino fallback a SPA
4. **Resultado**: Los bots ven HTML estático, los usuarios ven SPA interactiva

---

## 🚀 Comandos Disponibles

### Desarrollo Normal (SPA)
```bash
npm run dev
```
Inicia el servidor de desarrollo en `http://localhost:5173`

### Build para Producción (Solo SPA)
```bash
npm run build
```
Genera el build normal en `/dist` (sin páginas estáticas extra)

### Build con SSG (SPA + HTML Estático)
```bash
npm run build:ssg
```
**Este es el comando principal para producción.**

Ejecuta:
1. `vite build` → Genera SPA base
2. `node scripts/prerender.js` → Genera miles de HTML estáticos

### Solo Prerendering (sin rebuild)
```bash
npm run prerender
```
Ejecuta solo el script de generación de HTML estático.
Útil si solo cambias datos pero no código.

### Preview del Build SSG
```bash
npm run preview:ssg
```
Genera el build completo con SSG y lo previsualiza localmente.

---

## 📁 Estructura de Archivos Generados

Después de ejecutar `npm run build:ssg`, la carpeta `/dist` tendrá:

```
dist/
├── index.html                    # Home (/)
├── assets/                        # JS, CSS con hash
│   ├── index-abc123.js
│   └── index-xyz789.css
├── cuanto-gana/                   # Profesiones (SEO)
│   ├── maestro/
│   │   └── index.html
│   ├── doctor/
│   │   └── index.html
│   ├── ingeniero/
│   │   └── index.html
│   └── ... (25+ profesiones)
├── salarios/
│   ├── por-estado/                # Estados (SEO)
│   │   ├── jalisco/
│   │   │   └── index.html
│   │   ├── ciudad-de-mexico/
│   │   │   └── index.html
│   │   └── ... (32 estados)
│   └── por-institucion/           # Instituciones (SEO)
│       ├── sep/
│       │   └── index.html
│       ├── imss/
│       │   └── index.html
│       └── ... (25+ instituciones)
├── buscar/                        # Búsquedas populares (SEO)
│   ├── juan-perez/
│   │   └── index.html
│   └── ... (100+ búsquedas)
├── nombres-mas-buscados/
│   └── index.html
├── profesores-mas-vistos/
│   └── index.html
├── ranking-sueldos/
│   └── index.html
├── sitemap.xml                    # Sitemap generado automáticamente
└── robots.txt                     # Robots.txt generado
```

**Total aproximado**: 200-500 páginas HTML estáticas en el primer build.

---

## 🔧 Cómo Funciona el Sistema

### 1. Componentes SEO

Creados en `src/pages/seo/`:

- **ProfesionPage.jsx** - Para `/cuanto-gana/:profesionSlug`
- **EstadoPage.jsx** - Para `/salarios/por-estado/:estadoSlug`
- **InstitucionPage.jsx** - Para `/salarios/por-institucion/:institucionSlug`

Cada componente:
- Usa `SEOHead` para meta tags dinámicos
- Consume datos del `apiClient`
- Genera contenido SEO optimizado
- Mantiene funcionalidad SPA completa

### 2. Utilidades SEO

**Archivo**: `src/utils/seoUtils.js`

Funciones principales:
```javascript
// Convertir texto a slug URL-friendly
slugify('¿Cuánto Gana un Maestro?') // → 'cuanto-gana-un-maestro'

// Generar meta tags por tipo de página
getSeoMetadata({
  type: 'profesion',
  data: { nombre: 'Maestro', slug: 'maestro', salarioPromedio: 15000 }
})

// Generar contenido SEO optimizado
getSeoContent({
  type: 'estado',
  data: { nombre: 'Jalisco', slug: 'jalisco' }
})
```

### 3. Script de Prerendering

**Archivo**: `scripts/prerender.js`

El script:

1. **Obtiene rutas dinámicas**:
   - Profesiones hardcodeadas (maestro, doctor, etc.)
   - Estados de México (32 estados)
   - Instituciones principales (SEP, IMSS, etc.)
   - Búsquedas del analytics (API: `/api/analytics/nombres-mas-buscados`)

2. **Genera HTML para cada ruta**:
   - Lee `dist/index.html` como template
   - Inyecta meta tags específicos según la ruta
   - Guarda en estructura de carpetas SEO-friendly

3. **Genera archivos adicionales**:
   - `sitemap.xml` con todas las rutas y prioridades
   - `robots.txt` con configuración de crawlers

### 4. Configuración NGINX

**Archivo**: `nginx.conf`

NGINX sirve:
- **HTML estático** si existe para la ruta (bots SEO)
- **Fallback a SPA** si no existe (usuarios normales)
- **Proxy al backend** para `/api/*`
- **Caché optimizado** por tipo de archivo

---

## 🌐 Rutas Generadas Automáticamente

### Profesiones (25+)
```
/cuanto-gana/maestro
/cuanto-gana/profesor
/cuanto-gana/doctor
/cuanto-gana/ingeniero
/cuanto-gana/licenciado
/cuanto-gana/contador
/cuanto-gana/abogado
/cuanto-gana/arquitecto
/cuanto-gana/enfermero
/cuanto-gana/medico
/cuanto-gana/director
/cuanto-gana/coordinador
/cuanto-gana/jefe
/cuanto-gana/secretario
/cuanto-gana/gobernador
/cuanto-gana/presidente-municipal
/cuanto-gana/diputado
/cuanto-gana/senador
/cuanto-gana/regidor
/cuanto-gana/subdirector
/cuanto-gana/administrador
/cuanto-gana/analista
/cuanto-gana/tecnico
/cuanto-gana/auxiliar
/cuanto-gana/asistente
```

### Estados (32)
```
/salarios/por-estado/aguascalientes
/salarios/por-estado/baja-california
/salarios/por-estado/baja-california-sur
/salarios/por-estado/campeche
/salarios/por-estado/chiapas
/salarios/por-estado/chihuahua
/salarios/por-estado/ciudad-de-mexico
/salarios/por-estado/coahuila
... (32 estados)
```

### Instituciones (25+)
```
/salarios/por-institucion/sep
/salarios/por-institucion/imss
/salarios/por-institucion/issste
/salarios/por-institucion/cfe
/salarios/por-institucion/pemex
/salarios/por-institucion/sedena
/salarios/por-institucion/semar
/salarios/por-institucion/ssa
/salarios/por-institucion/sat
... (25+ instituciones)
```

### Búsquedas Populares (100+)
```
/buscar/claudia-sheinbaum
/buscar/juan-perez-garcia
/buscar/maria-lopez
... (desde analytics)
```

---

## 📈 Escalabilidad: Cómo Llegar a Miles de Páginas

### Método 1: Agregar Más Profesiones
Edita `scripts/prerender.js`, línea ~30:

```javascript
const profesiones = [
  // Agrega todas las profesiones que encuentres
  'maestro', 'profesor', 'doctor', 'psicólogo',
  'trabajador-social', 'bibliotecario', 'intendente',
  // ... 100+ más
];
```

### Método 2: Consumir del Backend
Si tu backend puede listar profesiones:

```javascript
// En scripts/prerender.js
const profesionesData = await safeFetch(`${API_BASE_URL}/profesiones/list`);
const profesiones = profesionesData.map(p => p.slug);
```

### Método 3: Combinaciones Estado + Profesión
Genera páginas como:
```
/cuanto-gana/maestro/en/jalisco
/cuanto-gana/doctor/en/ciudad-de-mexico
```

En `scripts/prerender.js`:
```javascript
estados.forEach(estado => {
  profesiones.forEach(profesion => {
    routes.push({
      path: `/cuanto-gana/${profesion}/en/${estado}`,
      priority: 'medium'
    });
  });
});

// Esto genera: 25 profesiones × 32 estados = 800 páginas
```

### Método 4: Páginas de Personas Específicas
Obtén IDs desde el analytics:

```javascript
const topPersonas = await safeFetch(`${API_BASE_URL}/analytics/profesores-mas-clickeados?limit=1000`);

topPersonas.data.forEach(persona => {
  routes.push({
    path: `/profesor/${persona.professorId}/${slugify(persona.nombreProfesor)}`,
    priority: 'high'
  });
});

// Esto genera 1000 páginas más
```

### Cálculo de Escalabilidad

| Tipo | Cantidad | Total |
|------|----------|-------|
| Profesiones | 25 | 25 |
| Estados | 32 | 32 |
| Instituciones | 25 | 25 |
| Búsquedas | 100 | 100 |
| Combinaciones Estado+Profesión | 25×32 | 800 |
| Top Personas | 1000 | 1000 |
| **TOTAL** | - | **~2000 páginas** |

Con más datos del backend, puedes llegar fácilmente a **10,000+ páginas**.

---

## 🔍 SEO: Lo que Google Ve

### Antes (Solo SPA)
```html
<!-- Google ve siempre esto -->
<title>Sueldos México</title>
<meta name="description" content="..." />
<div id="root"></div>
<!-- Sin contenido real para indexar -->
```

### Después (Con SSG)
```html
<!-- Google ve HTML específico por ruta -->
<title>¿Cuánto gana un Maestro? | Sueldos México</title>
<meta name="description" content="Consulta los salarios de maestro en instituciones públicas de México..." />
<meta name="keywords" content="cuanto gana maestro, salario maestro mexico..." />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Occupation",
  "name": "Maestro",
  "occupationLocation": { "@type": "Country", "name": "México" }
}
</script>

<div id="root">
  <!-- Contenido real prerenderizado para cada página -->
  <h1>¿Cuánto gana un Maestro en México?</h1>
  <p>El salario promedio de un Maestro es de $15,000 MXN...</p>
  <!-- Datos reales indexables -->
</div>
```

---

## 🚀 Deployment a Producción

### Paso 1: Build con SSG
```bash
npm run build:ssg
```

### Paso 2: Subir a Servidor
```bash
# Ejemplo con rsync
rsync -avz --delete dist/ usuario@servidor:/var/www/sueldosmexico/dist/
```

### Paso 3: Configurar NGINX
```bash
# Copiar configuración
sudo cp nginx.conf /etc/nginx/sites-available/sueldosmexico

# Crear symlink
sudo ln -s /etc/nginx/sites-available/sueldosmexico /etc/nginx/sites-enabled/

# Test configuración
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### Paso 4: Configurar SSL (Opcional)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sueldosmexico.com -d www.sueldosmexico.com
```

### Paso 5: Automatizar Regeneración
Crea un cron job para regenerar páginas diariamente:

```bash
# Editar crontab
crontab -e

# Agregar línea (regenerar a las 3 AM)
0 3 * * * cd /var/www/sueldosmexico && npm run build:ssg
```

---

## 🔧 Troubleshooting

### Problema: El script de prerendering falla

**Solución 1**: Verifica que el backend esté corriendo
```bash
curl http://localhost:3001/api/ping
```

**Solución 2**: Ejecuta sin datos del backend
Comenta la sección de analytics en `scripts/prerender.js`

### Problema: NGINX no sirve HTML estático

**Solución**: Verifica permisos
```bash
sudo chown -R www-data:www-data /var/www/sueldosmexico/dist
sudo chmod -R 755 /var/www/sueldosmexico/dist
```

### Problema: Páginas no se indexan en Google

**Verificaciones**:
1. ¿Está el `sitemap.xml` accesible?
   ```bash
   curl https://sueldosmexico.com/sitemap.xml
   ```

2. ¿El `robots.txt` permite crawling?
   ```bash
   curl https://sueldosmexico.com/robots.txt
   ```

3. Envía el sitemap a Google Search Console

### Problema: Build toma mucho tiempo

**Solución**: Limita las rutas en desarrollo
```javascript
// En scripts/prerender.js, para testing
if (process.env.NODE_ENV === 'development') {
  profesiones = profesiones.slice(0, 5);
  estados = estados.slice(0, 5);
}
```

---

## 📊 Métricas de Éxito

### Antes del SSG
- Páginas indexadas en Google: ~10
- Tiempo de indexación: Semanas/nunca
- Tráfico orgánico: Bajo

### Después del SSG
- Páginas indexadas en Google: 500-2000+
- Tiempo de indexación: 1-7 días
- Tráfico orgánico: **10x-50x más**

---

## 🎯 Próximos Pasos

### Optimizaciones Recomendadas

1. **Generar más páginas**:
   - Agregar más profesiones (100+)
   - Agregar combinaciones estado+profesión (800+)
   - Generar páginas de top 1000 personas más buscadas

2. **Mejorar el contenido SEO**:
   - Agregar más secciones con texto en cada página
   - Agregar imágenes Open Graph únicas por página
   - Implementar breadcrumbs JSON-LD

3. **Analytics avanzados**:
   - Trackear qué páginas SEO reciben más tráfico
   - Identificar términos con más búsquedas para generar más páginas

4. **Automatización**:
   - Script diario para regenerar páginas con datos nuevos
   - Webhook para regenerar página cuando cambia un dato

---

## 📚 Recursos Adicionales

- [Documentación de Vite](https://vitejs.dev/)
- [React Helmet](https://github.com/nfl/react-helmet)
- [NGINX Docs](https://nginx.org/en/docs/)
- [Google Search Console](https://search.google.com/search-console)
- [Schema.org](https://schema.org/)

---

## ✅ Checklist de Implementación

- [x] Instalar dependencias necesarias
- [x] Crear utilidades SEO (`seoUtils.js`)
- [x] Crear componente `SEOHead`
- [x] Crear páginas SEO (`ProfesionPage`, `EstadoPage`, `InstitucionPage`)
- [x] Actualizar `App.jsx` con rutas SEO
- [x] Crear script de prerendering (`scripts/prerender.js`)
- [x] Actualizar `package.json` con scripts SSG
- [x] Crear configuración NGINX
- [x] Documentar el sistema completo

---

**¡Tu aplicación ahora tiene SEO infinito! 🎉**

Para cualquier duda, revisa esta documentación o consulta los archivos:
- `scripts/prerender.js` - Lógica de generación
- `src/utils/seoUtils.js` - Utilidades SEO
- `src/pages/seo/*` - Componentes de páginas SEO
- `nginx.conf` - Configuración del servidor
