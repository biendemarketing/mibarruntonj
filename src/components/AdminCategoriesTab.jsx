import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Layers, RefreshCw } from 'lucide-react';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminCategoriesTab({
  categories = [],
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRefresh,
  isLoading
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    name_en: '',
    icon: 'UtensilsCrossed',
    sort_order: 0
  });

  const handleOpenCreate = () => {
    triggerHaptic(10);
    setEditingCategory(null);
    setFormData({
      id: '',
      name: '',
      name_en: '',
      icon: 'UtensilsCrossed',
      sort_order: categories.length
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    triggerHaptic(10);
    setEditingCategory(cat);
    setFormData({
      id: cat.id,
      name: cat.name,
      name_en: cat.name_en || cat.nameEn || '',
      icon: cat.icon || 'UtensilsCrossed',
      sort_order: cat.sort_order || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (cat) => {
    triggerHaptic(15);
    const confirmed = await showConfirm({
      title: '¿Eliminar Categoría?',
      message: `¿Estás seguro de eliminar "${cat.name}"? Los platos asociados quedarán sin categoría.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });

    if (confirmed) {
      await onDeleteCategory(cat.id);
      showAlert({
        title: 'Categoría Eliminada',
        message: `La categoría "${cat.name}" fue eliminada de Supabase.`,
        type: 'success'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert({
        title: 'Campo Requerido',
        message: 'Por favor ingresa el nombre de la categoría.',
        type: 'warning'
      });
      return;
    }

    try {
      triggerHaptic(12);
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: formData.name,
          name_en: formData.name_en,
          icon: formData.icon,
          sort_order: Number(formData.sort_order) || 0
        });
        showAlert({
          title: 'Categoría Actualizada',
          message: 'Cambios guardados exitosamente.',
          type: 'success'
        });
      } else {
        const id = formData.id.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await onCreateCategory({
          ...formData,
          id
        });
        showAlert({
          title: 'Categoría Creada',
          message: 'Nueva categoría agregada a Supabase.',
          type: 'success'
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando categoría:', err);
      showAlert({
        title: 'Error al guardar',
        message: err.message || 'No se pudo guardar la categoría.',
        type: 'error'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra Superior */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          padding: '1.15rem 1.35rem',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: 'none !important',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c', margin: 0 }}>
            Categorías del Menú
          </h2>
          <span style={{ fontSize: '0.82rem', color: '#78716c' }}>
            {categories.length} categorías configuradas en Supabase
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              padding: '0.65rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Refrescar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              backgroundColor: 'var(--rojo, #d91c2b)',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 15px rgba(217, 28, 43, 0.3)'
            }}
          >
            <Plus size={18} />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Grid de Categorías */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '1.25rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(217, 28, 43, 0.08)',
                  color: 'var(--rojo, #d91c2b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Layers size={22} />
              </div>

              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    color: '#1f1e1c',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {cat.name}
                </h3>
                {cat.name_en && (
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#78716c' }}>
                    {cat.name_en}
                  </p>
                )}
                <span style={{ fontSize: '0.72rem', color: '#a8a29e', fontWeight: 600 }}>
                  Orden: #{cat.sort_order ?? idx} · Slug: {cat.id}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => handleOpenEdit(cat)}
                style={{
                  backgroundColor: '#f5efe4',
                  color: '#1f1e1c',
                  border: 'none !important',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  cursor: 'pointer'
                }}
                title="Editar categoría"
              >
                <Edit2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(cat)}
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: 'none !important',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  cursor: 'pointer'
                }}
                title="Eliminar categoría"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para Crear / Editar Categoría */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#ffffff',
              color: '#1f1e1c',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
              border: 'none !important',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c', margin: 0 }}>
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#78716c' }}>
                  Aparecerá en el filtro principal y menú web
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  borderRadius: '9999px',
                  padding: '0.45rem',
                  color: '#1f1e1c',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  Nombre de la Categoría en Español *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Ceviches y Mariscos"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    border: 'none !important',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                  Subtítulo / Nombre en Inglés (Traducción)
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))}
                  placeholder="Ej: Traditional Peruvian Ceviches"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    borderRadius: '14px',
                    fontSize: '0.9rem',
                    border: 'none !important',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                    Identificador (Slug)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingCategory)}
                    value={formData.id}
                    onChange={(e) => setFormData(p => ({ ...p, id: e.target.value }))}
                    placeholder="Auto o ej: mariscos"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      backgroundColor: '#f5efe4',
                      color: editingCategory ? '#a8a29e' : '#1f1e1c',
                      borderRadius: '14px',
                      fontSize: '0.9rem',
                      border: 'none !important',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1f1e1c', marginBottom: '0.35rem' }}>
                    Orden de Posición
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(p => ({ ...p, sort_order: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      backgroundColor: '#f5efe4',
                      color: '#1f1e1c',
                      borderRadius: '14px',
                      fontSize: '0.9rem',
                      border: 'none !important',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    fontWeight: 800,
                    padding: '0.85rem',
                    borderRadius: '14px',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    backgroundColor: 'var(--rojo, #d91c2b)',
                    color: '#ffffff',
                    fontWeight: 900,
                    padding: '0.85rem',
                    borderRadius: '14px',
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(217, 28, 43, 0.35)'
                  }}
                >
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
