import React, { useState, useEffect, useRef } from 'react';
import ConfirmationModal from './ConfirmationModal';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Handle click outside to trigger save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && inputRef.current && !inputRef.current.contains(event.target as Node)) {
        console.log('Clicked outside input, triggering save');
        const originalValue = String(value || '');
        const newValue = String(editValue || '');
        
        if (originalValue !== newValue) {
          setShowConfirmModal(true);
        } else {
          setIsEditing(false);
        }
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, value, editValue]);

  const handleSave = async () => {
    console.log('handleSave called');
    if (editValue === value) {
      console.log('No changes detected, exiting edit mode');
      setIsEditing(false);
      return;
    }

    // Show confirmation for significant changes
    const originalValue = String(value || '');
    const newValue = String(editValue || '');
    
    console.log('Original value:', originalValue, 'New value:', newValue);
    
    if (originalValue !== newValue && (originalValue.length > 0 || newValue.length > 0)) {
      console.log('Showing confirmation modal');
      setShowConfirmModal(true);
      return;
    }

    console.log('Performing save without confirmation');
    await performSave();
  };

  const handleBlur = (e: React.FocusEvent) => {
    console.log('handleBlur called', e);
    
    // Small delay to ensure the blur event is processed
    setTimeout(() => {
      // Check if value has changed (handle different data types)
      const originalValue = String(value || '');
      const newValue = String(editValue || '');
      
      console.log('Original:', originalValue, 'New:', newValue);
      
      if (originalValue !== newValue) {
        // Show save confirmation modal on blur
        console.log('Value changed, showing confirmation modal');
        setShowConfirmModal(true);
      } else {
        // No changes, just exit edit mode
        console.log('No changes, exiting edit mode');
        setIsEditing(false);
      }
    }, 100);
  };

  const performSave = async () => {
    setSaving(true);
    try {
      await onSave(columnName, editValue, rowIndex);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving cell:', error);
      setEditValue(value); // Reset to original value on error
      alert('Failed to update cell. Please check the console for details.');
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
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
          className="cell-input"
          disabled={saving}
        />
        {saving && <span className="saving-indicator">💾</span>}
        {showConfirmModal && <span style={{color: 'red', fontSize: '12px'}}>MODAL SHOULD BE SHOWN</span>}
        <button 
          onClick={() => {
            console.log('Test button clicked, showing modal');
            setShowConfirmModal(true);
          }}
          style={{fontSize: '10px', padding: '2px'}}
        >
          Test Modal
        </button>
      </td>
    );
  }

  return (
    <>
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

      {/* Save Cell Changes Confirmation Modal */}
      {console.log('Rendering EditableCell, showConfirmModal:', showConfirmModal)}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          console.log('Confirmation modal closed');
          setShowConfirmModal(false);
          setEditValue(value); // Reset to original value
          setIsEditing(false);
        }}
        onConfirm={async () => {
          console.log('Confirmation modal confirmed');
          setShowConfirmModal(false);
          await performSave();
        }}
        title="Save Cell Changes"
        message={`You have unsaved changes to "${columnName}".\n\nOriginal: ${String(value || '')}\nNew: ${String(editValue || '')}\n\nDo you want to save these changes?`}
        confirmText="Save Changes"
        cancelText="Discard Changes"
        type="warning"
        requireTextInput="SAVE"
      />
    </>
  );
};

export default EditableCell;
