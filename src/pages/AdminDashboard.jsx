import { useState, useEffect } from 'react';
import { FiBarChart2, FiTarget, FiMail } from 'react-icons/fi';
import DashboardUtmConfig from '../components/DashboardUtmConfig';
import DashboardTargetedMessages from '../components/DashboardTargetedMessages';
import DashboardAnalytics from '../components/DashboardAnalytics';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tabs = [
    { id: 'analytics', label: isMobile ? 'Analytics' : 'Analytics UTM', icon: <FiBarChart2 size={20} /> },
    { id: 'utm-configs', label: isMobile ? 'Config UTM' : 'Configuraciones UTM', icon: <FiTarget size={20} /> },
    { id: 'targeted-messages', label: isMobile ? 'Mensajes' : 'Mensajes Dirigidos', icon: <FiMail size={20} /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <DashboardAnalytics />;
      case 'utm-configs':
        return <DashboardUtmConfig />;
      case 'targeted-messages':
        return <DashboardTargetedMessages />;
      default:
        return <DashboardAnalytics />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      paddingTop: '1rem',
      paddingBottom: '2rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          padding: isMobile ? '1.5rem' : '2rem',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Panel de Administración
          </h1>
          <p style={{ color: '#6b7280', fontSize: isMobile ? '0.875rem' : '1.125rem' }}>
            Gestiona configuraciones UTM, mensajes dirigidos y visualiza estadísticas
          </p>
        </div>

        {/* Tabs Navigation */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
            borderBottom: '2px solid #e5e7eb'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '1.25rem 1.5rem',
                  backgroundColor: activeTab === tab.id ? '#f9fafb' : 'white',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
