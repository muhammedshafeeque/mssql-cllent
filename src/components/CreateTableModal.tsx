import React, { useState } from 'react';
import Loader from './Loader';

interface Column {
  name: string;
  type: string;
  length?: string;
  nullable: boolean;
  default?: string;
}

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (tableName: string, columns: Column[]) => Promise<void>;
  loading?: boolean;
}

const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  loading = false
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    { name: 'id', type: 'int', nullable: false, default: '' }
  ]);
  const [creating, setCreating] = useState(false);

  const dataTypes = [
    'int', 'bigint', 'smallint', 'tinyint',
    'varchar', 'nvarchar', 'char', 'nchar',
    'text', 'ntext',
    'datetime', 'date', 'time',
    'decimal', 'float', 'real',
    'bit', 'uniqueidentifier'
  ];

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'varchar', length: '255', nullable: true, default: '' }]);
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      setColumns(columns.filter((_, i) => i !== index));
    }
  };

  const updateColumn = (index: number, field: keyof Column, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const handleCreate = async () => {
    if (!tableName.trim()) {
      alert('Please enter a table name');
      return;
    }

    const validColumns = columns.filter(col => col.name.trim());
    if (validColumns.length === 0) {
      alert('Please add at least one column');
      return;
    }

    setCreating(true);
    try {
      await onCreate(tableName.trim(), validColumns);
      setTableName('');
      setColumns([{ name: 'id', type: 'int', nullable: false, default: '' }]);
      onClose();
    } catch (error) {
      console.error('Error creating table:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setTableName('');
    setColumns([{ name: 'id', type: 'int', nullable: false, default: '' }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h3>Create New Table</h3>
          <button onClick={handleCancel} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="tableName">Table Name</label>
            <input
              type="text"
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="form-input"
              disabled={creating}
            />
          </div>

          <div className="columns-section">
            <div className="section-header">
              <h4>Columns</h4>
              <button 
                onClick={addColumn}
                className="btn btn-sm btn-secondary"
                disabled={creating}
              >
                + Add Column
              </button>
            </div>

            <div className="columns-list">
              {columns.map((column, index) => (
                <div key={index} className="column-row">
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) => updateColumn(index, 'name', e.target.value)}
                    placeholder="Column name"
                    className="form-input"
                    disabled={creating}
                  />
                  
                  <select
                    value={column.type}
                    onChange={(e) => updateColumn(index, 'type', e.target.value)}
                    className="form-select"
                    disabled={creating}
                  >
                    {dataTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  
                  {(column.type.includes('varchar') || column.type.includes('char')) && (
                    <input
                      type="text"
                      value={column.length || ''}
                      onChange={(e) => updateColumn(index, 'length', e.target.value)}
                      placeholder="Length"
                      className="form-input"
                      disabled={creating}
                    />
                  )}
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={column.nullable}
                      onChange={(e) => updateColumn(index, 'nullable', e.target.checked)}
                      disabled={creating}
                    />
                    Nullable
                  </label>
                  
                  <input
                    type="text"
                    value={column.default || ''}
                    onChange={(e) => updateColumn(index, 'default', e.target.value)}
                    placeholder="Default value"
                    className="form-input"
                    disabled={creating}
                  />
                  
                  {columns.length > 1 && (
                    <button
                      onClick={() => removeColumn(index)}
                      className="btn btn-sm btn-danger"
                      disabled={creating}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={handleCancel} 
            className="btn btn-secondary"
            disabled={creating}
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate} 
            className="btn btn-primary"
            disabled={creating}
          >
            {creating ? <Loader size="small" type="spinner" /> : 'Create Table'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTableModal;
