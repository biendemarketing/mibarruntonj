import React from 'react';
import { InstagramIcon, FacebookIcon, WhatsAppIcon, DoorDashIcon, UberEatsIcon } from './Icons';
import { Phone, MapPin, Printer, Download, Images, Tv, Clock } from 'lucide-react';

export function Footer({ photoMode = 'complete', onTogglePhotoMode, onOpenTvMode }) {
  return (
    <footer className="footer-compact-black">
      <div className="footer-compact-inner">
        {/* Fila Central de Información Compacta — Perfectamente Centrada */}
        <div className="footer-compact-grid">
          {/* Horario de Atención */}
          <div className="footer-compact-card">
            <span className="footer-compact-label">Horario</span>
            <p className="footer-compact-text">
              <strong style={{ color: 'var(--rojo)', fontWeight: 800 }}>Atención 24 Horas</strong><br />
              Abierto todos los días
            </p>
          </div>

          {/* Servicios */}
          <div className="footer-compact-card">
            <span className="footer-compact-label">Servicios</span>
            <p className="footer-compact-text">
              Desayunos · Almuerzos · Cenas · Productos peruanos y más
            </p>
          </div>

          {/* Dirección */}
          <div className="footer-compact-card">
            <span className="footer-compact-label">Dirección</span>
            <a
              href="https://maps.google.com/?q=21+Mill+st,+Paterson,+NJ+07011"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-compact-link"
            >
              <MapPin size={14} color="var(--naranja)" />
              <span>21 Mill st, Paterson, NJ 07011</span>
            </a>
          </div>

          {/* Teléfono */}
          <div className="footer-compact-card">
            <span className="footer-compact-label">Teléfono</span>
            <a href="tel:9736533749" className="footer-compact-link">
              <Phone size={14} color="var(--naranja)" />
              <span style={{ fontWeight: 700 }}>(973) 653-3749</span>
            </a>
          </div>
        </div>

        {/* Redes y Plataformas de Delivery */}
        <div className="footer-actions-row">
          {/* Botones de Utilidad: Fotos, Modo TV, Imprimir, Descargar PDF */}
          <div className="footer-tools-pills">
            {/* Botón Alternar Versión de Fotos (Solo Icono, Sin Fondo, al lado de Imprimir) */}
            <button
              type="button"
              onClick={onTogglePhotoMode}
              className={`footer-icon-only-btn ${photoMode === 'complete' ? 'active-photo-mode' : ''}`}
              title={photoMode === 'complete' 
                ? 'Galería Completa Activa (Fotos de la carpeta platos). Clic para volver a fotos seleccionadas' 
                : 'Cambiar a Galería Completa (Ver fotos de todos los platos de la carpeta platos)'}
              aria-label="Alternar versión de fotos de los platos"
              style={{
                color: photoMode === 'complete' ? 'var(--naranja)' : '#ffffff'
              }}
            >
              <Images size={18} />
            </button>

            {/* Botón Modo Menú TV (Presentación Pantalla Completa para Mesas y Televisores) */}
            {onOpenTvMode && (
              <button
                type="button"
                onClick={onOpenTvMode}
                className="footer-icon-only-btn"
                title="Modo Menú TV (Presentación en Pantalla Completa para Mesas y Televisores)"
                aria-label="Abrir Modo Menú TV"
                style={{ color: '#ffffff' }}
              >
                <Tv size={18} />
              </button>
            )}

            {/* Botón Imprimir (Solo Icono, Sin Fondo) */}
            <a
              href="./menu_imprimible.html"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-icon-only-btn"
              title="Imprimir Carta Imprimible 11x8.5"
              aria-label="Imprimir Carta Imprimible"
            >
              <Printer size={18} />
            </a>

            {/* Botón Descargar PDF Directo (Descarga el archivo PDF 11x8.5 real sin pasar por impresión) */}
            <a
              href="./menu_mi_barrunto.pdf"
              download="Carta_Menu_Mi_Barrunto_11x8.5.pdf"
              className="footer-icon-only-btn"
              title="Descargar Carta Menú en PDF (11x8.5)"
              aria-label="Descargar Carta en PDF"
            >
              <Download size={18} />
            </a>
          </div>

          {/* Redes Sociales Oficiales */}
          <div className="footer-social-icons-group">
            <a
              href="https://www.facebook.com/cebicheriamibarrunto"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-circle"
              aria-label="Facebook"
              title="Facebook"
            >
              <FacebookIcon size={16} />
            </a>
            <a
              href="https://www.instagram.com/cevicheria.mibarrunto/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-circle"
              aria-label="Instagram"
              title="Instagram"
            >
              <InstagramIcon size={16} />
            </a>
            <a
              href="https://wa.me/19736533749"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-circle"
              aria-label="WhatsApp"
              title="WhatsApp: (973) 653-3749"
            >
              <WhatsAppIcon size={16} />
            </a>
          </div>

          {/* Plataformas de Delivery: DoorDash y Uber Eats (En móvil en otra línea más abajo) */}
          <div className="footer-delivery-pills">
            <a
              href="https://www.doordash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-pill-btn"
              title="Pedir en DoorDash"
            >
              <DoorDashIcon size={18} />
              <span>DoorDash</span>
            </a>
            <a
              href="https://www.ubereats.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-pill-btn"
              title="Pedir en Uber Eats"
            >
              <UberEatsIcon size={18} />
              <span>Uber Eats</span>
            </a>
          </div>
        </div>

        {/* Aviso de Agradecimiento 18% en mesas con 2 o más personas */}
        <div className="footer-gratitude-notice">
          <span>Agradecimiento del 18% en las mesas con 2 ó más personas</span>
          <span className="footer-gratitude-dot">·</span>
          <span>Gratitude of 18% on table 2 or more people</span>
        </div>

        {/* Copyright y Acceso Administrativo */}
        <div className="footer-compact-bottom">
          <p>Mi Barrunto © Todos los derechos reservados · Paterson, NJ</p>
          <div style={{ marginTop: '0.35rem' }}>
            <a
              href="/admin"
              style={{
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '0.72rem',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)'; }}
            >
              Acceso Administrativo
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
