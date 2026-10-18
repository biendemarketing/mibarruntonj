import React from 'react';
import { InstagramIcon, FacebookIcon, WhatsAppIcon, DoorDashIcon, UberEatsIcon } from './Icons';
import { Phone, MapPin, Printer, Download, Images } from 'lucide-react';

export function Footer({ photoMode = 'curated', onTogglePhotoMode }) {
  return (
    <footer className="footer-compact-black">
      <div className="footer-compact-inner">
        {/* Fila Central de Información Compacta — Perfectamente Centrada */}
        <div className="footer-compact-grid">
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
              href="https://maps.google.com/?q=21+Mill+St+%239,+Paterson,+NJ"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-compact-link"
            >
              <MapPin size={14} color="var(--naranja)" />
              <span>21 Mill St, #9, Paterson, NJ</span>
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
          <div className="footer-delivery-pills">
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

            {/* Botón Descargar PDF (Abre diálogo directo para Guardar como PDF 11x8.5, NO descarga html) */}
            <a
              href="./menu_imprimible.html?print=1"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-icon-only-btn"
              title="Descargar / Guardar Carta en PDF (11x8.5)"
              aria-label="Descargar Carta en PDF"
            >
              <Download size={18} />
            </a>

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
        </div>

        {/* Copyright */}
        <div className="footer-compact-bottom">
          <p>Mi Barrunto © Todos los derechos reservados · Paterson, NJ</p>
        </div>
      </div>
    </footer>
  );
}
