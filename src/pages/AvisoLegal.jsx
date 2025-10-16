import { Helmet } from "react-helmet";
import "./LegalPages.css";

function AvisoLegal() {
  return (
    <div className="legal-page">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Aviso Legal | Sueldos México</title>
        <meta
          name="description"
          content="Consulta el Aviso Legal de Sueldos México. Información sobre derechos, uso del sitio, propiedad intelectual y responsabilidades conforme a la LSSI-CE."
        />
        <meta
          name="keywords"
          content="aviso legal, sueldos México, propiedad intelectual, condiciones de uso, LSSI, información pública, transparencia"
        />
        <meta name="author" content="Sueldos México" />
        <link rel="canonical" href="https://sueldosmexico.com/aviso-legal" />

        {/* Open Graph */}
        <meta property="og:title" content="Aviso Legal | Sueldos México" />
        <meta
          property="og:description"
          content="Consulta el aviso legal de Sueldos México y conoce las condiciones de uso, responsabilidad y derechos de autor del sitio."
        />
        <meta property="og:url" content="https://sueldosmexico.com/aviso-legal" />
        <meta property="og:site_name" content="Sueldos México" />
        <meta property="og:type" content="website" />

        {/* Datos estructurados (schema.org) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Aviso Legal - Sueldos México",
            url: "https://sueldosmexico.com/aviso-legal",
            description:
              "Aviso legal de Sueldos México: información sobre derechos, condiciones de uso, propiedad intelectual y exención de responsabilidad.",
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
        <h1 className="legal-title">Aviso Legal</h1>

        <section className="legal-section">
          <h2>Información General</h2>
          <p>
            En cumplimiento con el deber de información dispuesto en la Ley
            34/2002 de Servicios de la Sociedad de la Información y el Comercio
            Electrónico (LSSI-CE), se facilita la siguiente información:
          </p>
          <p>
            <strong>Denominación social:</strong> SueldosMexico.com<br />
            <strong>Dominio:</strong> sueldosmexico.com
          </p>
        </section>

        <section className="legal-section">
          <h2>Objeto</h2>
          <p>
            SueldosMexico.com es una plataforma de consulta de información
            pública sobre salarios de profesores en instituciones públicas de
            México. Toda la información proviene de fuentes oficiales y
            verificables.
          </p>
        </section>

        <section className="legal-section">
          <h2>Uso del sitio web</h2>
          <p>
            El acceso y uso de este sitio web implica la aceptación de los
            términos y condiciones establecidos en este aviso legal. El usuario
            se compromete a utilizar el sitio conforme a la ley y a las normas
            de uso responsable de la información pública.
          </p>
        </section>

        <section className="legal-section">
          <h2>Propiedad intelectual</h2>
          <p>
            Todos los contenidos, textos, gráficos, logotipos y diseño de este
            sitio web están protegidos por derechos de propiedad intelectual.
            Los datos salariales mostrados son de dominio público y pertenecen a
            sus respectivas fuentes oficiales.
          </p>
        </section>

        <section className="legal-section">
          <h2>Responsabilidad</h2>
          <p>
            SueldosMexico.com no se hace responsable de la exactitud o
            actualización de los datos proporcionados, ya que provienen de
            registros gubernamentales. Se recomienda contrastar la información
            directamente con las fuentes originales.
          </p>
        </section>

        <section className="legal-section">
          <h2>Enlaces externos</h2>
          <p>
            Este sitio web puede contener enlaces a sitios de terceros.
            SueldosMexico.com no asume responsabilidad sobre el contenido o las
            políticas de privacidad de dichos sitios externos.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contacto</h2>
          <p>
            Para cualquier consulta o notificación relacionada con este aviso
            legal, puedes escribirnos a{" "}
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

export default AvisoLegal;
