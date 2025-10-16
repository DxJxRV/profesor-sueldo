import { Helmet } from "react-helmet";
import "./LegalPages.css";

function PoliticasCookies() {
  return (
    <div className="legal-page">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Política de Cookies | Sueldos México</title>
        <meta
          name="description"
          content="Consulta la Política de Cookies de Sueldos México. Conoce qué tipos de cookies utilizamos, cómo funcionan y cómo puedes gestionarlas."
        />
        <meta
          name="keywords"
          content="política de cookies, cookies sueldos México, Google AdSense, cookies analíticas, control de cookies, RGPD"
        />
        <meta name="author" content="Sueldos México" />
        <link
          rel="canonical"
          href="https://sueldosmexico.com/politica-cookies"
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Política de Cookies | Sueldos México"
        />
        <meta
          property="og:description"
          content="Conoce cómo Sueldos México utiliza cookies, incluyendo Google AdSense y analíticas, y cómo puedes gestionarlas desde tu navegador."
        />
        <meta
          property="og:url"
          content="https://sueldosmexico.com/politica-cookies"
        />
        <meta property="og:site_name" content="Sueldos México" />
        <meta property="og:type" content="website" />

        {/* Datos estructurados (schema.org) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Política de Cookies - Sueldos México",
            url: "https://sueldosmexico.com/politica-cookies",
            description:
              "Consulta la política de cookies de Sueldos México, qué tipos de cookies utilizamos, su finalidad y cómo gestionarlas.",
            publisher: {
              "@type": "Organization",
              name: "Sueldos México",
              url: "https://sueldosmexico.com",
              email: "contacto@sueldosmexico.com",
              logo: "https://sueldosmexico.com/logo.png",
            },
          })}
        </script>
      </Helmet>

      <div className="legal-container">
        <h1 className="legal-title">Política de Cookies</h1>

        <section className="legal-section">
          <h2>¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en su
            dispositivo cuando visita nuestro sitio web. Estas cookies nos
            permiten mejorar su experiencia de usuario, optimizar el
            funcionamiento del sitio y recordar sus preferencias.
          </p>
        </section>

        <section className="legal-section">
          <h2>Tipos de cookies que utilizamos</h2>

          <h3>Cookies necesarias</h3>
          <p>
            Estas cookies son esenciales para el funcionamiento básico del sitio
            web y permiten funciones como la navegación o el acceso a áreas
            seguras. No pueden desactivarse desde nuestros sistemas.
          </p>

          <h3>Cookies de publicidad (Google AdSense)</h3>
          <p>
            Utilizamos Google AdSense para mostrar anuncios personalizados.
            Google puede usar cookies para mostrar anuncios basados en sus
            visitas previas a este u otros sitios web. Estas cookies permiten
            ofrecer anuncios más relevantes para cada usuario.
          </p>
          <p>
            Puede obtener más información o inhabilitar el uso de cookies de
            publicidad personalizada visitando la{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              página de configuración de anuncios de Google
            </a>
            .
          </p>

          <h3>Cookies analíticas</h3>
          <p>
            Estas cookies recopilan información anónima sobre cómo los usuarios
            interactúan con nuestro sitio web. Nos ayudan a entender qué
            páginas son más visitadas y cómo mejorar el rendimiento general.
          </p>
        </section>

        <section className="legal-section">
          <h2>Control y gestión de cookies</h2>
          <p>
            Usted puede controlar y/o eliminar las cookies como prefiera. Puede
            eliminar todas las cookies almacenadas en su dispositivo y
            configurar la mayoría de los navegadores para bloquear su uso. Sin
            embargo, esto podría afectar el funcionamiento de algunas partes del
            sitio.
          </p>
          <p>
            Para más información sobre cómo gestionar las cookies en su
            navegador, puede consultar los siguientes enlaces:
          </p>
          <ul>
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/es-es/topic/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d"
                target="_blank"
                rel="noopener noreferrer"
              >
                Microsoft Edge
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
              >
                Safari
              </a>
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Más información</h2>
          <p>
            Para conocer más sobre cómo Google utiliza las cookies en
            publicidad, puede visitar la{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de tecnologías publicitarias de Google
            </a>
            .
          </p>
          <p>
            Si tiene dudas o comentarios sobre nuestra Política de Cookies,
            puede contactarnos en{" "}
            <a href="mailto:contacto@sueldosmexico.com">
              contacto@sueldosmexico.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

export default PoliticasCookies;
