import React, { useState, useRef } from 'react';
import { 
  X, Upload, Plus, Trash2, Check, Star, 
  Sparkles, AlertCircle, Eye, EyeOff 
} from 'lucide-react';
import { menuService } from '../services/supabase';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminDishModal({
  isOpen,
  onClose,
  dish = null,
  categories = [],
  onSave
}) {
  const { showAlert } = useAlertConfirm();
  const fileInputRef = useRef(null);

  // Imágenes existentes o array inicial
  const initialImages = Array.isArray(dish?.images) && dish.images.length > 0 
    ? dish.images 
    : (dish?.platos_image ? [dish.platos_image] : dish?.image_url ? [dish.image_url] : []);

  const [formData, setFormData] = useState({
    id: dish?.id || '',
    name: dish?.name || '',
    name_en: dish?.name_en || dish?.nameEn || '',
    code: dish?.code || '',
    description: dish?.description || '',
    description_en: dish?.description_en || dish?.descriptionEn || '',
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

  // Subir múltiples fotos al Bucket CDN de Supabase Storage
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
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          backgroundColor: '#ffffff',
          color: '#1f1e1c',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
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
            backgroundColor: '#fcf9f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#1f1e1c' }}>
              {dish ? 'Editar Plato' : 'Nuevo Plato'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#6b635b', margin: '0.2rem 0 0 0' }}>
              Español, inglés, galería múltiple y visibilidad
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#f5efe4',
              border: 'none !important',
              borderRadius: '9999px',
              padding: '0.5rem',
              color: '#1f1e1c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario con scroll suave */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Nombre en Español y Código */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
                Nombre del Plato (Español) *
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
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: 'none !important',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
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
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: 'none !important',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Nombre en Inglés */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
              Nombre en Inglés (Name in English)
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => handleChange('name_en', e.target.value)}
              placeholder="Ej: Classic Peruvian Ceviche with Sweet Potato & Corn"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none !important',
                outline: 'none'
              }}
            />
          </div>

          {/* Categoría y Precio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
                Categoría *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none !important',
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
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
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none !important',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Descripción en Español */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
              Descripción en Español (Ingredientes y Sabor)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detalla los ingredientes y preparación en español..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none !important',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Descripción en Inglés */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#6b635b', marginBottom: '0.35rem' }}>
              Descripción en Inglés (Description in English)
            </label>
            <textarea
              rows={2}
              value={formData.description_en}
              onChange={(e) => handleChange('description_en', e.target.value)}
              placeholder="English description and ingredients for foreign guests..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none !important',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Galería Múltiple de Imágenes */}
          <div style={{ backgroundColor: '#fcf9f2', padding: '1rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f1e1c' }}>
                  Galería de Fotos ({formData.images.length})
                </label>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#6b635b' }}>
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
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.45rem 0.85rem',
                  borderRadius: '9999px',
                  border: 'none !important',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Upload size={14} />
                <span>{isUploading ? 'Subiendo...' : 'Subir Fotos'}</span>
              </button>
            </div>

            {/* Cuadrícula de Previsualización de Imágenes */}
            {formData.images.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}
              >
                {formData.images.map((imgUrl, idx) => {
                    const SUPABASE_CDN_BASE = 'https://scvlxcgmhbwjmvycrttf.supabase.co/storage/v1/object/public/dishes';
                    let resolvedSrc = imgUrl;
                    let localFallback = '';
                    if (imgUrl) {
                      if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                        const filename = imgUrl.split('/').pop();
                        localFallback = `/platos_webp/${filename}`;
                      } else {
                        const clean = imgUrl.replace(/^(\.\/|\/)+/, '');
                        const filename = clean.split('/').pop();
                        localFallback = `/${clean}`;
                        resolvedSrc = (filename && filename.toLowerCase().endsWith('.webp'))
                          ? `${SUPABASE_CDN_BASE}/platos_webp/${filename}`
                          : `${SUPABASE_CDN_BASE}/${clean}`;
                      }
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '75px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          backgroundColor: '#f5efe4',
                          boxShadow: isMain ? '0 0 0 2px var(--rojo, #d91c2b)' : 'none'
                        }}
                      >
                        <img
                          src={resolvedSrc}
                          alt={`Foto ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            if (localFallback && e.currentTarget.src !== localFallback) {
                              e.currentTarget.src = localFallback;
                            }
                          }}
                        />

                      {/* Botón Estrella: Establecer como Principal */}
                      <button
                        type="button"
                        onClick={() => handleSetMainImage(imgUrl)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          backgroundColor: isMain ? 'var(--rojo, #d91c2b)' : 'rgba(0,0,0,0.5)',
                          color: '#ffffff',
                          borderRadius: '9999px',
                          padding: '0.2rem',
                          border: 'none !important',
                          cursor: 'pointer'
                        }}
                        title={isMain ? 'Foto Principal' : 'Establecer como Principal'}
                      >
                        <Star size={12} fill={isMain ? '#ffffff' : 'none'} />
                      </button>

                      {/* Botón Borrar Foto */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imgUrl)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.85)',
                          color: '#ffffff',
                          borderRadius: '9999px',
                          padding: '0.2rem',
                          border: 'none !important',
                          cursor: 'pointer'
                        }}
                        title="Eliminar esta foto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  color: '#6b635b',
                  fontSize: '0.8rem',
                  fontStyle: 'italic'
                }}
              >
                No hay fotos en la galería todavía.
              </div>
            )}
          </div>

          {/* Opciones de Disponibilidad y Visibilidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Disponibilidad */}
            <div
              onClick={() => handleChange('is_available', !formData.is_available)}
              style={{
                backgroundColor: formData.is_available ? '#eff6ff' : '#fef2f2',
                padding: '0.85rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: formData.is_available ? '#2563eb' : '#b91c1c' }}>
                  {formData.is_available ? 'Disponible' : 'Agotado'}
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#6b635b' }}>
                  {formData.is_available ? 'Comensales pueden pedir' : 'Marcado como no disponible'}
                </span>
              </div>
              <Check size={16} color={formData.is_available ? '#2563eb' : 'transparent'} />
            </div>

            {/* Visibilidad */}
            <div
              onClick={() => handleChange('is_active', !formData.is_active)}
              style={{
                backgroundColor: formData.is_active ? '#ecfdf5' : '#fef3c7',
                padding: '0.85rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: formData.is_active ? '#059669' : '#b45309' }}>
                  {formData.is_active ? 'Visible' : 'Oculto'}
                </span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#6b635b' }}>
                  {formData.is_active ? 'Se muestra en la carta' : 'Oculto al público'}
                </span>
              </div>
              {formData.is_active ? <Eye size={16} color="#059669" /> : <EyeOff size={16} color="#b45309" />}
            </div>
          </div>

          {/* Botones de Pie */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                padding: '0.7rem 1.25rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
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
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                padding: '0.7rem 1.5rem',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                border: 'none !important',
                boxShadow: '0 4px 15px rgba(217, 28, 43, 0.3)'
              }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Plato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
