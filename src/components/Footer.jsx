import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">sueldosmexico.com</span>
            <p className="footer-description">
              Consulta información salarial de profesores en instituciones públicas de México
            </p>
          </div>
          
          <div className="footer-links">
            <h4 className="footer-title">Legal</h4>
            <nav className="footer-nav">
              <Link to="/politicas-cookies" className="footer-link">Políticas de Cookies</Link>
              <Link to="/aviso-legal" className="footer-link">Aviso Legal</Link>
              <Link to="/politica-privacidad" className="footer-link">Política de Privacidad</Link>
              <Link to="/contacto" className="footer-link">Contacto</Link>
            </nav>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} SueldosMexico.com - Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
