import React, { useState, useRef } from 'react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: string, format: string) => Promise<void>;
  tableName: string;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onImport,
  tableName
}) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [data, setData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setData(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!data.trim()) {
      setError('Please provide data to import');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onImport(data, format);
      onClose();
      setData('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setData('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h2>Import Data to {tableName}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Import Format:</label>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
              className="form-select"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="form-group">
            <label>Select File:</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept={format === 'csv' ? '.csv' : '.json'}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Or Paste Data:</label>
            <textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder={
                format === 'csv' 
                  ? 'id,name,email\n1,John,john@example.com\n2,Jane,jane@example.com'
                  : '[\n  {"id": 1, "name": "John", "email": "john@example.com"},\n  {"id": 2, "name": "Jane", "email": "jane@example.com"}\n]'
              }
              className="form-input"
              rows={10}
            />
          </div>

          <div className="form-help">
            <strong>CSV Format:</strong> First row should contain column names, subsequent rows contain data.<br/>
            <strong>JSON Format:</strong> Array of objects where each object represents a row.
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleImport}
            disabled={isLoading || !data.trim()}
          >
            {isLoading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;
