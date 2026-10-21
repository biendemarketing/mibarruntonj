import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, Plus, Search, CheckCircle2, Circle, 
  Clock, AlertCircle, User, Users, Filter, Trash2, 
  Edit3, X, RefreshCw, ChefHat, Sparkles, AlertTriangle,
  ArrowRight, Tag, Calendar
} from 'lucide-react';
import { tasksService } from '../services/supabase';
import { useAlertConfirm } from '../context/AlertConfirmContext';
import { triggerHaptic } from '../utils/haptics';
import { CustomSelect } from './CustomSelect';

export function AdminTasksTab({
  waiters = [],
  currentWaiter = null,
  onTasksCountChange = null
}) {
  const { showConfirm, showAlert } = useAlertConfirm();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState('all');
  const [statusTab, setStatusTab] = useState('pending'); // 'pending' | 'completed' | 'all'

  // Modal Crear / Editar Tarea
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    area: 'general',
    assigned_to_id: '',
    assigned_to_name: 'Equipo General',
    due_date: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Nombre del autor actual
  const currentAuthorName = currentWaiter?.name || 'Administración';

  // Cargar tareas
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await tasksService.getTasks();
      setTasks(data || []);
      const pendingCount = (data || []).filter(t => t.status === 'pending').length;
      if (onTasksCountChange) {
        onTasksCountChange(pendingCount);
      }
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    // Suscripción Realtime a nuevas tareas
    const channel = tasksService.subscribeToTasks(() => {
      loadTasks();
    });

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, []);

  // Filtrado reactivo de tareas
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchStatus = 
        statusTab === 'all' ? true :
        statusTab === 'pending' ? t.status === 'pending' || t.status === 'in_progress' :
        t.status === 'completed';

      const matchArea = selectedArea === 'all' || t.area === selectedArea;
      const matchPriority = selectedPriority === 'all' || t.priority === selectedPriority;
      const matchCreator = selectedCreator === 'all' || t.created_by_name === selectedCreator;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.created_by_name?.toLowerCase().includes(q) ||
        t.assigned_to_name?.toLowerCase().includes(q);

      return matchStatus && matchArea && matchPriority && matchCreator && matchQuery;
    });
  }, [tasks, statusTab, selectedArea, selectedPriority, selectedCreator, searchQuery]);

  // Métricas
  const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'pending' || t.status === 'in_progress'), [tasks]);
  const urgentTasks = useMemo(() => pendingTasks.filter(t => t.priority === 'urgente' || t.priority === 'alta'), [pendingTasks]);
  const completedToday = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);

  // Lista única de empleados que han creado tareas para el filtro
  const creatorsList = useMemo(() => {
    const names = new Set();
    tasks.forEach(t => {
      if (t.created_by_name) names.add(t.created_by_name);
    });
    return Array.from(names);
  }, [tasks]);

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    triggerHaptic(8);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'media',
      area: 'general',
      assigned_to_id: '',
      assigned_to_name: 'Equipo General',
      due_date: ''
    });
    setIsModalOpen(true);
  };

  // Abrir Modal Editar
  const handleOpenEdit = (task) => {
    triggerHaptic(8);
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'media',
      area: task.area || 'general',
      assigned_to_id: task.assigned_to_id || '',
      assigned_to_name: task.assigned_to_name || 'Equipo General',
      due_date: task.due_date ? task.due_date.slice(0, 16) : ''
    });
    setIsModalOpen(true);
  };

  // Guardar Tarea (Crear o Modificar)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setIsSaving(true);
      triggerHaptic(10);

      const assignedWaiter = waiters.find(w => w.id === formData.assigned_to_id);

      const taskPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        area: formData.area,
        assigned_to_id: formData.assigned_to_id || null,
        assigned_to_name: assignedWaiter ? assignedWaiter.name : 'Equipo General',
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        created_by_id: currentWaiter?.id || null,
        created_by_name: currentAuthorName
      };

      if (editingTask) {
        const updated = await tasksService.updateTask(editingTask.id, taskPayload);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updated } : t));
      } else {
        const created = await tasksService.createTask(taskPayload);
        setTasks(prev => [created, ...prev]);
      }

      setIsModalOpen(false);
      const newPendingCount = tasks.filter(t => t.status === 'pending').length + (editingTask ? 0 : 1);
      if (onTasksCountChange) onTasksCountChange(newPendingCount);
    } catch (err) {
      console.error('Error guardando tarea:', err);
      showAlert({
        title: 'Error al Guardar',
        message: 'No se pudo guardar la tarea. Inténtalo de nuevo.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Alternar Estado de Tarea (Checklist 1-Clic)
  const handleToggleTask = async (task) => {
    triggerHaptic(12);
    try {
      const updated = await tasksService.toggleTaskStatus(
        task.id, 
        task.status, 
        currentAuthorName
      );

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updated } : t));
      const newCount = tasks.filter(t => t.id === task.id ? updated.status === 'pending' : t.status === 'pending').length;
      if (onTasksCountChange) onTasksCountChange(newCount);
    } catch (err) {
      console.error('Error actualizando estado de tarea:', err);
    }
  };

  // Eliminar Tarea
  const handleDeleteTask = async (task) => {
    triggerHaptic(10);
    const confirmed = await showConfirm({
      title: '¿Eliminar Tarea?',
      message: `¿Estás seguro de eliminar la tarea "${task.title}"?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      isDestructive: true
    });

    if (confirmed) {
      try {
        await tasksService.deleteTask(task.id);
        setTasks(prev => prev.filter(t => t.id !== task.id));
        const newCount = tasks.filter(t => t.id !== task.id && t.status === 'pending').length;
        if (onTasksCountChange) onTasksCountChange(newCount);
      } catch (err) {
        console.error('Error eliminando tarea:', err);
      }
    }
  };

  // Colores e iconos de prioridad
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgente':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626', label: 'Urgente' };
      case 'alta':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#b45309', label: 'Alta' };
      case 'media':
        return { bg: 'rgba(37, 99, 235, 0.12)', text: '#2563eb', label: 'Media' };
      default:
        return { bg: '#f5efe4', text: '#78716c', label: 'Baja' };
    }
  };

  const getAreaLabel = (area) => {
    switch (area) {
      case 'salon': return 'Salón / Mesas';
      case 'cocina': return 'Cocina';
      case 'barra': return 'Barra / Bebidas';
      case 'caja': return 'Caja / Cobros';
      case 'compras_inventario': return 'Compras / Stock';
      default: return 'General';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Tarjetas de Resumen & Métricas Operativas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Métricas: Pendientes */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(217, 28, 43, 0.1)',
              color: 'var(--rojo, #d91c2b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c', display: 'block' }}>
              Tareas Pendientes
            </span>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1f1e1c' }}>
              {pendingTasks.length}
            </span>
          </div>
        </div>

        {/* Métricas: Urgentes */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c', display: 'block' }}>
              Urgentes / Alta Prioridad
            </span>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626' }}>
              {urgentTasks.length}
            </span>
          </div>
        </div>

        {/* Métricas: Completadas */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#78716c', display: 'block' }}>
              Completadas
            </span>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10b981' }}>
              {completedToday.length}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra Principal de Control & Filtros */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Título de Sección */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(217, 28, 43, 0.1)',
                color: 'var(--rojo, #d91c2b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckSquare size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1f1e1c' }}>
                Tareas & Notas del Restaurante
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
                Asignación de tareas operativas entre meseros, cocina y gerencia
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={loadTasks}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#f5efe4',
                color: '#78716c',
                border: 'none !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Recargar tareas"
            >
              <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                padding: '0.65rem 1.15rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none !important',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(217, 28, 43, 0.28)'
              }}
            >
              <Plus size={18} />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>

        {/* Fila de Filtros: Buscador + Píldoras de Estado + Filtro por Empleado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Tabs de Estado: Pendientes / Completadas / Todas */}
          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#f5efe4', padding: '0.25rem', borderRadius: '12px' }}>
            {[
              { id: 'pending', label: `Pendientes (${pendingTasks.length})` },
              { id: 'completed', label: `Completadas (${completedToday.length})` },
              { id: 'all', label: `Todas (${tasks.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setStatusTab(tab.id);
                }}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: statusTab === tab.id ? '#ffffff' : 'transparent',
                  color: statusTab === tab.id ? '#1f1e1c' : '#78716c',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  border: 'none !important',
                  cursor: 'pointer',
                  boxShadow: statusTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Buscador */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} color="#78716c" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tarea..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.3rem',
                  borderRadius: '12px',
                  backgroundColor: '#f5efe4',
                  border: 'none !important',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#1f1e1c',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* REQUERIMIENTO: Filtro por Empleado que dejó la nota/tarea */}
            <div style={{ width: '170px' }}>
              <CustomSelect
                value={selectedCreator}
                onChange={setSelectedCreator}
                options={[
                  { value: 'all', label: 'Dejada por: Todos' },
                  ...creatorsList.map(name => ({ value: name, label: `Dejada por: ${name}` }))
                ]}
              />
            </div>

            {/* Filtro por Área */}
            <div style={{ width: '150px' }}>
              <CustomSelect
                value={selectedArea}
                onChange={setSelectedArea}
                options={[
                  { value: 'all', label: 'Área: Todas' },
                  { value: 'salon', label: 'Salón / Mesas' },
                  { value: 'cocina', label: 'Cocina' },
                  { value: 'barra', label: 'Barra' },
                  { value: 'caja', label: 'Caja' },
                  { value: 'compras_inventario', label: 'Compras / Stock' },
                  { value: 'general', label: 'General' }
                ]}
              />
            </div>

            {/* Filtro por Prioridad */}
            <div style={{ width: '150px' }}>
              <CustomSelect
                value={selectedPriority}
                onChange={setSelectedPriority}
                options={[
                  { value: 'all', label: 'Prioridad: Todas' },
                  { value: 'urgente', label: 'Urgente' },
                  { value: 'alta', label: 'Alta' },
                  { value: 'media', label: 'Media' },
                  { value: 'baja', label: 'Baja' }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lista Interactiva de Tareas (Checklist) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredTasks.map(task => {
          const isDone = task.status === 'completed';
          const pStyle = getPriorityStyle(task.priority);

          return (
            <div
              key={task.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '1.15rem 1.35rem',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.03)',
                border: 'none !important',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                opacity: isDone ? 0.7 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              {/* Checkbox Circular + Información */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                <button
                  type="button"
                  onClick={() => handleToggleTask(task)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isDone ? '#10b981' : '#f5efe4',
                    color: isDone ? '#ffffff' : '#78716c',
                    border: 'none !important',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '0.15rem',
                    transition: 'all 0.15s ease'
                  }}
                  title={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                >
                  {isDone ? <CheckCircle2 size={20} /> : <Circle size={18} />}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.98rem',
                        fontWeight: 900,
                        color: isDone ? '#6b7280' : '#1f1e1c',
                        textDecoration: isDone ? 'line-through' : 'none'
                      }}
                    >
                      {task.title}
                    </h4>

                    {/* Badge de Prioridad */}
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        backgroundColor: pStyle.bg,
                        color: pStyle.text,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '6px'
                      }}
                    >
                      {pStyle.label}
                    </span>

                    {/* Badge de Área */}
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        backgroundColor: '#f5efe4',
                        color: '#78716c',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '6px'
                      }}
                    >
                      {getAreaLabel(task.area)}
                    </span>
                  </div>

                  {task.description && (
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.35 }}>
                      {task.description}
                    </p>
                  )}

                  {/* Metadatos de Auditoría: Quién la dejó y a quién se asignó */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.65rem', fontSize: '0.74rem', color: '#78716c' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={13} color="#a8a29e" />
                      <span>
                        Dejada por: <strong style={{ color: '#1f1e1c' }}>{task.created_by_name}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={13} color="#a8a29e" />
                      <span>
                        Asignada a: <strong style={{ color: '#2563eb' }}>{task.assigned_to_name || 'Equipo General'}</strong>
                      </span>
                    </div>

                    {isDone && task.completed_by_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 800 }}>
                        <CheckCircle2 size={13} />
                        <span>Completada por {task.completed_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Edición y Eliminación */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(task)}
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    backgroundColor: '#f5efe4',
                    color: '#44403c',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                  title="Editar tarea"
                >
                  <Edit3 size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task)}
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                  title="Eliminar tarea"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && !isLoading && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(0,0,0,0.03)'
            }}
          >
            <CheckSquare size={38} color="#a8a29e" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1f1e1c', margin: 0 }}>
              No hay tareas en este filtro
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#78716c', margin: '0.25rem 0 1rem 0' }}>
              {statusTab === 'pending' ? '¡Todo el equipo está al día con sus tareas!' : 'No se encontraron tareas registradas'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '14px',
                backgroundColor: 'var(--rojo, #d91c2b)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none !important',
                cursor: 'pointer'
              }}
            >
              Crear Nueva Tarea
            </button>
          </div>
        )}
      </div>

      {/* 4. Modal Crear / Editar Tarea */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2600,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '26px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
              border: 'none !important',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <CheckSquare size={20} color="var(--rojo, #d91c2b)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1f1e1c' }}>
                  {editingTask ? 'Editar Tarea' : 'Crear Tarea / Dejar Nota'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#f5efe4',
                  color: '#78716c',
                  border: 'none !important',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                  Título de la Tarea o Instrucción *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Revisar stock de mariscos para turno noche"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#f5efe4',
                    border: 'none !important',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                  Detalles o Instrucciones Adicionales
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe los pasos, observaciones o detalles específicos..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    backgroundColor: '#f5efe4',
                    border: 'none !important',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                    Área Operativa
                  </label>
                  <CustomSelect
                    value={formData.area}
                    onChange={(val) => setFormData(prev => ({ ...prev, area: val }))}
                    options={[
                      { value: 'general', label: 'General' },
                      { value: 'salon', label: 'Salón / Mesas' },
                      { value: 'cocina', label: 'Cocina' },
                      { value: 'barra', label: 'Barra / Bebidas' },
                      { value: 'caja', label: 'Caja / Cobros' },
                      { value: 'compras_inventario', label: 'Compras / Stock' }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                    Prioridad
                  </label>
                  <CustomSelect
                    value={formData.priority}
                    onChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                    options={[
                      { value: 'baja', label: 'Baja' },
                      { value: 'media', label: 'Media' },
                      { value: 'alta', label: 'Alta' },
                      { value: 'urgente', label: 'Urgente' }
                    ]}
                  />
                </div>
              </div>

              {/* Asignación a un Empleado Específico */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#44403c', display: 'block', marginBottom: '0.25rem' }}>
                  Asignar a Empleado
                </label>
                <CustomSelect
                  value={formData.assigned_to_id}
                  onChange={(wid) => {
                    const w = waiters.find(item => item.id === wid);
                    setFormData(prev => ({
                      ...prev,
                      assigned_to_id: wid,
                      assigned_to_name: w ? w.name : 'Equipo General'
                    }));
                  }}
                  placeholder="Equipo General (Cualquier mesero o cocinero)"
                  options={[
                    { value: '', label: 'Equipo General (Cualquier mesero o cocinero)' },
                    ...waiters.map(w => ({ value: w.id, label: `${w.name} (${w.role || 'Mesero'})` }))
                  ]}
                />
              </div>

              {/* Pie con autor actual */}
              <div style={{ backgroundColor: '#faf7f2', padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.75rem', color: '#78716c' }}>
                Registrando nota como: <strong style={{ color: '#1f1e1c' }}>{currentAuthorName}</strong>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '14px',
                    backgroundColor: '#f5efe4',
                    color: '#78716c',
                    fontWeight: 800,
                    border: 'none !important',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '14px',
                    backgroundColor: 'var(--rojo, #d91c2b)',
                    color: '#ffffff',
                    fontWeight: 800,
                    border: 'none !important',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(217, 28, 43, 0.28)'
                  }}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
