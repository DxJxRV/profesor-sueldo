import { Helmet } from "react-helmet";
import "./LegalPages.css";

function PoliticaPrivacidad() {
  return (
    <div className="legal-page">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Política de Privacidad | Sueldos México</title>
        <meta
          name="description"
          content="Consulta la Política de Privacidad de Sueldos México. Conoce cómo protegemos tus datos, el uso de cookies, AdSense y tus derechos sobre la información personal."
        />
        <meta
          name="keywords"
          content="política de privacidad, sueldos México, protección de datos, cookies, Google AdSense, datos personales"
        />
        <meta name="author" content="Sueldos México" />
        <link
          rel="canonical"
          href="https://sueldosmexico.com/politica-privacidad"
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Política de Privacidad | Sueldos México"
        />
        <meta
          property="og:description"
          content="Conoce cómo protegemos tu información personal y el uso de cookies en Sueldos México."
        />
        <meta
          property="og:url"
          content="https://sueldosmexico.com/politica-privacidad"
        />
        <meta property="og:site_name" content="Sueldos México" />
        <meta property="og:type" content="website" />

        {/* Datos estructurados (schema.org) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Política de Privacidad - Sueldos México",
            url: "https://sueldosmexico.com/politica-privacidad",
            description:
              "Consulta la política de privacidad de Sueldos México y conoce cómo gestionamos tus datos personales y cookies.",
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
        <h1 className="legal-title">Política de Privacidad</h1>

        <section className="legal-section">
          <h2>Responsable del tratamiento</h2>
          <p>
            <strong>SueldosMexico.com</strong> es el responsable del
            tratamiento de los datos personales del usuario y le informa que
            estos datos serán tratados de conformidad con la normativa vigente
            en materia de protección de datos personales.
          </p>
        </section>

        <section className="legal-section">
          <h2>Datos que recopilamos</h2>
          <p>Nuestro sitio web recopila información mínima del usuario:</p>
          <ul>
            <li>Datos de navegación y uso del sitio web (cookies)</li>
            <li>Dirección IP</li>
            <li>Información de búsquedas realizadas en el sitio</li>
          </ul>
          <p>
            No recopilamos datos personales identificables sin el consentimiento
            explícito del usuario.
          </p>
        </section>

        <section className="legal-section">
          <h2>Finalidad del tratamiento</h2>
          <p>Los datos recopilados se utilizan para:</p>
          <ul>
            <li>Mejorar la experiencia del usuario en el sitio web</li>
            <li>Análisis estadístico del uso del sitio</li>
            <li>Mostrar publicidad relevante a través de Google AdSense</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Google AdSense y cookies de terceros</h2>
          <p>
            Este sitio web utiliza Google AdSense para mostrar anuncios. Google
            puede utilizar cookies para mostrar anuncios basados en las visitas
            previas del usuario a este sitio web u otros sitios web.
          </p>
          <p>
            Los usuarios pueden inhabilitar el uso de cookies de Google
            visitando la{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              página de inhabilitación de publicidad de Google
            </a>
            .
          </p>
        </section>

        <section className="legal-section">
          <h2>Derechos del usuario</h2>
          <p>El usuario tiene derecho a:</p>
          <ul>
            <li>Acceder a sus datos personales</li>
            <li>Solicitar la rectificación de datos inexactos</li>
            <li>Solicitar la supresión de sus datos</li>
            <li>Oponerse al tratamiento de sus datos</li>
            <li>Solicitar la limitación del tratamiento</li>
            <li>Solicitar la portabilidad de sus datos</li>
          </ul>
          <p>
            Para ejercer estos derechos, puede escribirnos a{" "}
            <a href="mailto:contacto@sueldosmexico.com">
              contacto@sueldosmexico.com
            </a>
            .
          </p>
        </section>

        <section className="legal-section">
          <h2>Seguridad de los datos</h2>
          <p>
            SueldosMexico.com se compromete a adoptar las medidas técnicas y
            organizativas necesarias para garantizar la seguridad de los datos
            personales y evitar su alteración, pérdida o acceso no autorizado.
          </p>
        </section>

        <section className="legal-section">
          <h2>Modificaciones</h2>
          <p>
            SueldosMexico.com se reserva el derecho de modificar su política de
            privacidad en cualquier momento. Los cambios serán comunicados en
            esta misma página.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PoliticaPrivacidad;
