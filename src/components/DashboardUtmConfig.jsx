import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { FiEdit2, FiTrash2, FiEye, FiMousePointer, FiUser, FiLink, FiSearch, FiCheckCircle, FiCircle } from 'react-icons/fi';

function DashboardUtmConfig() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [formData, setFormData] = useState({
    utmKey: '',
    title: '',
    subtitle: '',
    buttonText: '',
    suggestedName: '',
    suggestedProfessorId: '',
    specialMessage: '',
    backgroundColor: '',
    textColor: '',
    buttonColor: '',
    imageUrl: '',
    isActive: true
  });
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllUtmConfigs();
      setConfigs(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar configuraciones:', err);
      setError('Error al cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      utmKey: '',
      title: '',
      subtitle: '',
      buttonText: '',
      suggestedName: '',
      suggestedProfessorId: '',
      specialMessage: '',
      backgroundColor: '',
      textColor: '',
      buttonColor: '',
      imageUrl: '',
      isActive: true
    });
    setSelectedTemplate('');
    setEditingConfig(null);
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
        buttonText: '',
        suggestedName: '',
        suggestedProfessorId: '',
        specialMessage: '',
        backgroundColor: '',
        textColor: '',
        buttonColor: '',
        imageUrl: ''
      }));
      return;
    }

    // Buscar la configuración template seleccionada
    const template = configs.find(cfg => cfg.id === parseInt(templateId));
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title || '',
        subtitle: template.subtitle || '',
        buttonText: template.button_text || '',
        suggestedName: template.suggested_name || '',
        suggestedProfessorId: template.suggested_professor_id || '',
        specialMessage: template.special_message || '',
        backgroundColor: template.background_color || '',
        textColor: template.text_color || '',
        buttonColor: template.button_color || '',
        imageUrl: template.image_url || ''
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
      if (editingConfig) {
        // Actualizar
        await apiClient.updateUtmConfig(editingConfig.id, formData);
        alert('✅ Configuración actualizada exitosamente');
      } else {
        // Crear nueva
        await apiClient.createUtmConfig(formData);
        alert('✅ Configuración creada exitosamente');
      }

      resetForm();
      fetchConfigs();
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      alert('❌ Error al guardar la configuración');
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      utmKey: config.utm_key || '',
      title: config.title || '',
      subtitle: config.subtitle || '',
      buttonText: config.button_text || '',
      suggestedName: config.suggested_name || '',
      suggestedProfessorId: config.suggested_professor_id || '',
      specialMessage: config.special_message || '',
      backgroundColor: config.background_color || '',
      textColor: config.text_color || '',
      buttonColor: config.button_color || '',
      imageUrl: config.image_url || '',
      isActive: config.is_active !== undefined ? config.is_active : true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta configuración?')) {
      return;
    }

    try {
      await apiClient.deleteUtmConfig(id);
      alert('✅ Configuración eliminada exitosamente');
      fetchConfigs();
    } catch (err) {
      console.error('Error al eliminar configuración:', err);
      alert('❌ Error al eliminar la configuración');
    }
  };

  const getPreviewUrl = (config) => {
    const utmKey = editingConfig ? config.utm_key : formData.utmKey;
    if (!utmKey) return '#';
    return `${window.location.origin}/?src=${encodeURIComponent(utmKey)}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>Cargando configuraciones...</div>
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
          🎯 Configuraciones UTM
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            + Nueva Configuración
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
              {editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}
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
            {!editingConfig && configs.length > 0 && (
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
                  {configs.map(cfg => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.utm_key} - {cfg.title}
                    </option>
                  ))}
                </select>
                <p style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#15803d',
                  fontStyle: 'italic'
                }}>
                  💡 Selecciona una configuración existente para reutilizar sus estilos y configuración. Solo tendrás que cambiar el UTM key.
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
                  UTM Key * (src o utm_source)
                </label>
                <input
                  type="text"
                  name="utmKey"
                  value={formData.utmKey}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingConfig}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    backgroundColor: editingConfig ? '#f9fafb' : 'white',
                    boxSizing: 'border-box'
                  }}
                  placeholder="ejemplo: facebook_ad_1"
                />
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
                  placeholder="¿Cuánto gana tu profesor?"
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
                placeholder="Consulta información salarial"
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              {/* Button Text */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Texto del Botón
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
                  placeholder="Buscar ahora"
                />
              </div>

              {/* Suggested Name */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Nombre Sugerido (prellenado)
                </label>
                <input
                  type="text"
                  name="suggestedName"
                  value={formData.suggestedName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nombre del profesor"
                />
              </div>
            </div>

            {/* Special Message */}
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                Mensaje Especial
              </label>
              <textarea
                name="specialMessage"
                value={formData.specialMessage}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Mensaje personalizado que aparecerá destacado"
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
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
                    value={formData.backgroundColor || '#3b82f6'}
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
                    placeholder="#3b82f6"
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

              {/* Button Color */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Color del Botón
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <input
                    type="color"
                    name="buttonColor"
                    value={formData.buttonColor || '#6366f1'}
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
                    name="buttonColor"
                    value={formData.buttonColor}
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
                    placeholder="#6366f1"
                  />
                  {formData.buttonColor && (
                    <div style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      backgroundColor: formData.buttonColor,
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      flexShrink: 0
                    }} title={formData.buttonColor} />
                  )}
                </div>
              </div>

              {/* Image URL */}
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  URL de Imagen
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
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
                Configuración activa
              </label>
            </div>

            {/* Preview URL */}
            {(formData.utmKey || editingConfig) && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.5rem',
                border: '1px solid #bbf7d0',
                overflowWrap: 'break-word',
                wordBreak: 'break-all'
              }}>
                <strong style={{ color: '#166534' }}>URL de Preview:</strong>{' '}
                <a
                  href={getPreviewUrl(editingConfig || formData)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', textDecoration: 'underline' }}
                >
                  {getPreviewUrl(editingConfig || formData)}
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                padding: '0.875rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1.125rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              {editingConfig ? 'Actualizar Configuración' : 'Crear Configuración'}
            </button>
          </form>
        </div>
      )}

      {/* Buscador */}
      {!showForm && configs.length > 0 && (
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
            placeholder="Buscar por UTM key, título, nombre sugerido..."
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
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
      )}

      {/* Lista de Configuraciones */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {(() => {
          const filteredConfigs = configs.filter(config => {
            const search = searchTerm.toLowerCase();
            return (
              config.utm_key?.toLowerCase().includes(search) ||
              config.title?.toLowerCase().includes(search) ||
              config.subtitle?.toLowerCase().includes(search) ||
              config.suggested_name?.toLowerCase().includes(search)
            );
          });

          if (configs.length === 0) {
            return (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                  No hay configuraciones UTM creadas aún
                </p>
              </div>
            );
          }

          if (filteredConfigs.length === 0) {
            return (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                  No se encontraron configuraciones para "{searchTerm}"
                </p>
              </div>
            );
          }

          return filteredConfigs.map(config => (
            <div
              key={config.id}
              style={{
                backgroundColor: 'white',
                padding: isMobile ? '1rem' : '1.25rem',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                border: config.is_active ? '2px solid #10b981' : '1px solid #e5e7eb'
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
                    {config.title}
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
                      {config.utm_key}
                    </code>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: config.is_active ? '#d1fae5' : '#f3f4f6',
                      color: config.is_active ? '#065f46' : '#6b7280',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {config.is_active ? <FiCheckCircle size={12} /> : <FiCircle size={12} />}
                      {config.is_active ? 'Activa' : 'Inactiva'}
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
                    onClick={() => handleEdit(config)}
                    style={{
                      padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 0.875rem',
                      backgroundColor: '#3b82f6',
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
                    onClick={() => handleDelete(config.id)}
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

              {/* Información compacta en línea */}
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
                  <strong>{config.view_count || 0}</strong>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>vistas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <FiMousePointer style={{ color: '#6b7280' }} size={16} />
                  <strong>{config.click_count || 0}</strong>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>clicks</span>
                </div>
                {config.suggested_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <FiUser style={{ color: '#6b7280' }} size={16} />
                    <span style={{ fontSize: '0.75rem' }}>{config.suggested_name}</span>
                  </div>
                )}
              </div>

              {/* URL de prueba compacta */}
              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                <a
                  href={`${window.location.origin}/?src=${encodeURIComponent(config.utm_key)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#2563eb',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  <FiLink size={14} style={{ flexShrink: 0 }} />
                  <span style={{ wordBreak: 'break-all' }}>
                    {window.location.origin}/?src={config.utm_key}
                  </span>
                </a>
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

export default DashboardUtmConfig;
