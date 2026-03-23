import React from 'react';

interface PropertiesPanelProps {
  data: any[] | null;
  loading: boolean;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ data, loading, onClose }) => {
  if (loading) {
    return (
      <div className="card mt-4 p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">Loading properties…</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card mt-4 p-6 text-center">
        <span className="material-symbols-outlined text-2xl text-on-surface-variant mb-2 block">
          search
        </span>
        <p className="text-on-surface-variant">Click on any element to see its properties</p>
      </div>
    );
  }

  const item = data[0];
  const entries = Object.entries(item).filter(
    ([key]) => !key.startsWith('_')
  );

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant flex items-center justify-between">
        <h3 className="font-headline text-lg text-on-surface">Element Properties</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-variant rounded"
          aria-label="Close panel"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <span className="font-label text-sm text-on-surface-variant capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
            <div className="col-span-2">
              <pre className="text-sm font-mono text-on-surface bg-surface-variant p-2 rounded whitespace-pre-wrap break-words">
                {typeof value === 'object'
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertiesPanel;
