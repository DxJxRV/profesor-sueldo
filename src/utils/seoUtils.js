/**
 * Utilidades para SEO y generación de slugs
 */

/**
 * Convierte un texto en un slug URL-friendly
 * @param {string} text - Texto a convertir
 * @returns {string} Slug generado
 */
export function slugify(text) {
  if (!text) return '';

  return text
    .toString()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^\w\-]+/g, '') // Eliminar caracteres especiales
    .replace(/\-\-+/g, '-') // Múltiples guiones a uno
    .replace(/^-+/, '') // Eliminar guiones al inicio
    .replace(/-+$/, ''); // Eliminar guiones al final
}

/**
 * Genera meta tags SEO para diferentes tipos de páginas
 * @param {Object} config - Configuración de la página
 * @returns {Object} Meta tags para react-helmet
 */
export function getSeoMetadata(config) {
  const { type, data } = config;

  const baseUrl = 'https://sueldosmexico.com';
  let metadata = {
    title: 'Sueldos México - Consulta Salarios de Servidores Públicos',
    description: 'Consulta los sueldos y salarios de servidores públicos en México.',
    keywords: 'sueldos mexico, salarios servidores publicos',
    canonical: baseUrl,
    ogImage: `${baseUrl}/og-default.jpg`
  };

  switch (type) {
    case 'home':
      metadata = {
        title: 'Sueldos México - ¿Cuánto Gana mi Servidor Público?',
        description: 'Consulta información salarial de gobernadores, funcionarios SEP, IMSS y miles de servidores públicos en México. Base de datos actualizada 2024-2025.',
        keywords: 'sueldos mexico, salarios servidores publicos, cuanto gana gobernador, sueldos sep, salarios imss, transparencia mexico',
        canonical: baseUrl,
        ogImage: `${baseUrl}/og-home.jpg`
      };
      break;

    case 'profesion':
      metadata = {
        title: `¿Cuánto gana un ${data.nombre}? | Sueldos México`,
        description: `Consulta los salarios de ${data.nombre} en instituciones públicas de México. Información actualizada de sueldos, promedios y estadísticas ${new Date().getFullYear()}.`,
        keywords: `cuanto gana ${data.nombre}, salario ${data.nombre} mexico, sueldo ${data.nombre}, ${data.nombre} salario promedio`,
        canonical: `${baseUrl}/cuanto-gana/${data.slug}`,
        ogImage: `${baseUrl}/og-profesion-${data.slug}.jpg`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Occupation",
          "name": data.nombre,
          "occupationLocation": {
            "@type": "Country",
            "name": "México"
          },
          "estimatedSalary": data.salarioPromedio ? {
            "@type": "MonetaryAmount",
            "currency": "MXN",
            "value": {
              "@type": "QuantitativeValue",
              "value": data.salarioPromedio
            }
          } : undefined
        }
      };
      break;

    case 'estado':
      metadata = {
        title: `Sueldos en ${data.nombre} | Salarios Servidores Públicos`,
        description: `Consulta los sueldos de servidores públicos en ${data.nombre}. Rankings salariales, instituciones y estadísticas actualizadas de ${data.nombre}, México.`,
        keywords: `sueldos ${data.nombre}, salarios ${data.nombre}, servidores publicos ${data.nombre}, cuanto ganan en ${data.nombre}`,
        canonical: `${baseUrl}/salarios/por-estado/${data.slug}`,
        ogImage: `${baseUrl}/og-estado-${data.slug}.jpg`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "GovernmentOrganization",
          "name": `Gobierno de ${data.nombre}`,
          "address": {
            "@type": "PostalAddress",
            "addressRegion": data.nombre,
            "addressCountry": "MX"
          }
        }
      };
      break;

    case 'institucion':
      metadata = {
        title: `Sueldos en ${data.nombre} | Salarios y Nómina`,
        description: `Consulta los sueldos de empleados en ${data.nombre}. Información detallada de salarios, puestos y estadísticas salariales de esta institución pública mexicana.`,
        keywords: `sueldos ${data.nombre}, salarios ${data.nombre}, nomina ${data.nombre}, cuanto paga ${data.nombre}`,
        canonical: `${baseUrl}/salarios/por-institucion/${data.slug}`,
        ogImage: `${baseUrl}/og-institucion-${data.slug}.jpg`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "GovernmentOrganization",
          "name": data.nombre,
          "location": data.entidadFederativa ? {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressRegion": data.entidadFederativa,
              "addressCountry": "MX"
            }
          } : undefined
        }
      };
      break;

    case 'persona':
      metadata = {
        title: `${data.nombre} - Sueldo y Salario | Sueldos México`,
        description: `Consulta el sueldo de ${data.nombre} en ${data.institucion || 'institución pública'}. Información detallada de salario actual, histórico y evolución salarial.`,
        keywords: `sueldo ${data.nombre}, salario ${data.nombre}, cuanto gana ${data.nombre}, ${data.nombre} salario`,
        canonical: `${baseUrl}/profesor/${data.id}/${data.slug}`,
        ogImage: `${baseUrl}/og-persona-${data.id}.jpg`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": data.nombre,
          "jobTitle": data.puesto || "Servidor Público",
          "worksFor": data.institucion ? {
            "@type": "Organization",
            "name": data.institucion
          } : undefined,
          "address": data.estado ? {
            "@type": "PostalAddress",
            "addressRegion": data.estado,
            "addressCountry": "MX"
          } : undefined
        }
      };
      break;

    case 'busqueda':
      metadata = {
        title: `Resultados: "${data.termino}" | Sueldos México`,
        description: `Resultados de búsqueda para "${data.termino}". Encuentra información salarial de servidores públicos relacionados con ${data.termino} en México.`,
        keywords: `${data.termino} sueldos, ${data.termino} salarios, buscar ${data.termino}`,
        canonical: `${baseUrl}/buscar/${data.slug}`,
        ogImage: `${baseUrl}/og-busqueda.jpg`
      };
      break;

    case 'ranking-top':
      metadata = {
        title: 'Top Sueldos Más Altos en México | Rankings Salariales',
        description: 'Descubre los sueldos más altos de servidores públicos en México. Ranking actualizado con los salarios más elevados del sector público mexicano.',
        keywords: 'sueldos mas altos mexico, top salarios mexico, servidores publicos mejor pagados, ranking sueldos',
        canonical: `${baseUrl}/ranking-sueldos-altos`,
        ogImage: `${baseUrl}/og-ranking-top.jpg`
      };
      break;

    case 'ranking-bottom':
      metadata = {
        title: 'Sueldos Más Bajos en México | Rankings Salariales',
        description: 'Consulta los sueldos más bajos de servidores públicos en México. Ranking actualizado con los salarios más bajos del sector público mexicano.',
        keywords: 'sueldos mas bajos mexico, salarios bajos servidores publicos, ranking sueldos mexico',
        canonical: `${baseUrl}/ranking-sueldos-bajos`,
        ogImage: `${baseUrl}/og-ranking-bottom.jpg`
      };
      break;

    case 'nombres-buscados':
      metadata = {
        title: 'Nombres Más Buscados | Sueldos México',
        description: 'Descubre qué servidores públicos están siendo más buscados en México. Ranking actualizado de las búsquedas más populares en transparencia salarial.',
        keywords: 'nombres mas buscados, servidores publicos populares, busquedas sueldos mexico',
        canonical: `${baseUrl}/nombres-mas-buscados`,
        ogImage: `${baseUrl}/og-nombres-buscados.jpg`
      };
      break;

    case 'profesores-vistos':
      metadata = {
        title: 'Servidores Públicos Más Vistos | Sueldos México',
        description: 'Ranking de los perfiles de servidores públicos más consultados. Descubre qué funcionarios están recibiendo más atención en transparencia salarial.',
        keywords: 'servidores publicos mas vistos, perfiles mas consultados, transparencia mexico',
        canonical: `${baseUrl}/profesores-mas-vistos`,
        ogImage: `${baseUrl}/og-profesores-vistos.jpg`
      };
      break;

    default:
      break;
  }

  return metadata;
}

/**
 * Genera contenido optimizado para SEO
 * @param {Object} config - Configuración de contenido
 * @returns {Object} Contenido SEO
 */
export function getSeoContent(config) {
  const { type, data } = config;

  let content = {
    h1: '',
    intro: '',
    sections: []
  };

  switch (type) {
    case 'profesion':
      content = {
        h1: `¿Cuánto gana un ${data.nombre} en México?`,
        intro: `Consulta información detallada sobre los sueldos de ${data.nombre} en instituciones públicas de México. Base de datos actualizada con información salarial real y verificada.`,
        sections: [
          {
            title: `Salario Promedio de ${data.nombre}`,
            content: data.salarioPromedio ?
              `El salario promedio de un ${data.nombre} en el sector público mexicano es de ${formatCurrency(data.salarioPromedio)} MXN mensuales.` :
              `Los salarios de ${data.nombre} varían significativamente según la institución y ubicación geográfica.`
          },
          {
            title: 'Instituciones que Emplean',
            content: `Encuentra ${data.nombre} trabajando en diversas instituciones públicas a nivel federal, estatal y municipal en toda la República Mexicana.`
          },
          {
            title: 'Transparencia Salarial',
            content: 'Toda la información proviene de la Plataforma Nacional de Transparencia, garantizando datos oficiales y verificados.'
          }
        ]
      };
      break;

    case 'estado':
      content = {
        h1: `Sueldos de Servidores Públicos en ${data.nombre}`,
        intro: `Consulta los sueldos y salarios de funcionarios públicos en ${data.nombre}. Información actualizada de instituciones estatales y municipales.`,
        sections: [
          {
            title: `Principales Instituciones en ${data.nombre}`,
            content: `Descubre los sueldos en las principales instituciones públicas de ${data.nombre}, incluyendo gobierno estatal, secretarías, institutos y organismos descentralizados.`
          },
          {
            title: 'Rankings Salariales',
            content: `Compara los sueldos más altos y más bajos de servidores públicos en ${data.nombre}. Información transparente y verificada.`
          }
        ]
      };
      break;

    case 'institucion':
      content = {
        h1: `Sueldos en ${data.nombre}`,
        intro: `Consulta la nómina y sueldos de empleados en ${data.nombre}. Información detallada de salarios por puesto y área.`,
        sections: [
          {
            title: 'Estructura Salarial',
            content: `Conoce la estructura salarial completa de ${data.nombre}, desde los sueldos más bajos hasta los más altos dentro de la organización.`
          },
          {
            title: 'Puestos y Salarios',
            content: 'Explora los diferentes puestos disponibles y sus respectivos salarios en esta institución pública.'
          }
        ]
      };
      break;

    default:
      content = {
        h1: 'Sueldos México',
        intro: 'Plataforma de consulta de sueldos de servidores públicos en México.',
        sections: []
      };
  }

  return content;
}

/**
 * Formatea una cantidad a moneda MXN
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'N/A';

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Extrae profesiones únicas de resultados de búsqueda
 * @param {Array} resultados - Array de resultados
 * @returns {Array} Array de profesiones únicas con slugs
 */
export function extractProfesiones(resultados) {
  const profesionesMap = new Map();

  resultados.forEach(resultado => {
    // Intentar extraer profesión del nombre o puesto
    const puesto = resultado.puesto || resultado.nombre || '';
    const palabras = puesto.toLowerCase().split(' ');

    // Palabras clave que indican profesiones
    const profesiones = [
      'maestro', 'profesor', 'doctor', 'ingeniero', 'licenciado',
      'contador', 'abogado', 'arquitecto', 'enfermero', 'médico',
      'director', 'coordinador', 'jefe', 'secretario', 'gobernador',
      'presidente', 'diputado', 'senador', 'regidor', 'alcalde'
    ];

    palabras.forEach(palabra => {
      if (profesiones.includes(palabra)) {
        const profesion = palabra.charAt(0).toUpperCase() + palabra.slice(1);
        if (!profesionesMap.has(profesion)) {
          profesionesMap.set(profesion, {
            nombre: profesion,
            slug: slugify(profesion),
            count: 0
          });
        }
        const item = profesionesMap.get(profesion);
        item.count++;
      }
    });
  });

  return Array.from(profesionesMap.values())
    .sort((a, b) => b.count - a.count);
}
