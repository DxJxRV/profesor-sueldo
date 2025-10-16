import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfessorRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir automáticamente a Claudia Sheinbaum Pardo
    navigate('/profesor/A8ooHSPM1CcIUI3EUJh3ig==/Claudia%20Sheinbaum%20Pardo', { replace: true });
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      color: '#6b7280',
      fontSize: '1.125rem'
    }}>
      Redirigiendo...
    </div>
  );
}

export default ProfessorRedirect;
