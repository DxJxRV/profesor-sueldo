/**
 * Script de Prerendering para generar HTML estático
 *
 * Este script:
 * 1. Obtiene rutas dinámicas del backend
 * 2. Genera HTML estático para cada ruta usando React SSR
 * 3. Guarda los archivos en dist/ con estructura SEO-friendly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';
const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

/**
 * Función para hacer fetch con manejo de errores
 */
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.warn(`⚠️  HTTP ${response.status} para ${url}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`⚠️  Error fetching ${url}:`, error.message);
    return null;
  }
}

/**
 * Obtiene todas las rutas dinámicas del backend
 */
async function getAllRoutes() {
  console.log('📡 Obteniendo rutas dinámicas del backend...\n');

  const routes = [];

  // 1. Profesiones más comunes
  const profesiones = [
    'maestro', 'profesor', 'doctor', 'ingeniero', 'licenciado',
    'contador', 'abogado', 'arquitecto', 'enfermero', 'medico',
    'director', 'coordinador', 'jefe', 'secretario', 'gobernador',
    'presidente-municipal', 'diputado', 'senador', 'regidor',
    'subdirector', 'administrador', 'analista', 'tecnico',
    'auxiliar', 'asistente', 'supervisor', 'inspector'
  ];

  profesiones.forEach(prof => {
    routes.push({
      path: `/cuanto-gana/${prof}`,
      priority: 'high'
    });
  });

  console.log(`✅ ${profesiones.length} rutas de profesiones`);

  // 2. Estados de México
  const estados = [
    'aguascalientes', 'baja-california', 'baja-california-sur',
    'campeche', 'chiapas', 'chihuahua', 'ciudad-de-mexico',
    'coahuila', 'colima', 'durango', 'guanajuato', 'guerrero',
    'hidalgo', 'jalisco', 'mexico', 'michoacan', 'morelos',
    'nayarit', 'nuevo-leon', 'oaxaca', 'puebla', 'queretaro',
    'quintana-roo', 'san-luis-potosi', 'sinaloa', 'sonora',
    'tabasco', 'tamaulipas', 'tlaxcala', 'veracruz',
    'yucatan', 'zacatecas'
  ];

  estados.forEach(estado => {
    routes.push({
      path: `/salarios/por-estado/${estado}`,
      priority: 'high'
    });
  });

  console.log(`✅ ${estados.length} rutas de estados`);

  // 3. Instituciones principales
  const instituciones = [
    'sep', 'imss', 'issste', 'cfe', 'pemex', 'sedena', 'semar',
    'ssa', 'sct', 'sre', 'shcp', 'segob', 'semarnat', 'sectur',
    'conacyt', 'inegi', 'sat', 'profeco', 'condusef', 'conapred',
    'cndh', 'ine', 'tribunal-electoral', 'scjn', 'fgr'
  ];

  instituciones.forEach(inst => {
    routes.push({
      path: `/salarios/por-institucion/${inst}`,
      priority: 'medium'
    });
  });

  console.log(`✅ ${instituciones.length} rutas de instituciones`);

  // 4. Intentar obtener búsquedas del analytics
  try {
    const topBusquedas = await safeFetch(`${API_BASE_URL}/analytics/nombres-mas-buscados?limit=100`);

    if (topBusquedas && topBusquedas.data) {
      topBusquedas.data.forEach(busqueda => {
        const slug = busqueda.nombre_profesor
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '');

        routes.push({
          path: `/buscar/${slug}`,
          priority: 'medium'
        });
      });
      console.log(`✅ ${topBusquedas.data.length} rutas de búsquedas populares`);
    }
  } catch (error) {
    console.warn('⚠️  No se pudieron obtener búsquedas del analytics');
  }

  // 5. Rutas estáticas importantes
  const staticRoutes = [
    { path: '/', priority: 'high' },
    { path: '/nombres-mas-buscados', priority: 'high' },
    { path: '/profesores-mas-vistos', priority: 'high' },
    { path: '/ranking-sueldos', priority: 'high' },
    { path: '/politicas-cookies', priority: 'low' },
    { path: '/aviso-legal', priority: 'low' },
    { path: '/politica-privacidad', priority: 'low' },
    { path: '/contacto', priority: 'medium' }
  ];

  routes.push(...staticRoutes);
  console.log(`✅ ${staticRoutes.length} rutas estáticas\n`);

  console.log(`📊 Total de rutas a generar: ${routes.length}\n`);

  return routes;
}

/**
 * Genera HTML para una ruta específica
 */
async function generateHtmlForRoute(route, template) {
  const { path: routePath } = route;

  // Leer el template HTML
  let html = template;

  // Inyectar meta tags básicos según la ruta
  const metaTags = getMetaTagsForRoute(routePath);
  html = injectMetaTags(html, metaTags);

  // Crear directorio de destino
  const outputPath = getOutputPath(routePath);
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Guardar archivo
  fs.writeFileSync(outputPath, html, 'utf-8');

  return outputPath;
}

/**
 * Obtiene meta tags según la ruta
 */
function getMetaTagsForRoute(routePath) {
  if (routePath === '/') {
    return {
      title: 'Sueldos México - ¿Cuánto Gana mi Servidor Público?',
      description: 'Consulta información salarial de gobernadores, funcionarios SEP, IMSS y miles de servidores públicos en México.',
      keywords: 'sueldos mexico, salarios servidores publicos, cuanto gana gobernador'
    };
  }

  if (routePath.startsWith('/cuanto-gana/')) {
    const profesion = routePath.split('/').pop().replace(/-/g, ' ');
    return {
      title: `¿Cuánto gana un ${profesion}? | Sueldos México`,
      description: `Consulta los salarios de ${profesion} en instituciones públicas de México. Información actualizada de sueldos 2024-2025.`,
      keywords: `cuanto gana ${profesion}, salario ${profesion} mexico, sueldo ${profesion}`
    };
  }

  if (routePath.startsWith('/salarios/por-estado/')) {
    const estado = routePath.split('/').pop().replace(/-/g, ' ');
    return {
      title: `Sueldos en ${estado} | Salarios Servidores Públicos`,
      description: `Consulta los sueldos de servidores públicos en ${estado}. Rankings salariales y estadísticas actualizadas.`,
      keywords: `sueldos ${estado}, salarios ${estado}, servidores publicos ${estado}`
    };
  }

  if (routePath.startsWith('/salarios/por-institucion/')) {
    const institucion = routePath.split('/').pop().replace(/-/g, ' ').toUpperCase();
    return {
      title: `Sueldos en ${institucion} | Salarios y Nómina`,
      description: `Consulta los sueldos de empleados en ${institucion}. Información detallada de salarios y estadísticas.`,
      keywords: `sueldos ${institucion}, salarios ${institucion}, nomina ${institucion}`
    };
  }

  return {
    title: 'Sueldos México - Consulta Salarios de Servidores Públicos',
    description: 'Plataforma de transparencia salarial de servidores públicos en México.',
    keywords: 'sueldos mexico, salarios, transparencia'
  };
}

/**
 * Inyecta meta tags en el HTML
 */
function injectMetaTags(html, metaTags) {
  // Reemplazar título
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${metaTags.title}</title>`
  );

  // Inyectar meta description si no existe
  if (!html.includes('name="description"')) {
    html = html.replace(
      '</head>',
      `  <meta name="description" content="${metaTags.description}" />\n  </head>`
    );
  } else {
    html = html.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${metaTags.description}" />`
    );
  }

  // Inyectar keywords
  if (!html.includes('name="keywords"')) {
    html = html.replace(
      '</head>',
      `  <meta name="keywords" content="${metaTags.keywords}" />\n  </head>`
    );
  } else {
    html = html.replace(
      /<meta name="keywords" content=".*?" \/>/,
      `<meta name="keywords" content="${metaTags.keywords}" />`
    );
  }

  return html;
}

/**
 * Obtiene la ruta de salida para un path
 */
function getOutputPath(routePath) {
  if (routePath === '/') {
    return path.join(DIST_DIR, 'index.html');
  }

  // Limpiar path y crear estructura de carpetas
  const cleanPath = routePath.replace(/^\//, '').replace(/\/$/, '');
  return path.join(DIST_DIR, cleanPath, 'index.html');
}

/**
 * Genera sitemap.xml
 */
function generateSitemap(routes) {
  const baseUrl = 'https://sueldosmexico.com';
  const date = new Date().toISOString().split('T')[0];

  const urls = routes.map(route => {
    const priority = route.priority === 'high' ? '1.0' : route.priority === 'medium' ? '0.8' : '0.5';
    const changefreq = route.priority === 'high' ? 'daily' : 'weekly';

    return `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8');

  console.log(`✅ Sitemap generado: ${sitemapPath}`);
}

/**
 * Genera robots.txt
 */
function generateRobotsTxt() {
  const robots = `User-agent: *
Allow: /

Sitemap: https://sueldosmexico.com/sitemap.xml

# Bloquear páginas administrativas
Disallow: /dxjx663
`;

  const robotsPath = path.join(DIST_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robots, 'utf-8');

  console.log(`✅ robots.txt generado: ${robotsPath}`);
}

/**
 * Función principal
 */
async function main() {
  console.log('\n🚀 Iniciando generación de páginas estáticas SSG\n');
  console.log('='.repeat(60));
  console.log('\n');

  // Verificar que existe el build
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('❌ Error: No existe dist/index.html');
    console.error('   Primero ejecuta: npm run build');
    process.exit(1);
  }

  // Leer template
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Obtener rutas
  const routes = await getAllRoutes();

  // Generar HTML para cada ruta
  console.log('📝 Generando páginas HTML...\n');

  let generated = 0;
  let errors = 0;

  for (const route of routes) {
    try {
      await generateHtmlForRoute(route, template);
      generated++;

      if (generated % 50 === 0) {
        console.log(`   Generadas: ${generated}/${routes.length}`);
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error en ${route.path}:`, error.message);
    }
  }

  console.log(`\n✅ Páginas generadas: ${generated}`);
  if (errors > 0) {
    console.log(`⚠️  Errores: ${errors}`);
  }
  console.log('');

  // Generar sitemap y robots.txt
  generateSitemap(routes);
  generateRobotsTxt();

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ ¡Prerendering completado con éxito!\n');
  console.log(`📊 Estadísticas:`);
  console.log(`   - Rutas generadas: ${generated}`);
  console.log(`   - Directorio: ${DIST_DIR}`);
  console.log(`   - Sitemap: ${path.join(DIST_DIR, 'sitemap.xml')}`);
  console.log(`   - Robots: ${path.join(DIST_DIR, 'robots.txt')}`);
  console.log('\n');
}

// Ejecutar
main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
