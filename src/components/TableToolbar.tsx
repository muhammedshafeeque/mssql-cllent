import React, { useState } from 'react';
import Loader from './Loader';

interface TableToolbarProps {
  selectedDatabase: string | null;
  selectedTable: string | null;
  onAddRow: () => void;
  onDeleteAllData: () => void;
  onExportData: (format: 'csv' | 'excel' | 'json') => void;
  onShowRelations: () => void;
  onCreateTable: () => void;
  onDeleteTable: () => void;
  onImportData: () => void;
  onShowFilters: () => void;
  loading?: boolean;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  selectedDatabase,
  selectedTable,
  onAddRow,
  onDeleteAllData,
  onExportData,
  onShowRelations,
  onCreateTable,
  onDeleteTable,
  onImportData,
  onShowFilters,
  loading = false
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteTableLoading, setDeleteTableLoading] = useState(false);
  const [relationsLoading, setRelationsLoading] = useState(false);

  const handleExportData = async (format: 'csv' | 'excel' | 'json') => {
    setExportLoading(format);
    try {
      await onExportData(format);
    } finally {
      setExportLoading(null);
    }
  };

  const handleDeleteAllData = async () => {
    setDeleteAllLoading(true);
    try {
      await onDeleteAllData();
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    setDeleteTableLoading(true);
    try {
      await onDeleteTable();
    } finally {
      setDeleteTableLoading(false);
    }
  };

  const handleShowRelations = async () => {
    setRelationsLoading(true);
    try {
      await onShowRelations();
    } finally {
      setRelationsLoading(false);
    }
  };

  if (!selectedTable) {
    return (
      <div className="table-toolbar">
        <div className="toolbar-section">
          <button 
            onClick={onCreateTable}
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            {loading ? <Loader size="small" type="spinner" /> : '📋'} Create Table
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-toolbar">
      <div className="toolbar-section">
        <button 
          onClick={onAddRow}
          className="btn btn-success btn-sm"
          disabled={loading}
        >
          {loading ? <Loader size="small" type="spinner" /> : '➕'} Add Row
        </button>
        
        <button 
          onClick={onImportData}
          className="btn btn-primary btn-sm"
          disabled={loading}
        >
          {loading ? <Loader size="small" type="spinner" /> : '📥'} Import Data
        </button>
        
        <button 
          onClick={handleShowRelations}
          className="btn btn-info btn-sm"
          disabled={loading || relationsLoading}
        >
          {relationsLoading ? <Loader size="small" type="spinner" /> : '🔗'} Relations
        </button>
        
        <button 
          onClick={onShowFilters}
          className="btn btn-warning btn-sm"
          disabled={loading}
        >
          {loading ? <Loader size="small" type="spinner" /> : '🔍'} Filter
        </button>
      </div>

      <div className="toolbar-section">
        <div className="dropdown">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-secondary btn-sm dropdown-toggle"
            disabled={loading}
          >
            {loading ? <Loader size="small" type="spinner" /> : '📤'} Export
          </button>
          {showExportMenu && (
            <div className="dropdown-menu">
              <button 
                onClick={() => { handleExportData('csv'); setShowExportMenu(false); }} 
                className="dropdown-item"
                disabled={exportLoading === 'csv'}
              >
                {exportLoading === 'csv' ? <Loader size="small" type="spinner" /> : '📄'} Export as CSV
              </button>
              <button 
                onClick={() => { handleExportData('excel'); setShowExportMenu(false); }} 
                className="dropdown-item"
                disabled={exportLoading === 'excel'}
              >
                {exportLoading === 'excel' ? <Loader size="small" type="spinner" /> : '📊'} Export as Excel
              </button>
              <button 
                onClick={() => { handleExportData('json'); setShowExportMenu(false); }} 
                className="dropdown-item"
                disabled={exportLoading === 'json'}
              >
                {exportLoading === 'json' ? <Loader size="small" type="spinner" /> : '📋'} Export as JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-section">
        <button 
          onClick={handleDeleteAllData}
          className="btn btn-warning btn-sm"
          disabled={loading || deleteAllLoading}
        >
          {deleteAllLoading ? <Loader size="small" type="spinner" /> : '🗑️'} Clear Data
        </button>
        
        <button 
          onClick={handleDeleteTable}
          className="btn btn-danger btn-sm"
          disabled={loading || deleteTableLoading}
        >
          {deleteTableLoading ? <Loader size="small" type="spinner" /> : '❌'} Delete Table
        </button>
      </div>
    </div>
  );
};

export default TableToolbar;
