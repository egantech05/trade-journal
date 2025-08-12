import React from 'react';

export default function EditSubentryEntryModal({
  visible,
  subentry, 
  onClose,
  onSaved,
}) {
  if (!visible || !subentry) return null;

  const formatForInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [et, setEt] = React.useState(formatForInput(subentry.entry_time));
  const [price, setPrice] = React.useState(String(subentry.entry_price ?? ''));
  const [size, setSize] = React.useState(String(subentry.entry_size ?? ''));
  const [pos, setPos] = React.useState(subentry.position || 'Buy');
  const [rmk, setRmk] = React.useState(subentry.remarks || '');
  const [file, setFile] = React.useState(null);

  const save = async () => {
    try {
      const fd = new FormData();
      fd.append('entry_time', et);
      fd.append('entry_price', price);
      fd.append('entry_size', size);
      fd.append('position', pos);
      fd.append('remarks', rmk);
      if (file) fd.append('entry_snapshot', file);

      const res = await fetch(
        `/trades/subentries/${subentry.id}/entry`,
        {
          method: 'PUT',
          body: fd,
        }
      );
      if (!res.ok) throw new Error('Failed to update');
      onSaved?.();
      onClose();
    } catch (e) {
      alert('Failed to update entry');
      console.error(e);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#222',
          padding: 16,
          borderRadius: 10,
          width: 420,
        }}
      >
        <p style={{ color: '#fff', fontWeight: 700, marginBottom: 10 }}>
          Edit Entry
        </p>

        <label style={{ color: '#ddd', fontSize: 12 }}>Time</label>
        <input
          type="datetime-local"
          value={et}
          onChange={(e) => setEt(e.target.value)}
          style={{
            width: '100%',
            background: '#333',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
          }}
        />

        <label style={{ color: '#ddd', fontSize: 12 }}>Price</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{
            width: '100%',
            background: '#333',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
          }}
        />

        <label style={{ color: '#ddd', fontSize: 12 }}>Size</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          style={{
            width: '100%',
            background: '#333',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
          }}
        />

        <label style={{ color: '#ddd', fontSize: 12 }}>Position</label>
        <select
          value={pos}
          onChange={(e) => setPos(e.target.value)}
          style={{
            width: '100%',
            background: '#333',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
          }}
        >
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>

        <label style={{ color: '#ddd', fontSize: 12 }}>Remarks</label>
        <textarea
          rows={3}
          value={rmk}
          onChange={(e) => setRmk(e.target.value)}
          style={{
            width: '100%',
            background: '#333',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
          }}
        />

        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ color: '#fff', marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              background: '#1ec772',
              color: '#111',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontWeight: 700,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
