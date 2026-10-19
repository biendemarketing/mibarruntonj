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
  onToggleVisibility,
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
      (d.name_en && d.name_en.toLowerCase().includes(search.toLowerCase())) ||
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
        message: `"${formData.name}" ha sido agregado a la carta en Supabase.`,
        type: 'success'
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra de Búsqueda y Botón Crear */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
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
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#6b635b' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, descripción o código..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                backgroundColor: '#f5efe4',
                color: '#1f1e1c',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none !important',
                outline: 'none'
              }}
            />
          </div>

          {/* Selector de Categoría */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            style={{
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
              padding: '0.65rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none !important',
              cursor: 'pointer'
            }}
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
              backgroundColor: '#f5efe4',
              color: '#1f1e1c',
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
              boxShadow: '0 4px 15px rgba(217, 28, 43, 0.25)'
            }}
          >
            <Plus size={18} />
            <span>Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Grid de Platos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filteredDishes.map(dish => {
          const cat = categories.find(c => c.id === dish.category_id);
          const isAvail = dish.is_available !== false;
          const isActive = dish.is_active !== false;
          const SUPABASE_CDN_BASE = 'https://scvlxcgmhbwjmvycrttf.supabase.co/storage/v1/object/public/dishes';
          let imgUrl = dish.platos_image || dish.image_url || '';
          let fallbackUrl = '';
          if (imgUrl) {
            if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
              const filename = imgUrl.split('/').pop();
              fallbackUrl = `/platos_webp/${filename}`;
            } else {
              const clean = imgUrl.replace(/^(\.\/|\/)+/, '');
              const filename = clean.split('/').pop();
              fallbackUrl = `/${clean}`;
              imgUrl = filename && filename.toLowerCase().endsWith('.webp')
                ? `${SUPABASE_CDN_BASE}/platos_webp/${filename}`
                : `${SUPABASE_CDN_BASE}/${clean}`;
            }
          }

          return (
            <div
              key={dish.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '1.15rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: 'none !important',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                opacity: isActive ? 1 : 0.65,
                transition: 'opacity 0.2s ease'
              }}
            >
              {/* Encabezado: Foto en miniatura + Info básica */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    backgroundColor: '#f5efe4',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={dish.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={(e) => {
                        if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                          e.currentTarget.src = fallbackUrl;
                        }
                      }}
                    />
                  ) : (
                    <ImageIcon size={24} color="#6b635b" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <h3
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: '#1f1e1c',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={dish.name}
                    >
                      {dish.name}
                    </h3>
                  </div>

                  {dish.name_en && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        color: '#6b635b',
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {dish.name_en}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#6b635b', backgroundColor: '#f5efe4', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                      {cat?.name || dish.category_id}
                    </span>
                    {dish.code && (
                      <span style={{ fontSize: '0.72rem', color: '#6b635b', fontWeight: 600 }}>
                        {dish.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Precio y Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.15rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--rojo, #d91c2b)' }}>
                  ${Number(dish.price || 0).toFixed(2)}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {/* Badge de Visibilidad */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? '#ecfdf5' : '#fef3c7',
                      color: isActive ? '#059669' : '#b45309'
                    }}
                  >
                    {isActive ? 'Visible' : 'Oculto'}
                  </span>

                  {/* Badge de Disponibilidad */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: isAvail ? '#eff6ff' : '#fee2e2',
                      color: isAvail ? '#2563eb' : '#b91c1c'
                    }}
                  >
                    {isAvail ? 'Disponible' : 'Agotado'}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.25rem' }}>
                {/* Alternar Disponibilidad */}
                <button
                  type="button"
                  onClick={() => onToggleAvailability(dish.id, !isAvail)}
                  style={{
                    flex: 1,
                    backgroundColor: isAvail ? '#f5efe4' : '#ecfdf5',
                    color: isAvail ? '#6b635b' : '#059669',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                  }}
                  title={isAvail ? 'Marcar como agotado' : 'Marcar como disponible'}
                >
                  <Check size={13} />
                  <span>{isAvail ? 'Agotar' : 'Reactivar'}</span>
                </button>

                {/* Alternar Visibilidad (Ocultar / Mostrar) */}
                <button
                  type="button"
                  onClick={() => onToggleVisibility && onToggleVisibility(dish.id, !isActive)}
                  style={{
                    backgroundColor: '#f5efe4',
                    color: isActive ? '#6b635b' : '#b45309',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: 'none !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={isActive ? 'Ocultar plato en la carta del comensal' : 'Mostrar plato en la carta'}
                >
                  {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                {/* Editar */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(dish)}
                  style={{
                    backgroundColor: '#f5efe4',
                    color: '#1f1e1c',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: 'none !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Editar plato"
                >
                  <Edit2 size={14} />
                </button>

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => handleDelete(dish)}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: 'none !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Eliminar plato"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Crear / Editar Plato */}
      <AdminDishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dish={editingDish}
        categories={categories}
        onSave={handleSaveModal}
      />
    </div>
  );
}
