import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Loader from './Loader';
import ConfirmationModal from './ConfirmationModal';

interface Column {
  column_name: string;
  data_type: string;
  character_maximum_length?: number;
  is_nullable: string;
  column_default?: string;
  is_primary_key: string;
}

interface EditStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  tableName: string;
  onSave: (columns: Column[]) => Promise<void>;
  loading?: boolean;
}

const EditStructureModal: React.FC<EditStructureModalProps> = ({
  isOpen,
  onClose,
  columns,
  tableName,
  onSave,
  loading = false
}) => {
  const [editedColumns, setEditedColumns] = useState<Column[]>([]);
  const [newColumn, setNewColumn] = useState<Partial<Column>>({
    column_name: '',
    data_type: 'varchar',
    character_maximum_length: 255,
    is_nullable: 'YES',
    column_default: '',
    is_primary_key: 'NO'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditedColumns([...columns]);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, columns]);

  const dataTypes = [
    'int', 'bigint', 'smallint', 'tinyint',
    'varchar', 'nvarchar', 'char', 'nchar',
    'text', 'ntext',
    'decimal', 'numeric', 'float', 'real',
    'bit', 'datetime', 'date', 'time',
    'uniqueidentifier', 'varbinary', 'image'
  ];

  const handleColumnChange = (index: number, field: keyof Column, value: any) => {
    const updated = [...editedColumns];
    updated[index] = { ...updated[index], [field]: value };
    setEditedColumns(updated);
    setHasUnsavedChanges(true);
  };

  const handleInputBlur = () => {
    // Show save confirmation modal on blur if there are unsaved changes
    if (hasUnsavedChanges) {
      setShowSaveConfirm(true);
    }
  };

  const handleAddColumn = () => {
    if (newColumn.column_name) {
      setEditedColumns([...editedColumns, newColumn as Column]);
      setHasUnsavedChanges(true);
      setNewColumn({
        column_name: '',
        data_type: 'varchar',
        character_maximum_length: 255,
        is_nullable: 'YES',
        column_default: '',
        is_primary_key: 'NO'
      });
    }
  };

  const handleRemoveColumn = (index: number) => {
    const column = editedColumns[index];
    if (!column) return;
    
    setColumnToDelete(index);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteColumn = () => {
    if (columnToDelete !== null) {
      const updated = editedColumns.filter((_, i) => i !== columnToDelete);
      setEditedColumns(updated);
      setHasUnsavedChanges(true);
    }
    setShowDeleteConfirm(false);
    setColumnToDelete(null);
  };

  const handleSave = async () => {
    // Check if there are any changes
    const hasChanges = JSON.stringify(editedColumns) !== JSON.stringify(columns);
    
    if (!hasChanges) {
      setHasUnsavedChanges(false);
      onClose();
      return;
    }

    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    try {
      await onSave(editedColumns);
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving structure:', error);
      alert('Failed to save structure changes. Please check the console for details.');
    } finally {
      setShowSaveConfirm(false);
    }
  };

  const handleModalClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setHasUnsavedChanges(false);
    setShowCloseConfirm(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title={`Edit Structure - ${tableName}`}>
      <div className="edit-structure-container">
        <div className="structure-actions">
          <button
            onClick={handleAddColumn}
            className="btn btn-sm btn-primary"
            disabled={!newColumn.column_name}
          >
            + Add Column
          </button>
        </div>

        <div className="structure-table-container">
          <table className="structure-edit-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Data Type</th>
                <th>Length</th>
                <th>Nullable</th>
                <th>Default</th>
                <th>Primary Key</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {editedColumns.map((column, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={column.column_name}
                      onChange={(e) => handleColumnChange(index, 'column_name', e.target.value)}
                      onBlur={handleInputBlur}
                      className="form-input"
                      disabled={column.is_primary_key === 'YES'}
                    />
                  </td>
                  <td>
                    <select
                      value={column.data_type}
                      onChange={(e) => handleColumnChange(index, 'data_type', e.target.value)}
                      className="form-select"
                    >
                      {dataTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={column.character_maximum_length || ''}
                      onChange={(e) => handleColumnChange(index, 'character_maximum_length', e.target.value ? parseInt(e.target.value) : null)}
                      onBlur={handleInputBlur}
                      className="form-input"
                      placeholder="Length"
                      min="1"
                    />
                  </td>
                  <td>
                    <select
                      value={column.is_nullable}
                      onChange={(e) => handleColumnChange(index, 'is_nullable', e.target.value)}
                      className="form-select"
                    >
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={column.column_default || ''}
                      onChange={(e) => handleColumnChange(index, 'column_default', e.target.value)}
                      onBlur={handleInputBlur}
                      className="form-input"
                      placeholder="Default value"
                    />
                  </td>
                  <td>
                    <select
                      value={column.is_primary_key}
                      onChange={(e) => handleColumnChange(index, 'is_primary_key', e.target.value)}
                      className="form-select"
                    >
                      <option value="NO">NO</option>
                      <option value="YES">YES</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => handleRemoveColumn(index)}
                      className="btn btn-sm btn-danger"
                      disabled={column.is_primary_key === 'YES'}
                      title="Remove column"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Column Row */}
        <div className="add-column-section">
          <h4>Add New Column</h4>
          <div className="add-column-form">
            <input
              type="text"
              placeholder="Column name"
              value={newColumn.column_name || ''}
              onChange={(e) => setNewColumn({ ...newColumn, column_name: e.target.value })}
              onBlur={handleInputBlur}
              className="form-input"
            />
            <select
              value={newColumn.data_type || 'varchar'}
              onChange={(e) => setNewColumn({ ...newColumn, data_type: e.target.value })}
              className="form-select"
            >
              {dataTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Length"
              value={newColumn.character_maximum_length || ''}
              onChange={(e) => setNewColumn({ ...newColumn, character_maximum_length: e.target.value ? parseInt(e.target.value) : null })}
              onBlur={handleInputBlur}
              className="form-input"
              min="1"
            />
            <select
              value={newColumn.is_nullable || 'YES'}
              onChange={(e) => setNewColumn({ ...newColumn, is_nullable: e.target.value })}
              className="form-select"
            >
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
            <input
              type="text"
              placeholder="Default value"
              value={newColumn.column_default || ''}
              onChange={(e) => setNewColumn({ ...newColumn, column_default: e.target.value })}
              onBlur={handleInputBlur}
              className="form-input"
            />
            <select
              value={newColumn.is_primary_key || 'NO'}
              onChange={(e) => setNewColumn({ ...newColumn, is_primary_key: e.target.value })}
              className="form-select"
            >
              <option value="NO">NO</option>
              <option value="YES">YES</option>
            </select>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button onClick={handleModalClose} className="btn btn-secondary">
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <Loader size="small" type="spinner" /> : 'Save Structure'}
        </button>
      </div>

      {/* Delete Column Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setColumnToDelete(null);
        }}
        onConfirm={confirmDeleteColumn}
        title="Delete Column"
        message={`Are you sure you want to remove the column "${editedColumns[columnToDelete || 0]?.column_name}"?\n\nThis action will:\n• Delete the column and all its data\n• Cannot be undone\n• May affect related tables`}
        confirmText="Delete Column"
        cancelText="Cancel"
        type="danger"
        requireTextInput="DELETE"
      />

      {/* Save Structure Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={confirmSave}
        title="Save Structure Changes"
        message={`You have unsaved changes to the table structure for "${tableName}".\n\nThis will modify the table structure and may:\n• Affect existing data\n• Break dependent queries\n• Require application restarts\n\nDo you want to save these changes?`}
        confirmText="Save Changes"
        cancelText="Discard Changes"
        type="warning"
        requireTextInput="SAVE"
        loading={loading}
      />

      {/* Close with Unsaved Changes Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmClose}
        title="Unsaved Changes"
        message={`You have unsaved changes to the table structure.\n\nIf you close now, all changes will be lost.\n\nDo you want to save your changes before closing?`}
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
        requireTextInput="DISCARD"
      />
    </Modal>
  );
};

export default EditStructureModal;
