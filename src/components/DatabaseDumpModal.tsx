import React, { useState } from 'react';

interface DatabaseDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDump: (includeData: boolean) => Promise<void>;
  onRestoreDump: (dumpSQL: string) => Promise<void>;
  dbName: string;
}

const DatabaseDumpModal: React.FC<DatabaseDumpModalProps> = ({
  isOpen,
  onClose,
  onCreateDump,
  onRestoreDump,
  dbName
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'restore'>('create');
  const [includeData, setIncludeData] = useState(true);
  const [dumpSQL, setDumpSQL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateDump = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onCreateDump(includeData);
      setSuccess('Database dump created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dump');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreDump = async () => {
    if (!dumpSQL.trim()) {
      setError('Please provide SQL dump content');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onRestoreDump(dumpSQL);
      setSuccess('Database dump restored successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore dump');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDumpSQL('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h2>Database Dump - {dbName}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create Dump
            </button>
            <button 
              className={`tab-button ${activeTab === 'restore' ? 'active' : ''}`}
              onClick={() => setActiveTab('restore')}
            >
              Restore Dump
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="tab-content">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeData}
                    onChange={(e) => setIncludeData(e.target.checked)}
                  />
                  Include table data in dump
                </label>
                <div className="form-help">
                  Uncheck to create structure-only dump (tables without data)
                </div>
              </div>

              <div className="form-help">
                <strong>Create Dump:</strong> Generates a SQL script containing the database structure and optionally the data.
                The dump will be automatically downloaded as a .sql file.
              </div>
            </div>
          )}

          {activeTab === 'restore' && (
            <div className="tab-content">
              <div className="form-group">
                <label>SQL Dump Content:</label>
                <textarea
                  value={dumpSQL}
                  onChange={(e) => setDumpSQL(e.target.value)}
                  placeholder="Paste your SQL dump content here..."
                  className="form-input"
                  rows={15}
                />
              </div>

              <div className="form-help">
                <strong>Restore Dump:</strong> Execute SQL statements from a database dump.
                Make sure the SQL is compatible with your database structure.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Close
          </button>
          {activeTab === 'create' && (
            <button 
              className="btn btn-primary" 
              onClick={handleCreateDump}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Dump'}
            </button>
          )}
          {activeTab === 'restore' && (
            <button 
              className="btn btn-primary" 
              onClick={handleRestoreDump}
              disabled={isLoading || !dumpSQL.trim()}
            >
              {isLoading ? 'Restoring...' : 'Restore Dump'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseDumpModal;
