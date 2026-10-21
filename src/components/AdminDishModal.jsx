import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Plus, Trash2, Check, Star, 
  Sparkles, AlertCircle, Eye, EyeOff, Image as ImageIcon,
  RefreshCw, Link as LinkIcon
} from 'lucide-react';
import { menuService } from '../services/supabase';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { CustomSelect } from './CustomSelect';

export function AdminDishModal({
  isOpen,
  onClose,
  dish = null,
  categories = [],
  onSave
}) {
  const { showAlert } = useAlertConfirm();
  const fileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);

  const getInitialImages = (d) => {
    if (!d) return [];
    if (Array.isArray(d.images) && d.images.length > 0) return d.images;
    const fallback = d.platos_image || d.platosImage || d.image_url || d.image;
    return fallback ? [fallback] : [];
  };

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
    platos_image: dish?.platos_image || dish?.platosImage || '',
    images: getInitialImages(dish),
    badge: dish?.badge || '',
    is_available: dish ? dish.is_available !== false : true,
    is_active: dish ? dish.is_active !== false : true
  });

  // Sincronizar formData cuando cambia el plato o se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    if (!dish) {
      setFormData({
        id: '',
        name: '',
        name_en: '',
        code: '',
        description: '',
        description_en: '',
        price: 15.00,
        category_id: categories[0]?.id || 'sandwiches',
        image_url: '',
        platos_image: '',
        images: [],
        badge: '',
        is_available: true,
        is_active: true
      });
      return;
    }

    const imgs = getInitialImages(dish);
    const mainImg = dish.platos_image || dish.platosImage || dish.image_url || dish.image || imgs[0] || '';

    setFormData({
      id: dish.id || '',
      name: dish.name || '',
      name_en: dish.name_en || dish.nameEn || '',
      code: dish.code || '',
      description: dish.description || '',
      description_en: dish.description_en || dish.descriptionEn || '',
      price: Number(dish.price) || 0,
      category_id: dish.category_id || (categories[0]?.id || 'sandwiches'),
      image_url: mainImg,
      platos_image: mainImg,
      images: imgs.length > 0 ? imgs : (mainImg ? [mainImg] : []),
      badge: dish.badge || '',
      is_available: dish.is_available !== false,
      is_active: dish.is_active !== false
    });
  }, [dish, isOpen, categories]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reemplazar de inmediato la foto principal del plato
  const handleSingleImageReplace = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      triggerHaptic(10);

      const publicUrl = await menuService.uploadImage(file);
      setFormData(prev => {
        const remainingImages = (prev.images || []).filter(img => img !== prev.platos_image);
        return {
          ...prev,
          platos_image: publicUrl,
          image_url: publicUrl,
          images: [publicUrl, ...remainingImages]
        };
      });

      showAlert({
        title: 'Imagen Reemplazada',
        message: 'La imagen principal del plato fue actualizada con éxito.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error reemplazando imagen:', err);
      showAlert({
        title: 'Error de carga',
        message: err.message || 'No se pudo subir la imagen.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
      if (singleFileInputRef.current) singleFileInputRef.current.value = '';
    }
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
              <CustomSelect
                value={formData.category_id}
                onChange={(val) => handleChange('category_id', val)}
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                placeholder="Seleccionar Categoría..."
              />
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

          {/* SECCIÓN DESTACADA: IMAGEN ACTUAL DEL PLATO (PORTADA DE LA CARTA) */}
          <div
            style={{
              backgroundColor: '#fcf9f2',
              padding: '1.15rem',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.88rem', fontWeight: 900, color: '#1f1e1c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ImageIcon size={17} color="var(--rojo, #d91c2b)" />
                  <span>Imagen Actual del Plato (Visible en la Carta)</span>
                </label>
                <span style={{ fontSize: '0.74rem', color: '#6b635b' }}>
                  Esta es la imagen principal que ven los clientes al entrar al menú
                </span>
              </div>

              {/* Input oculto para reemplazo directo */}
              <input
                type="file"
                ref={singleFileInputRef}
                accept="image/*"
                onChange={handleSingleImageReplace}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={() => singleFileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  backgroundColor: 'var(--rojo, #d91c2b)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '0.55rem 1rem',
                  borderRadius: '9999px',
                  border: 'none !important',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 15px rgba(217, 28, 43, 0.25)'
                }}
              >
                <Upload size={14} />
                <span>{isUploading ? 'Subiendo...' : 'Cambiar Imagen Actual'}</span>
              </button>
            </div>

            {/* Previsualización en Vivo de la Imagen Actual */}
            {(() => {
              const currentImg = formData.platos_image || formData.image_url || '';
              const CDN_BASE = 'https://scvlxcgmhbwjmvycrttf.supabase.co/storage/v1/object/public/dishes';
              let resolvedCurrent = currentImg;
              let currentFallback = '';

              if (currentImg) {
                if (currentImg.startsWith('http://') || currentImg.startsWith('https://')) {
                  const filename = currentImg.split('/').pop();
                  currentFallback = `/platos_webp/${filename}`;
                } else {
                  const clean = currentImg.replace(/^(\.\/|\/)+/, '');
                  const filename = clean.split('/').pop();
                  currentFallback = `/${clean}`;
                  resolvedCurrent = (filename && filename.toLowerCase().endsWith('.webp'))
                    ? `${CDN_BASE}/platos_webp/${filename}`
                    : `${CDN_BASE}/${clean}`;
                }
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '170px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      backgroundColor: '#f5efe4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    {currentImg ? (
                      <>
                        <img
                          src={resolvedCurrent}
                          alt={formData.name || 'Plato'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            if (currentFallback && e.currentTarget.src !== currentFallback) {
                              e.currentTarget.src = currentFallback;
                            }
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(8px)',
                            color: '#ffffff',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Star size={12} fill="#fbbf24" color="#fbbf24" />
                          <span>Portada Activa</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: '#9ca3af' }}>
                        <ImageIcon size={32} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Sin imagen principal asignada</span>
                      </div>
                    )}
                  </div>

                  {/* Campo de URL Directa / Ruta de Imagen */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        backgroundColor: '#ffffff',
                        padding: '0.55rem 0.85rem',
                        borderRadius: '10px',
                        flex: 1
                      }}
                    >
                      <LinkIcon size={14} color="#6b635b" />
                      <input
                        type="text"
                        value={formData.platos_image || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            platos_image: val,
                            image_url: val,
                            images: val ? [val, ...(prev.images || []).filter(u => u !== val)] : prev.images
                          }));
                        }}
                        placeholder="Ruta o URL directa de la imagen (ej: /platos_webp/ceviche.webp)"
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none !important',
                          outline: 'none',
                          fontSize: '0.8rem',
                          color: '#1f1e1c',
                          fontWeight: 600
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Galería Adicional de Fotografías */}
          <div style={{ backgroundColor: '#fcf9f2', padding: '1rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1f1e1c' }}>
                  Galería Secundaria ({formData.images.length})
                </label>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#6b635b' }}>
                  Fotos adicionales del plato. Pulsa la estrella para convertirla en portada.
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
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
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
                <Plus size={14} />
                <span>{isUploading ? 'Subiendo...' : 'Agregar Fotos'}</span>
              </button>
            </div>

            {/* Cuadrícula de Previsualización de Imágenes */}
            {formData.images.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '160px',
                  overflowY: 'auto'
                }}
              >
                {formData.images.map((imgUrl, idx) => {
                    const SUPABASE_CDN_BASE = 'https://scvlxcgmhbwjmvycrttf.supabase.co/storage/v1/object/public/dishes';
                    const isMain = imgUrl === formData.platos_image || imgUrl === formData.image_url;
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
                          boxShadow: isMain ? '0 0 12px rgba(217, 28, 43, 0.45)' : 'none'
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
