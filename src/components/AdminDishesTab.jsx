import React, { useState } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Check, AlertCircle, 
  Image as ImageIcon, RefreshCw, Eye, EyeOff 
} from 'lucide-react';
import { AdminDishModal } from './AdminDishModal';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';

export function AdminDishesTab({
  dishes = [],
  categories = [],
  onCreateDish,
  onUpdateDish,
  onDeleteDish,
  onToggleAvailability,
  onRefresh,
  isLoading
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [editingDish, setEditingDish] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtrado de platos
  const filteredDishes = dishes.filter(d => {
    const matchesSearch = !search.trim() || 
      d.name.toLowerCase().includes(search.toLowerCase()) || 
      (d.description && d.description.toLowerCase().includes(search.toLowerCase())) ||
      (d.code && d.code.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCat === 'all' || d.category_id === selectedCat;

    return matchesSearch && matchesCategory;
  });

  const handleOpenCreate = () => {
    triggerHaptic(10);
    setEditingDish(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dish) => {
    triggerHaptic(10);
    setEditingDish(dish);
    setIsModalOpen(true);
  };

  const handleDelete = async (dish) => {
    triggerHaptic(15);
    const confirmed = await showConfirm({
      title: '¿Eliminar Plato?',
      message: `¿Estás seguro de eliminar "${dish.name}" de la carta? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });

    if (confirmed) {
      await onDeleteDish(dish.id);
      showAlert({
        title: 'Plato Eliminado',
        message: `El plato "${dish.name}" fue removido de Supabase.`,
        type: 'success'
      });
    }
  };

  const handleSaveModal = async (formData) => {
    if (editingDish) {
      await onUpdateDish(editingDish.id, formData);
      showAlert({
        title: 'Plato Actualizado',
        message: 'Los cambios fueron guardados exitosamente.',
        type: 'success'
      });
    } else {
      await onCreateDish(formData);
      showAlert({
        title: 'Plato Creado',
        message: 'El nuevo plato ha sido añadido a la carta en Supabase.',
        type: 'success'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra Superior de Control y Búsqueda */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-card, #1c1d22)',
          padding: '1rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: 'none !important'
        }}
      >
        {/* Buscador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#9ca3af' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plato por nombre o código..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                border: 'none !important'
              }}
            />
          </div>

          {/* Selector de Categoría */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              padding: '0.65rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none !important',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ backgroundColor: '#1c1d22' }}>Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id} style={{ backgroundColor: '#1c1d22' }}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Botón Nuevo Plato y Refresh */}
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
            title="Refrescar catálogo"
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
            <span>Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Contador de Platos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600 }}>
          Mostrando <strong style={{ color: '#ffffff' }}>{filteredDishes.length}</strong> de {dishes.length} platos en Supabase
        </span>
      </div>

      {/* Lista de Platos en Tabla / Cards Responsive */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredDishes.map(dish => {
          const imgSrc = dish.platos_image || dish.image_url;
          const isAvail = dish.is_available !== false;
          const categoryName = categories.find(c => c.id === dish.category_id)?.name || dish.category_id;

          return (
            <div
              key={dish.id}
              style={{
                backgroundColor: 'var(--bg-card, #1c1d22)',
                borderRadius: '16px',
                padding: '1rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                border: 'none !important',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                opacity: isAvail ? 1 : 0.65,
                transition: 'opacity 0.2s'
              }}
            >
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                {/* Miniatura */}
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={dish.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <ImageIcon size={22} color="#9ca3af" />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--rojo, #d91c2b)', textTransform: 'uppercase' }}>
                      {categoryName}
                    </span>
                    {dish.code && (
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600 }}>
                        {dish.code}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      margin: '0.15rem 0 0.25rem 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={dish.name}
                  >
                    {dish.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--naranja, #f97316)' }}>
                      ${Number(dish.price).toFixed(2)}
                    </span>
                    {dish.badge && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(249, 115, 22, 0.18)',
                          color: 'var(--naranja, #f97316)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px'
                        }}
                      >
                        {dish.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra Inferior con Switch de Disponibilidad y Acciones */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.65rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  padding: '0.5rem 0.75rem'
                }}
              >
                {/* Switch Rápido Disponible / Agotado */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    onToggleAvailability(dish.id, !isAvail);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: isAvail ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                    color: isAvail ? '#10b981' : '#ef4444',
                    border: 'none !important',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title={isAvail ? 'Plato disponible en la carta' : 'Plato marcado como agotado'}
                >
                  {isAvail ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{isAvail ? 'Disponible' : 'Agotado'}</span>
                </button>

                {/* Acciones Editar y Eliminar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(dish)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: 'none !important',
                      borderRadius: '8px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Editar plato"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(dish)}
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      border: 'none !important',
                      borderRadius: '8px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Eliminar plato"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Crear / Editar Plato */}
      <AdminDishModal
        isOpen={isModalOpen}
        dish={editingDish}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
      />
    </div>
  );
}
