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
          backgroundColor: 'var(--bg-card, #1c1d22)',
          padding: '1rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: 'none !important'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Categorías del Menú
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {categories.length} categorías configuradas en Supabase
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              padding: '0.65rem 0.85rem',
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
              boxShadow: '0 4px 15px rgba(217, 28, 43, 0.4)'
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
              backgroundColor: 'var(--bg-card, #1c1d22)',
              borderRadius: '16px',
              padding: '1.15rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              border: 'none !important',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(217, 28, 43, 0.15)',
                  color: 'var(--rojo, #d91c2b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Layers size={20} />
              </div>

              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {cat.name}
                </h3>
                {cat.name_en && (
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                    {cat.name_en}
                  </p>
                )}
                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>
                  Orden: #{cat.sort_order ?? idx} · ID: {cat.id}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => handleOpenEdit(cat)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: 'none !important',
                  borderRadius: '8px',
                  padding: '0.45rem',
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
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: 'none !important',
                  borderRadius: '8px',
                  padding: '0.45rem',
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
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
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
              backgroundColor: 'var(--bg-card, #1c1d22)',
              color: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.65)',
              border: 'none !important',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: 'none !important',
                  borderRadius: '9999px',
                  padding: '0.4rem',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Ceviches y Mariscos"
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
                  Subtítulo / Nombre en Inglés
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))}
                  placeholder="Ej: Traditional Peruvian ceviches"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
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
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: editingCategory ? '#6b7280' : '#ffffff',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      border: 'none !important'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', marginBottom: '0.35rem' }}>
                    Orden de Posición
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(p => ({ ...p, sort_order: e.target.value }))}
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

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '0.75rem',
                    borderRadius: '12px',
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
                    fontWeight: 800,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(217, 28, 43, 0.4)'
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
