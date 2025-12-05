import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { FiEdit2, FiTrash2, FiEye, FiMousePointer, FiCalendar, FiSearch } from 'react-icons/fi';
import { MdRadioButtonUnchecked, MdCheckCircle, MdCircle } from 'react-icons/md';

function DashboardTargetedMessages() {
  const [messages, setMessages] = useState([]);
  const [utmConfigs, setUtmConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [formData, setFormData] = useState({
    utmKey: '',
    title: '',
    subtitle: '',
    message: '',
    backgroundColor: '',
    textColor: '',
    buttonText: '',
    buttonUrl: '',
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchUtmConfigs();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllTargetedMessages();
      setMessages(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar mensajes dirigidos:', err);
      setError('Error al cargar los mensajes dirigidos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUtmConfigs = async () => {
    try {
      const response = await apiClient.getAllUtmConfigs();
      setUtmConfigs(response.data || []);
    } catch (err) {
      console.error('Error al cargar configuraciones UTM:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      utmKey: '',
      title: '',
      subtitle: '',
      message: '',
      backgroundColor: '',
      textColor: '',
      buttonText: '',
      buttonUrl: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
    setSelectedTemplate('');
    setEditingMessage(null);
    setShowForm(false);
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);

    if (!templateId) {
      // Si se deselecciona el template, limpiar solo los campos de template
      setFormData(prev => ({
        ...prev,
        title: '',
        subtitle: '',
        message: '',
        backgroundColor: '',
        textColor: '',
        buttonText: '',
        buttonUrl: ''
      }));
      return;
    }

    // Buscar el mensaje template seleccionado
    const template = messages.find(msg => msg.id === parseInt(templateId));
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title || '',
        subtitle: template.subtitle || '',
        message: template.message || '',
        backgroundColor: template.background_color || '',
        textColor: template.text_color || '',
        buttonText: template.button_text || '',
        buttonUrl: template.button_url || ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingMessage) {
        await apiClient.updateTargetedMessage(editingMessage.id, formData);
        alert('✅ Mensaje actualizado exitosamente');
      } else {
        await apiClient.createTargetedMessage(formData);
        alert('✅ Mensaje creado exitosamente');
      }

      resetForm();
      fetchMessages();
    } catch (err) {
      console.error('Error al guardar mensaje:', err);
      alert('❌ Error al guardar el mensaje');
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);

    // Formatear fechas para el input datetime-local
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      utmKey: message.utm_key || '',
      title: message.title || '',
      subtitle: message.subtitle || '',
      message: message.message || '',
      backgroundColor: message.background_color || '',
      textColor: message.text_color || '',
      buttonText: message.button_text || '',
      buttonUrl: message.button_url || '',
      startDate: formatDate(message.start_date),
      endDate: formatDate(message.end_date),
      isActive: message.is_active !== undefined ? message.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
      return;
    }

    try {
      await apiClient.deleteTargetedMessage(id);
      alert('✅ Mensaje eliminado exitosamente');
      fetchMessages();
    } catch (err) {
      console.error('Error al eliminar mensaje:', err);
      alert('❌ Error al eliminar el mensaje');
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMessageActive = (message) => {
    if (!message.is_active) return false;
    const now = new Date();
    const start = new Date(message.start_date);
    const end = new Date(message.end_date);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>Cargando mensajes...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '1rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.5rem' : '1.875rem',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          💌 Mensajes Dirigidos
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
          >
            + Nuevo Mensaje
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '1rem' : '2rem',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
              {editingMessage ? 'Editar Mensaje' : 'Nuevo Mensaje'}
            </h3>
            <button
              onClick={resetForm}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Template Selector - Solo visible al crear nuevo */}
            {!editingMessage && messages.length > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  color: '#166534',
                  fontSize: '0.875rem'
                }}>
                  🎨 Usar Template de UTM (Opcional)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #86efac',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Sin template - Empezar desde cero</option>
                  {messages.map(msg => (
                    <option key={msg.id} value={msg.id}>
                      {msg.utm_key} - {msg.title}
                    </option>
                  ))}
                </select>
                <p style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#15803d',
                  fontStyle: 'italic'
                }}>
                  💡 Selecciona un mensaje existente para reutilizar sus estilos y textos. Solo tendrás que cambiar el UTM target y las fechas.
                </p>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              {/* UTM Key */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  UTM Target * (a qué UTM va dirigido)
                </label>
                <select
                  name="utmKey"
                  value={formData.utmKey}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingMessage}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: editingMessage ? '#f9fafb' : 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Selecciona un UTM</option>
                  {utmConfigs.map(config => (
                    <option key={config.id} value={config.utm_key}>
                      {config.utm_key} - {config.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="¡Hola de nuevo!"
                />
              </div>
            </div>

            {/* Subtitle */}
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                Subtítulo
              </label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Vemos que regresaste"
              />
            </div>

            {/* Message */}
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                Mensaje *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Gracias por volver. Tenemos nuevas funcionalidades para ti..."
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              {/* Fecha de inicio */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Fecha de fin */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Fecha y Hora de Fin *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              {/* Background Color */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Color de Fondo
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <input
                    type="color"
                    name="backgroundColor"
                    value={formData.backgroundColor || '#8b5cf6'}
                    onChange={handleInputChange}
                    style={{
                      width: isMobile ? '3rem' : '3.5rem',
                      height: '2.75rem',
                      padding: '0.25rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleInputChange}
                    style={{
                      flex: 1,
                      minWidth: isMobile ? '120px' : 'auto',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="#8b5cf6"
                  />
                  {formData.backgroundColor && (
                    <div style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      backgroundColor: formData.backgroundColor,
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      flexShrink: 0
                    }} title={formData.backgroundColor} />
                  )}
                </div>
              </div>

              {/* Text Color */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Color de Texto
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <input
                    type="color"
                    name="textColor"
                    value={formData.textColor || '#ffffff'}
                    onChange={handleInputChange}
                    style={{
                      width: isMobile ? '3rem' : '3.5rem',
                      height: '2.75rem',
                      padding: '0.25rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    name="textColor"
                    value={formData.textColor}
                    onChange={handleInputChange}
                    style={{
                      flex: 1,
                      minWidth: isMobile ? '120px' : 'auto',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="#ffffff"
                  />
                  {formData.textColor && (
                    <div style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      backgroundColor: formData.textColor,
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      flexShrink: 0
                    }} title={formData.textColor} />
                  )}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              {/* Button Text */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Texto del Botón CTA
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ver más"
                />
              </div>

              {/* Button URL */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  URL del Botón CTA
                </label>
                <input
                  type="text"
                  name="buttonUrl"
                  value={formData.buttonUrl}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Is Active */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  cursor: 'pointer'
                }}
              />
              <label style={{ fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
                Mensaje activo
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                padding: '0.875rem',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1.125rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              {editingMessage ? 'Actualizar Mensaje' : 'Crear Mensaje'}
            </button>
          </form>
        </div>
      )}

      {/* Buscador */}
      {!showForm && messages.length > 0 && (
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <FiSearch style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '1.125rem'
          }} />
          <input
            type="text"
            placeholder="Buscar por título, UTM target, mensaje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem 0.875rem 2.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
      )}

      {/* Lista de Mensajes */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {(() => {
          const filteredMessages = messages.filter(message => {
            const search = searchTerm.toLowerCase();
            return (
              message.title?.toLowerCase().includes(search) ||
              message.subtitle?.toLowerCase().includes(search) ||
              message.message?.toLowerCase().includes(search) ||
              message.utm_key?.toLowerCase().includes(search)
            );
          });

          if (messages.length === 0) {
            return (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                  No hay mensajes dirigidos creados aún
                </p>
              </div>
            );
          }

          if (filteredMessages.length === 0) {
            return (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                  No se encontraron mensajes para "{searchTerm}"
                </p>
              </div>
            );
          }

          return filteredMessages.map(message => {
            const active = isMessageActive(message);
            return (
              <div
                key={message.id}
                style={{
                  backgroundColor: 'white',
                  padding: isMobile ? '1rem' : '1.25rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  border: active ? '2px solid #8b5cf6' : '1px solid #e5e7eb'
                }}
              >
                {/* Header con título y estado */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.75rem',
                  gap: '0.75rem'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: isMobile ? '1rem' : '1.125rem',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      marginBottom: '0.25rem',
                      wordBreak: 'break-word'
                    }}>
                      {message.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <code style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontFamily: 'monospace'
                      }}>
                        {message.utm_key}
                      </code>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: active ? '#ddd6fe' : message.is_active ? '#fef3c7' : '#f3f4f6',
                        color: active ? '#5b21b6' : message.is_active ? '#92400e' : '#6b7280',
                        borderRadius: '0.25rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {active ? (
                          <>
                            <MdCheckCircle size={12} />
                            Activo
                          </>
                        ) : message.is_active ? (
                          <>
                            <MdCircle size={12} />
                            Programado
                          </>
                        ) : (
                          <>
                            <MdRadioButtonUnchecked size={12} />
                            Inactivo
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => handleEdit(message)}
                      style={{
                        padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 0.875rem',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      style={{
                        padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 0.875rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Información compacta */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <FiEye style={{ color: '#6b7280' }} size={16} />
                    <strong>{message.show_count || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <FiMousePointer style={{ color: '#6b7280' }} size={16} />
                    <strong>{message.click_count || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
                    <FiCalendar style={{ color: '#6b7280' }} size={14} />
                    <span>{new Date(message.start_date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</span>
                    <span>→</span>
                    <span>{new Date(message.end_date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Mensaje */}
                {message.message && (
                  <div style={{
                    marginTop: '0.75rem',
                    fontSize: '0.813rem',
                    color: '#4b5563',
                    fontStyle: 'italic',
                    lineHeight: '1.4'
                  }}>
                    "{message.message.length > 100 ? message.message.substring(0, 100) + '...' : message.message}"
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

export default DashboardTargetedMessages;
