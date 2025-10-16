import { Helmet } from "react-helmet";
import "./LegalPages.css";

function Contacto() {
  return (
    <div className="legal-page">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Contacto | Sueldos México</title>
        <meta
          name="description"
          content="Ponte en contacto con Sueldos México. Envía tus dudas, sugerencias o comentarios a contacto@sueldosmexico.com. Resolvemos tus consultas sobre información salarial pública."
        />
        <meta
          name="keywords"
          content="contacto, sueldos México, información salarial, transparencia, gobierno de México, contacto sueldosmexico"
        />
        <meta name="author" content="Sueldos México" />
        <link rel="canonical" href="https://sueldosmexico.com/contacto" />

        {/* Open Graph (para redes sociales y SEO) */}
        <meta property="og:title" content="Contacto | Sueldos México" />
        <meta
          property="og:description"
          content="Comunícate con Sueldos México para resolver dudas o enviar sugerencias."
        />
        <meta property="og:url" content="https://sueldosmexico.com/contacto" />
        <meta property="og:site_name" content="Sueldos México" />
        <meta property="og:type" content="website" />

        {/* Datos estructurados de contacto (schema.org) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Sueldos México",
            url: "https://sueldosmexico.com",
            email: "contacto@sueldosmexico.com",
            sameAs: [
              "https://www.facebook.com/sueldosmexico",
              "https://twitter.com/sueldosmexico"
            ],
            contactPoint: {
              "@type": "ContactPoint",
              email: "contacto@sueldosmexico.com",
              contactType: "customer support",
              areaServed: "MX",
              availableLanguage: "es"
            }
          })}
        </script>
      </Helmet>

      <div className="legal-container">
        <h1 className="legal-title">Contacto</h1>

        <section className="legal-section">
          <h2>Información de Contacto</h2>
          <p>
            Si tienes alguna pregunta, sugerencia o necesitas ponerte en
            contacto con nosotros, puedes hacerlo a través del siguiente medio:
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:contacto@sueldosmexico.com"
              rel="noopener noreferrer"
            >
              contacto@sueldosmexico.com
            </a>
          </p>
        </section>

        <section className="legal-section">
          <h2>Sitio Web</h2>
          <p>
            <strong>Dominio:</strong> sueldosmexico.com<br />
            <strong>Plataforma:</strong> Consulta de información salarial pública
          </p>
        </section>

        <section className="legal-section">
          <h2>Sobre la información</h2>
          <p>
            Toda la información presentada en este sitio web proviene de fuentes
            oficiales y públicas del gobierno de México. Si encuentras alguna
            inconsistencia o error, te recomendamos verificar directamente con
            las instituciones correspondientes.
          </p>
        </section>

        <section className="legal-section">
          <h2>Tiempo de respuesta</h2>
          <p>
            Nos esforzamos por responder todas las consultas en el menor tiempo
            posible. El tiempo de respuesta puede variar dependiendo de la
            naturaleza de la consulta.
          </p>
        </section>

        <section className="legal-section">
          <h2>Sugerencias y mejoras</h2>
          <p>
            Estamos siempre abiertos a recibir sugerencias para mejorar nuestro
            servicio. Tu opinión es importante para nosotros y nos ayuda a
            ofrecer una mejor experiencia a todos los usuarios.
          </p>
        </section>

        <section className="legal-section">
          <h2>Fuentes de información</h2>
          <p>
            Los datos presentados en SueldosMexico.com provienen de registros
            públicos y transparencia gubernamental. Para más información sobre
            las fuentes oficiales, consulta los portales de transparencia de las
            instituciones públicas mexicanas.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Contacto;
