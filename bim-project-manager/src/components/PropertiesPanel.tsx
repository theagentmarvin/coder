import React, { useState } from 'react';

interface PropertiesPanelProps {
  data: any[] | null;
  loading: boolean;
  onClose: () => void;
  onAddProperty?: (name: string, value: string | number | boolean, type: 'IfcLabel' | 'IfcReal' | 'IfcBoolean') => Promise<boolean>;
  onExportIfc?: () => Promise<void>;
}

type PropertyType = 'IfcLabel' | 'IfcReal' | 'IfcBoolean';

interface PropertyFormData {
  name: string;
  value: string;
  type: PropertyType;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  data, 
  loading, 
  onClose,
  onAddProperty,
  onExportIfc 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({ 
    name: '', 
    value: '',
    type: 'IfcLabel' 
  });
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [addPropertyError, setAddPropertyError] = useState<string | null>(null);

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

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.value.trim()) return;
    
    setIsAddingProperty(true);
    setAddPropertyError(null);

    try {
      // Convert value based on type
      let convertedValue: string | number | boolean;
      if (formData.type === 'IfcReal') {
        convertedValue = parseFloat(formData.value) || 0;
      } else if (formData.type === 'IfcBoolean') {
        convertedValue = formData.value.toLowerCase() === 'true' || formData.value === '1';
      } else {
        convertedValue = formData.value;
      }

      if (onAddProperty) {
        const success = await onAddProperty(formData.name, convertedValue, formData.type);
        if (success) {
          setFormData({ name: '', value: '', type: 'IfcLabel' });
          setShowAddForm(false);
        }
      } else {
        // Fallback to local-only if no callback provided
        console.warn('onAddProperty not provided');
      }
    } catch (err) {
      console.error('Error adding property:', err);
      setAddPropertyError(err instanceof Error ? err.message : 'Failed to add property');
    } finally {
      setIsAddingProperty(false);
    }
  };

  const handleExportIfc = async () => {
    if (onExportIfc) {
      try {
        await onExportIfc();
      } catch (err) {
        console.error('Error exporting IFC:', err);
      }
    }
  };

  const handleExportJson = () => {
    const exportData = item;
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `element_properties_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant flex items-center justify-between">
        <h3 className="font-headline text-lg text-on-surface">Element Properties</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 hover:bg-surface-variant rounded transition-colors"
            title="Add property to IFC"
            aria-label="Add property"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
          <button
            onClick={handleExportIfc}
            className="p-1.5 hover:bg-surface-variant rounded transition-colors"
            title="Export modified IFC"
            aria-label="Export IFC"
          >
            <span className="material-symbols-outlined text-sm">file_download</span>
          </button>
          <button
            onClick={handleExportJson}
            className="p-1.5 hover:bg-surface-variant rounded transition-colors"
            title="Export JSON"
            aria-label="Export JSON"
          >
            <span className="material-symbols-outlined text-sm">download</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-variant rounded transition-colors"
            aria-label="Close panel"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>

      {/* Add Property Form */}
      {showAddForm && (
        <form onSubmit={handleAddProperty} className="p-4 bg-surface-container-high border-b border-outline-variant">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Property name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field flex-1 text-sm py-2"
                required
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PropertyType }))}
                className="input-field text-sm py-2 sm:w-32"
              >
                <option value="IfcLabel">IfcLabel</option>
                <option value="IfcReal">IfcReal</option>
                <option value="IfcBoolean">IfcBoolean</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type={formData.type === 'IfcReal' ? 'number' : 'text'}
                placeholder={formData.type === 'IfcBoolean' ? 'true/false' : 'Value'}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="input-field flex-1 text-sm py-2"
                required
              />
              <button
                type="submit"
                disabled={isAddingProperty}
                className="btn-primary px-4 py-2 text-sm whitespace-nowrap disabled:opacity-50"
              >
                {isAddingProperty ? 'Adding...' : 'Add Property'}
              </button>
            </div>
            {addPropertyError && (
              <p className="text-xs text-error">{addPropertyError}</p>
            )}
          </div>
        </form>
      )}

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

      {/* Mobile: Show viewer and panel stacked vertically */}
      <div className="block md:hidden mt-4 pt-4 border-t border-outline-variant">
        <p className="text-xs text-on-surface-variant text-center">
          Tap elements to view properties • Use pinch to zoom
        </p>
      </div>
    </div>
  );
};

export default PropertiesPanel;
