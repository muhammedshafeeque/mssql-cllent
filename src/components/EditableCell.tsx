import React, { useState } from 'react';

interface EditableCellProps {
  value: any;
  columnName: string;
  rowIndex: number;
  onSave: (columnName: string, newValue: any, rowIndex: number) => Promise<void>;
  isEditable?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  columnName,
  rowIndex,
  onSave,
  isEditable = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(columnName, editValue, rowIndex);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving cell:', error);
      setEditValue(value); // Reset to original value on error
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditable) {
    return (
      <td title={String(value || '')}>
        {value === null || value === undefined ? (
          <span className="null-value">NULL</span>
        ) : (
          String(value).length > 50 
            ? `${String(value).substring(0, 50)}...`
            : String(value)
        )}
      </td>
    );
  }

  if (isEditing) {
    return (
      <td>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="cell-input"
          disabled={saving}
        />
        {saving && <span className="saving-indicator">💾</span>}
      </td>
    );
  }

  return (
    <td 
      title={String(value || '')}
      onClick={() => setIsEditing(true)}
      className="editable-cell"
    >
      {value === null || value === undefined ? (
        <span className="null-value">NULL</span>
      ) : (
        String(value).length > 50 
          ? `${String(value).substring(0, 50)}...`
          : String(value)
      )}
    </td>
  );
};

export default EditableCell;
