import React, { useState } from 'react';
import { Column } from '../types';
import Loader from './Loader';

interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
  columns: Column[];
  loading?: boolean;
}

const AddRowModal: React.FC<AddRowModalProps> = ({
  isOpen,
  onClose,
  onSave,
  columns,
  loading = false
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const handleInputChange = (columnName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setFormData({});
      onClose();
    } catch (error) {
      console.error('Error saving row:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add New Row</h3>
          <button onClick={handleCancel} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="form-grid">
            {columns.map((column) => (
              <div key={column.column_name} className="form-group">
                <label htmlFor={column.column_name}>
                  {column.column_name}
                  {column.is_nullable === 'NO' && <span className="required">*</span>}
                </label>
                <input
                  type="text"
                  id={column.column_name}
                  value={formData[column.column_name] || ''}
                  onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                  placeholder={column.column_default || `Enter ${column.data_type}`}
                  className="form-input"
                  disabled={saving}
                />
                <small className="form-help">
                  Type: {column.data_type}
                  {column.character_maximum_length && ` (${column.character_maximum_length})`}
                </small>
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={handleCancel} 
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? <Loader size="small" type="spinner" /> : 'Save Row'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRowModal;
