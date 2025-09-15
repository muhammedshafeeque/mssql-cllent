import React, { useState } from 'react';
import { Connection, Database, Table, Column, TableData } from '../types';
import Sidebar from './Sidebar';
import TableViewer from './TableViewer';
import Loader from './Loader';

interface DatabaseScreenProps {
  currentConnection: Connection | null;
  selectedDatabase: string | null;
  selectedTable: string | null;
  databases: Database[];
  tables: Table[];
  tableColumns: Column[];
  tableData: TableData | null;
  activeTab: 'structure' | 'data';
  currentPage: number;
  pageSize: number;
  loading?: boolean;
  loadingDatabases?: boolean;
  loadingTables?: boolean;
  loadingTableData?: boolean;
  loadingTableStructure?: boolean;
  onDisconnect: () => void;
  onSelectDatabase: (dbName: string) => void;
  onSelectTable: (tableName: string) => void;
  onRefreshTables: () => void;
  onSwitchTab: (tab: 'structure' | 'data') => void;
  onRefreshTable: () => void;
  onChangePage: (page: number) => void;
  onChangePageSize: (size: number) => void;
  onCreateDatabase: () => void;
  onUpdateTableCell?: (columnName: string, value: any, rowIndex: number) => Promise<void>;
  onDeleteTableRow?: (rowIndex: number) => Promise<void>;
  onAddTableRow?: (data: Record<string, any>) => Promise<void>;
  onExportTableData?: (format: 'csv' | 'excel' | 'json') => Promise<void>;
  onDeleteAllTableData?: () => Promise<void>;
  onDeleteTable?: () => Promise<void>;
  onCreateTable?: (tableName: string, columns: any[]) => Promise<void>;
  onImportTableData?: (data: string, format: string) => Promise<void>;
  onCreateDatabaseDump?: (includeData: boolean) => Promise<void>;
  onRestoreDatabaseDump?: (dumpSQL: string) => Promise<void>;
  onApplyFilters?: (filters: Record<string, any>) => Promise<void>;
}

const DatabaseScreen: React.FC<DatabaseScreenProps> = ({
  currentConnection,
  selectedDatabase,
  selectedTable,
  databases,
  tables,
  tableColumns,
  tableData,
  activeTab,
  currentPage,
  pageSize,
  loading = false,
  loadingDatabases = false,
  loadingTables = false,
  loadingTableData = false,
  loadingTableStructure = false,
  onDisconnect,
  onSelectDatabase,
  onSelectTable,
  onRefreshTables,
  onSwitchTab,
  onRefreshTable,
  onChangePage,
  onChangePageSize,
  onCreateDatabase,
  onUpdateTableCell,
  onDeleteTableRow,
  onAddTableRow,
  onExportTableData,
  onDeleteAllTableData,
  onDeleteTable,
  onCreateTable,
  onImportTableData,
  onCreateDatabaseDump,
  onRestoreDatabaseDump,
  onApplyFilters
}) => {
  const [createDbLoading, setCreateDbLoading] = useState(false);
  const [dumpLoading, setDumpLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const handleCreateDatabase = async () => {
    setCreateDbLoading(true);
    try {
      await onCreateDatabase();
    } finally {
      setCreateDbLoading(false);
    }
  };

  const handleCreateDump = async () => {
    setDumpLoading(true);
    try {
      await onCreateDatabaseDump?.(true);
    } finally {
      setDumpLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnectLoading(true);
    try {
      await onDisconnect();
    } finally {
      setDisconnectLoading(false);
    }
  };

  return (
    <div id="database-screen" className="screen active">
      {/* Header */}
      <div className="database-header">
        <div className="connection-info">
          <span className="current-server">
            {currentConnection?.server} ({currentConnection?.username})
          </span>
          <span className="status connected">Connected</span>
        </div>
        <div className="database-selector">
          <label>Database:</label>
          <select 
            value={selectedDatabase || ''} 
            onChange={(e) => onSelectDatabase(e.target.value)}
            className="database-dropdown"
            disabled={loadingDatabases}
          >
            <option value="">
              {loadingDatabases ? 'Loading databases...' : 'Select Database'}
            </option>
            {databases && databases.map((db) => (
              <option key={db.name} value={db.name}>
                {db.name} ({new Date(db.create_date).toLocaleDateString()})
              </option>
            ))}
          </select>
          <button 
            onClick={handleCreateDatabase}
            className="btn btn-sm btn-primary"
            id="create-db-btn"
            disabled={createDbLoading || dumpLoading || disconnectLoading}
          >
            {createDbLoading ? <Loader size="small" type="spinner" /> : 'Create Database'}
          </button>
          {selectedDatabase && (
            <button 
              onClick={handleCreateDump}
              className="btn btn-sm btn-secondary"
              title="Create Database Dump"
              disabled={createDbLoading || dumpLoading || disconnectLoading}
            >
              {dumpLoading ? <Loader size="small" type="spinner" /> : '💾 Dump'}
            </button>
          )}
        </div>
        <button 
          onClick={handleDisconnect} 
          className="btn btn-danger"
          disabled={createDbLoading || dumpLoading || disconnectLoading}
        >
          {disconnectLoading ? <Loader size="small" type="spinner" /> : 'Disconnect'}
        </button>
      </div>

      <div className="database-content">
        {/* Sidebar */}
        <Sidebar
          selectedDatabase={selectedDatabase}
          tables={tables}
          selectedTable={selectedTable}
          loadingTables={loadingTables}
          onSelectTable={onSelectTable}
          onRefreshTables={onRefreshTables}
        />

        {/* Main Content */}
        <div className="main-content">
          <TableViewer
            selectedDatabase={selectedDatabase}
            selectedTable={selectedTable}
            tableColumns={tableColumns}
            tableData={tableData}
            activeTab={activeTab}
            currentPage={currentPage}
            pageSize={pageSize}
            loadingTableData={loadingTableData}
            loadingTableStructure={loadingTableStructure}
            onSwitchTab={onSwitchTab}
            onRefreshTable={onRefreshTable}
            onChangePage={onChangePage}
            onChangePageSize={onChangePageSize}
            onUpdateTableCell={onUpdateTableCell}
            onDeleteTableRow={onDeleteTableRow}
            onAddTableRow={onAddTableRow}
            onExportTableData={onExportTableData}
            onDeleteAllTableData={onDeleteAllTableData}
            onDeleteTable={onDeleteTable}
            onCreateTable={onCreateTable}
            onImportTableData={onImportTableData}
            onApplyFilters={onApplyFilters}
          />
        </div>
      </div>
    </div>
  );
};

export default DatabaseScreen;
