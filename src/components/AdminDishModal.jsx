import React, { useState, useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { menuService } from '../services/supabase';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminDishModal({
  dish = null,
  categories = [],
  isOpen,
  onClose,
  onSave
}) {
  const { showAlert } = useAlertConfirm();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: dish?.id || '',
    name: dish?.name || '',
    code: dish?.code || '',
    description: dish?.description || '',
    price: dish ? Number(dish.price) : 15.00,
    category_id: dish?.category_id || (categories[0]?.id || 'sandwiches'),
    image_url: dish?.image_url || dish?.image || '',
    platos_image: dish?.platos_image || dish?.platosImage || '',
    badge: dish?.badge || '',
    is_available: dish ? dish.is_available !== false : true,
    is_active: dish ? dish.is_active !== false : true
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      triggerHaptic(10);
      const publicUrl = await menuService.uploadImage(file);
      handleChange('image_url', publicUrl);
      handleChange('platos_image', publicUrl);
      showAlert({
        title: 'Imagen Subida',
        message: 'La fotografía se cargó correctamente al servidor de Supabase Storage.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      showAlert({
        title: 'Error al subir imagen',
        message: err.message || 'No se pudo subir la fotografía. Inténtalo nuevamente.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert({
        title: 'Campo obligatorio',
        message: 'Por favor ingresa el nombre del plato.',
        type: 'warning'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      triggerHaptic(12);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error guardando plato:', err);
      showAlert({
        title: 'Error al guardar',
        message: err.message || 'No se pudo guardar los cambios.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview de la imagen
  const previewImage = formData.platos_image || formData.image_url;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card, #1c1d22)',
          color: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: 'none !important'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              {dish ? 'Editar Plato' : 'Nuevo Plato'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.2rem 0 0 0' }}>
              Gestión directa en Supabase
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none !important',
              borderRadius: '9999px',
              padding: '0.5rem',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nombre y Código */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                Nombre del Plato *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Ceviche Mi Barrunto"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  border: 'none !important'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                Código
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ej: C-01"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  border: 'none !important'
                }}
              />
            </div>
          </div>

          {/* Categoría y Precio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                Categoría *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} style={{ backgroundColor: '#1c1d22', color: '#ffffff' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                Precio ($ USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  border: 'none !important'
                }}
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
              Descripción / Ingredientes
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detalla los ingredientes y preparación..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                borderRadius: '12px',
                fontSize: '0.88rem',
                border: 'none !important',
                resize: 'none'
              }}
            />
          </div>

          {/* Subida de Imagen a Supabase Storage */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
              Fotografía del Plato (Supabase Storage)
            </label>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Preview */}
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <ImageIcon size={28} color="#9ca3af" />
                )}
              </div>

              {/* Botón de carga */}
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    border: 'none !important',
                    marginBottom: '0.35rem'
                  }}
                >
                  {isUploading ? <Loader2 size={16} className="spin-icon" /> : <Upload size={16} />}
                  <span>{isUploading ? 'Subiendo imagen...' : 'Subir nueva foto'}</span>
                </button>

                <input
                  type="text"
                  value={formData.platos_image || formData.image_url}
                  onChange={(e) => {
                    handleChange('platos_image', e.target.value);
                    handleChange('image_url', e.target.value);
                  }}
                  placeholder="O pega aquí la URL de la imagen..."
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: '#9ca3af',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    border: 'none !important'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Badge y Disponibilidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                Etiqueta / Badge
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => handleChange('badge', e.target.value)}
                placeholder="Ej: Recomendado"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  border: 'none !important'
                }}
              />
            </div>

            {/* Switch Disponible */}
            <div
              onClick={() => handleChange('is_available', !formData.is_available)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: formData.is_available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                cursor: 'pointer',
                marginTop: '1.25rem'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  backgroundColor: formData.is_available ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                {formData.is_available && <Check size={14} strokeWidth={3} />}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: formData.is_available ? '#10b981' : '#ef4444' }}>
                {formData.is_available ? 'Disponible en Carta' : 'Agotado Temporal'}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '0.75rem',
                borderRadius: '14px',
                cursor: 'pointer',
                border: 'none !important'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                padding: '0.75rem',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                border: 'none !important',
                boxShadow: '0 4px 15px rgba(217, 28, 43, 0.4)'
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="spin-icon" /> : <Check size={16} />}
              <span>{dish ? 'Guardar Cambios' : 'Crear Plato'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
