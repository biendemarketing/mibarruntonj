import React, { useState, useRef } from 'react';
import { 
  X, Upload, Check, Image as ImageIcon, AlertCircle, 
  Loader2, Trash2, Eye, EyeOff, Star 
} from 'lucide-react';
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
  const { showAlert, showConfirm } = useAlertConfirm();
  const fileInputRef = useRef(null);

  // Imágenes existentes o array inicial
  const initialImages = Array.isArray(dish?.images) && dish.images.length > 0 
    ? dish.images 
    : (dish?.platos_image ? [dish.platos_image] : dish?.image_url ? [dish.image_url] : []);

  const [formData, setFormData] = useState({
    id: dish?.id || '',
    name: dish?.name || '',
    code: dish?.code || '',
    description: dish?.description || '',
    price: dish ? Number(dish.price) : 15.00,
    category_id: dish?.category_id || (categories[0]?.id || 'sandwiches'),
    image_url: dish?.image_url || dish?.image || '',
    platos_image: dish?.platos_image || dish?.platosImage || initialImages[0] || '',
    images: initialImages,
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

  // Subir una o varias imágenes en paralelo a Supabase Storage
  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      triggerHaptic(10);

      const uploadedUrls = [];
      for (const file of files) {
        const publicUrl = await menuService.uploadImage(file);
        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => {
        const nextImages = [...prev.images, ...uploadedUrls];
        return {
          ...prev,
          images: nextImages,
          platos_image: prev.platos_image || nextImages[0],
          image_url: prev.image_url || nextImages[0]
        };
      });

      showAlert({
        title: 'Fotos Subidas',
        message: `Se agregaron ${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'fotografía' : 'fotografías'} a la galería del plato.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error subiendo imágenes:', err);
      showAlert({
        title: 'Error de carga',
        message: err.message || 'No se pudieron subir las imágenes.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Establecer una foto como portada principal
  const handleSetMainImage = (url) => {
    triggerHaptic(8);
    setFormData(prev => ({
      ...prev,
      platos_image: url,
      image_url: url
    }));
  };

  // Eliminar una foto de la galería
  const handleRemoveImage = (urlToRemove) => {
    triggerHaptic(10);
    setFormData(prev => {
      const remaining = prev.images.filter(u => u !== urlToRemove);
      const nextMain = prev.platos_image === urlToRemove ? (remaining[0] || '') : prev.platos_image;
      return {
        ...prev,
        images: remaining,
        platos_image: nextMain,
        image_url: nextMain
      };
    });
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

      const payload = {
        ...formData,
        platos_image: formData.platos_image || formData.images[0] || '',
        image_url: formData.platos_image || formData.images[0] || '',
        images: formData.images
      };

      await onSave(payload);
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          maxWidth: '580px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card, #1c1d22)',
          color: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: 'none !important'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
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
              Galería múltiple & visibilidad en Supabase
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
              rows={2}
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

          {/* Galería Múltiple de Imágenes */}
          <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                  Galería de Fotos ({formData.images.length})
                </label>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#9ca3af' }}>
                  Sube múltiples fotos. La foto con estrella es la portada principal.
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleMultipleImageUpload}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  border: 'none !important'
                }}
              >
                {isUploading ? <Loader2 size={14} className="spin-icon" /> : <Upload size={14} />}
                <span>{isUploading ? 'Subiendo...' : '+ Agregar Fotos'}</span>
              </button>
            </div>

            {/* Cuadrícula de Galería */}
            {formData.images.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280', fontSize: '0.82rem' }}>
                <ImageIcon size={28} style={{ margin: '0 auto 0.4rem', opacity: 0.4 }} />
                <span>Aún no hay fotos en este plato. Puedes subir una o varias imágenes.</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.65rem' }}>
                {formData.images.map((imgUrl, idx) => {
                  const isMain = formData.platos_image === imgUrl;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#111215',
                        boxShadow: isMain ? '0 0 0 2px var(--naranja, #f97316)' : 'none'
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => handleSetMainImage(imgUrl)}
                        title="Toca para seleccionar como foto principal"
                      />

                      {/* Botón Estrella Portada */}
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(imgUrl)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          backgroundColor: isMain ? 'var(--naranja, #f97316)' : 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          border: 'none !important',
                          borderRadius: '6px',
                          padding: '0.2rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={isMain ? 'Foto Principal' : 'Hacer foto principal'}
                      >
                        <Star size={11} fill={isMain ? '#ffffff' : 'none'} />
                      </button>

                      {/* Botón Eliminar de la Galería */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imgUrl)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.85)',
                          color: '#ffffff',
                          border: 'none !important',
                          borderRadius: '6px',
                          padding: '0.2rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Quitar foto de la galería"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badge */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
              Etiqueta Promocional / Badge
            </label>
            <input
              type="text"
              value={formData.badge}
              onChange={(e) => handleChange('badge', e.target.value)}
              placeholder="Ej: Recomendado, Más Pedido, Especial..."
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

          {/* Dos Switches: Disponibilidad (Agotado) y Visibilidad (Ocultar) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Switch Disponible */}
            <div
              onClick={() => handleChange('is_available', !formData.is_available)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: formData.is_available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                padding: '0.75rem 0.85rem',
                borderRadius: '12px',
                cursor: 'pointer'
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
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                {formData.is_available && <Check size={14} strokeWidth={3} />}
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: formData.is_available ? '#10b981' : '#ef4444', display: 'block' }}>
                  {formData.is_available ? 'Disponible' : 'Agotado'}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                  {formData.is_available ? 'En cocina hoy' : 'Pausar pedidos'}
                </span>
              </div>
            </div>

            {/* Switch Ocultar / Mostrar */}
            <div
              onClick={() => handleChange('is_active', !formData.is_active)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: formData.is_active ? 'rgba(59, 130, 246, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                padding: '0.75rem 0.85rem',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  backgroundColor: formData.is_active ? '#3b82f6' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                {formData.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: formData.is_active ? '#3b82f6' : '#9ca3af', display: 'block' }}>
                  {formData.is_active ? 'Visible en Menú' : 'Oculto'}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                  {formData.is_active ? 'Público en carta' : 'Oculto de carta'}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Guardar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '0.85rem',
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
                padding: '0.85rem',
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
