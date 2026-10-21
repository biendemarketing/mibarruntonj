import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  width = '100%',
  style = {},
  buttonStyle = {},
  menuStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    triggerHaptic(6);
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width, ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            triggerHaptic(6);
            setIsOpen(prev => !prev);
          }
        }}
        style={{
          width: '100%',
          padding: '0.65rem 0.85rem',
          borderRadius: '12px',
          backgroundColor: '#f5efe4',
          border: 'none !important',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.84rem',
          fontWeight: 700,
          color: '#1f1e1c',
          boxSizing: 'border-box',
          boxShadow: isOpen ? '0 6px 16px rgba(0,0,0,0.06)' : 'none',
          transition: 'all 0.15s ease',
          ...buttonStyle
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? (
            <>
              {selectedOption.icon && <span style={{ display: 'flex' }}>{selectedOption.icon}</span>}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span style={{ color: '#78716c' }}>{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          size={16} 
          color="#78716c" 
          style={{ 
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            minWidth: '160px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '0.4rem',
            boxShadow: '0 16px 38px rgba(0, 0, 0, 0.15)',
            border: 'none !important',
            zIndex: 10000,
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            boxSizing: 'border-box',
            ...menuStyle
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(217, 28, 43, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--rojo, #d91c2b)' : '#1f1e1c',
                  border: 'none !important',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f5efe4';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.icon && <span style={{ display: 'flex' }}>{opt.icon}</span>}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={14} color="var(--rojo, #d91c2b)" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
