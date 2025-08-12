
import React from 'react';

export default function FilterModal({ visible, onClose, children }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'grid',
        placeItems: 'center',    
        padding: 16,             
      }}
      onClick={onClose}
    >
    
      <div
        style={{
          width: 'fit-content',
          maxWidth: '95vw',
          background: '#1f1f1f',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
