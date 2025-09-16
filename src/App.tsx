import React, { useState, useEffect } from 'react';
import './index.css';
import { Connection, Database, Table, Column, TableData } from './types';
import LoginScreen from './components/LoginScreen';
import DatabaseScreen from './components/DatabaseScreen';
import Modal from './components/Modal';
import CreateDatabaseModal from './components/CreateDatabaseModal';
import Loader from './components/Loader';
import PasswordDialog from './components/PasswordDialog';

const App: React.FC = () => {
  // State
  const [currentScreen, setCurrentScreen] = useState<'login' | 'database'>('login');
  const [currentConnection, setCurrentConnection] = useState<Connection | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableColumns, setTableColumns] = useState<Column[]>([]);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [savedConnections, setSavedConnections] = useState<Connection[]>([]);
  const [activeTab, setActiveTab] = useState<'structure' | 'data'>('structure');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingTableData, setLoadingTableData] = useState(false);
  const [loadingTableStructure, setLoadingTableStructure] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDbModal, setShowCreateDbModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordDialogData, setPasswordDialogData] = useState<{
    title: string;
    message: string;
    onSubmit: (password: string) => void;
  } | null>(null);
  const [filterTimeout, setFilterTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load saved connections and check for active session on mount
  useEffect(() => {
    const initializeApp = async () => {
      // First load saved connections
      await loadSavedConnections();
      
      // Then check for active session
      try {
        const sessionResult = await window.electronAPI.loadSession();
        if (sessionResult.success && sessionResult.session) {
          const session = sessionResult.session;
          console.log('Found active session:', session);
          
          // Show a prompt to restore the session
          const shouldRestore = confirm(
            `Found active session for ${session.connectionName} (${session.server}).\n\n` +
            `Connected at: ${new Date(session.connectedAt).toLocaleString()}\n\n` +
            `Do you want to restore this session?`
          );
          
          if (shouldRestore) {
            // Show password dialog
            const password = await showPasswordDialogModal(
              'Restore Session',
              `Enter password for ${session.username}@${session.server}:`
            );
            
            if (password) {
              // Restore the session
              const restoreResult = await window.electronAPI.restoreSession(session);
              if (restoreResult.success) {
                // Update the connection config with the password
                const config = {
                  server: session.server,
                  username: session.username,
                  password: password,
                  connectionName: session.connectionName
                };
                
                // Connect to database
                const connectResult = await window.electronAPI.connectDatabase(config);
                if (connectResult.success) {
                  setCurrentConnection({
                    id: session.connectionName,
                    name: session.connectionName,
                    server: session.server,
                    username: session.username,
                    password: password
                  });
                  setCurrentScreen('database');
                  await loadDatabases();
                } else {
                  showError(connectResult.message);
                }
              } else {
                showError(restoreResult.message);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking for active session:', error);
      }
    };
    
    // Add a small delay to ensure electronAPI is available
    const timer = setTimeout(initializeApp, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (filterTimeout) {
        clearTimeout(filterTimeout);
      }
    };
  }, [filterTimeout]);

  // Utility functions
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setError(null); // Clear any existing errors
    // You could add a success state here if needed
    console.log('Success:', message);
  };

  const showPasswordDialogModal = (title: string, message: string): Promise<string> => {
    return new Promise((resolve) => {
      setPasswordDialogData({
        title,
        message,
        onSubmit: (password: string) => {
          resolve(password);
        }
      });
      setShowPasswordDialog(true);
    });
  };

  const hideError = () => setError(null);

  // Connection functions
  const connectToDatabase = async (credentials: { server: string; username: string; password: string; connectionName: string }, saveCredentials = false) => {
    if (!window.electronAPI) {
      showError('Electron API not available');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.connectDatabase(credentials);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      if (saveCredentials && credentials.connectionName) {
        await window.electronAPI.saveCredentials({
          id: Date.now().toString(),
          name: credentials.connectionName,
          server: credentials.server,
          username: credentials.username,
          password: credentials.password
        });
      }

      setCurrentConnection({ 
        id: '', 
        name: credentials.connectionName, 
        server: credentials.server,
        username: credentials.username,
        password: credentials.password
      });
      await loadDatabases();
      setCurrentScreen('database');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const result = await window.electronAPI.getDatabases();
      if (result.success) {
        setDatabases(result.databases);
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoadingDatabases(false);
    }
  };

  const loadSavedConnections = async () => {
    try {
      if (!window.electronAPI) {
        return;
      }
      
      const result = await window.electronAPI.loadCredentials();
      
      if (result.success) {
        setSavedConnections(result.credentials || []);
      }
    } catch (error: any) {
      console.error('Failed to load saved connections:', error);
    }
  };

  const useSavedConnection = async (connection: Connection) => {
    try {
      const result = await window.electronAPI.connectDatabase({
        server: connection.server,
        username: connection.username,
        password: connection.password
      });
      
      if (!result.success) {
        throw new Error(result.message);
      }

      setCurrentConnection(connection);
      await loadDatabases();
      setCurrentScreen('database');
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteSavedConnection = async (id: string) => {
    setConnectionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteConnection = async () => {
    if (!connectionToDelete) return;
    
    try {
      const result = await window.electronAPI.deleteCredentials(connectionToDelete);
      if (result.success) {
        await loadSavedConnections();
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setShowDeleteModal(false);
      setConnectionToDelete(null);
    }
  };

  const cancelDeleteConnection = () => {
    setShowDeleteModal(false);
    setConnectionToDelete(null);
  };

  const disconnect = async () => {
    try {
      await window.electronAPI.disconnect();
      setCurrentConnection(null);
      setSelectedDatabase(null);
      setSelectedTable(null);
      setDatabases([]);
      setTables([]);
      setTableColumns([]);
      setTableData(null);
      setCurrentScreen('login');
      await loadSavedConnections();
    } catch (error: any) {
      showError(error.message);
    }
  };

  // Database functions
  const selectDatabase = async (dbName: string) => {
    setSelectedDatabase(dbName);
    setSelectedTable(null);
    setTableColumns([]);
    setTableData(null);
    setCurrentFilters({}); // Clear any existing filters
    
    try {
      await window.electronAPI.connectToDatabase(dbName);
      await loadTables(dbName);
    } catch (error: any) {
      showError(error.message);
    }
  };

  const loadTables = async (dbName: string) => {
    setLoadingTables(true);
    try {
      const result = await window.electronAPI.getTables(dbName);
      if (result.success) {
        setTables(result.tables);
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoadingTables(false);
    }
  };

  const createDatabase = async (dbName: string) => {
    try {
      const result = await window.electronAPI.createDatabase(dbName);
      if (result.success) {
        await loadDatabases();
        setSelectedDatabase(dbName);
        await selectDatabase(dbName);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteDatabase = async (dbName: string) => {
    if (!confirm(`Are you sure you want to delete database "${dbName}"?`)) return;
    
    try {
      const result = await window.electronAPI.deleteDatabase(dbName);
      if (result.success) {
        await loadDatabases();
        if (selectedDatabase === dbName) {
          setSelectedDatabase(null);
          setSelectedTable(null);
          setTables([]);
          setTableColumns([]);
          setTableData(null);
        }
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  // Table functions
  const selectTable = async (tableName: string) => {
    setSelectedTable(tableName);
    setTableColumns([]);
    setTableData(null);
    setCurrentFilters({}); // Clear any existing filters
    setActiveTab('data'); // Show data tab by default
    setCurrentPage(1); // Reset to first page
    
    try {
      // Load both structure and data
      await Promise.all([
        loadTableStructure(tableName),
        loadTableData(1, pageSize, {}) // Pass empty filters for fresh data
      ]);
    } catch (error: any) {
      console.error('Error loading table data:', error);
      showError(error.message);
    }
  };

  const loadTableStructure = async (tableName: string) => {
    if (!selectedDatabase) return;
    
    setLoadingTableStructure(true);
    try {
      const result = await window.electronAPI.getTableStructure({
        dbName: selectedDatabase,
        tableName: tableName
      });
      if (result.success) {
        setTableColumns(result.columns);
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoadingTableStructure(false);
    }
  };

  const loadTableData = async (page = 1, size = pageSize, filters = currentFilters, retryCount = 0) => {
    if (!selectedDatabase || !selectedTable) {
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (loadingTableData && retryCount === 0) {
      console.log('Table data is already loading, skipping duplicate call');
      return;
    }
    
    setLoadingTableData(true);
    // Clear previous data immediately when starting to load new data
    if (retryCount === 0) {
      setTableData(null);
    }
    
    try {
      const result = await window.electronAPI.getTableData({
        dbName: selectedDatabase,
        tableName: selectedTable,
        page: page,
        pageSize: size,
        filters: filters
      });
      
      if (result.success) {
        setTableData(result);
        setCurrentPage(page);
        setPageSize(size);
        setError(null); // Clear any previous errors
      } else {
        console.error('getTableData failed:', result.message);
        
        // Retry logic for connection issues
        if (retryCount < 2 && (result.message.includes('connection') || result.message.includes('timeout'))) {
          console.log(`Retrying loadTableData (attempt ${retryCount + 1})`);
          setTimeout(() => {
            loadTableData(page, size, filters, retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        showError(result.message);
      }
    } catch (error: any) {
      console.error('Error in loadTableData:', error);
      
      // Retry logic for network/connection errors
      if (retryCount < 2 && (error.message.includes('connection') || error.message.includes('timeout') || error.message.includes('ECONNRESET'))) {
        console.log(`Retrying loadTableData due to error (attempt ${retryCount + 1})`);
        setTimeout(() => {
          loadTableData(page, size, filters, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      showError(error.message);
    } finally {
      setLoadingTableData(false);
    }
  };

  const switchTab = (tab: 'structure' | 'data') => {
    setActiveTab(tab);
    if (tab === 'data' && !tableData) {
      loadTableData();
    }
  };

  const changePage = (page: number) => {
    if (page >= 1 && page <= (tableData?.totalPages || 1)) {
      loadTableData(page, pageSize);
    }
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    loadTableData(1, size);
  };

  const refreshTables = () => {
    if (selectedDatabase) {
      loadTables(selectedDatabase);
    }
  };

  const refreshTable = () => {
    if (selectedTable) {
      loadTableStructure(selectedTable);
      loadTableData(currentPage, pageSize);
    }
  };

  // Advanced table operations
  const updateTableCell = async (columnName: string, value: any, rowIndex: number) => {
    if (!selectedDatabase || !selectedTable || !tableData) return;
    
    const row = tableData.data[rowIndex];
    if (!row) return;

    // Create WHERE clause from primary key or first column
    const primaryKey = tableColumns.find(col => col.is_primary_key === 'YES') || tableColumns[0];
    const whereClause = `[${primaryKey.column_name}] = '${row[primaryKey.column_name]}'`;

    try {
      const result = await window.electronAPI.updateTableCell({
        dbName: selectedDatabase,
        tableName: selectedTable,
        columnName,
        value,
        whereClause
      });
      
      if (result.success) {
        // Refresh the table data
        await loadTableData(currentPage, pageSize);
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteTableRow = async (rowIndex: number) => {
    if (!selectedDatabase || !selectedTable || !tableData) return;
    
    const row = tableData.data[rowIndex];
    if (!row) return;

    // Create WHERE clause from primary key or first column
    const primaryKey = tableColumns.find(col => col.is_primary_key === 'YES') || tableColumns[0];
    const whereClause = `[${primaryKey.column_name}] = '${row[primaryKey.column_name]}'`;

    try {
      const result = await window.electronAPI.deleteTableRow({
        dbName: selectedDatabase,
        tableName: selectedTable,
        whereClause
      });
      
      if (result.success) {
        // Refresh the table data
        await loadTableData(currentPage, pageSize);
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const addTableRow = async (data: Record<string, any>) => {
    if (!selectedDatabase || !selectedTable) return;

    try {
      const result = await window.electronAPI.insertTableRow({
        dbName: selectedDatabase,
        tableName: selectedTable,
        data
      });
      
      if (result.success) {
        // Refresh the table data
        await loadTableData(currentPage, pageSize);
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const exportTableData = async (format: 'csv' | 'excel' | 'json') => {
    if (!selectedDatabase || !selectedTable) return;

    try {
      const result = await window.electronAPI.exportTableData({
        dbName: selectedDatabase,
        tableName: selectedTable,
        format
      });
      
      if (result.success) {
        // Create and download file
        const blob = new Blob([result.data], { 
          type: format === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTable}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteAllTableData = async () => {
    if (!selectedDatabase || !selectedTable) return;
    
    if (confirm(`Are you sure you want to delete ALL data from table "${selectedTable}"? This action cannot be undone.`)) {
      try {
        const result = await window.electronAPI.deleteAllTableData({
          dbName: selectedDatabase,
          tableName: selectedTable
        });
        
        if (result.success) {
          // Refresh the table data
          await loadTableData(currentPage, pageSize);
        } else {
          showError(result.message);
        }
      } catch (error: any) {
        showError(error.message);
      }
    }
  };

  const deleteTable = async () => {
    if (!selectedDatabase || !selectedTable) return;
    
    if (confirm(`Are you sure you want to delete table "${selectedTable}"? This action cannot be undone.`)) {
      try {
        const result = await window.electronAPI.deleteTable({
          dbName: selectedDatabase,
          tableName: selectedTable
        });
        
        if (result.success) {
        // Refresh tables list and clear selection
        if (selectedDatabase) {
          await loadTables(selectedDatabase);
        }
        setSelectedTable(null);
          setTableColumns([]);
          setTableData(null);
        } else {
          showError(result.message);
        }
      } catch (error: any) {
        showError(error.message);
      }
    }
  };

  const createTable = async (tableName: string, columns: any[]) => {
    if (!selectedDatabase) return;

    try {
      const result = await window.electronAPI.createTable({
        dbName: selectedDatabase,
        tableName,
        columns
      });
      
      if (result.success) {
        // Refresh tables list
        if (selectedDatabase) {
          await loadTables(selectedDatabase);
        }
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const importTableData = async (data: string, format: string) => {
    if (!selectedDatabase || !selectedTable) return;

    try {
      const result = await window.electronAPI.importTableData({
        dbName: selectedDatabase,
        tableName: selectedTable,
        data,
        format
      });
      
      if (result.success) {
        // Refresh table data
        await loadTableData();
        showSuccess(result.message);
      } else {
        showError(result.error);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const createDatabaseDump = async (includeData: boolean) => {
    if (!selectedDatabase) return;

    try {
      const result = await window.electronAPI.createDatabaseDump({
        dbName: selectedDatabase,
        includeData
      });
      
      if (result.success) {
        // Create and download the SQL file
        const blob = new Blob([result.dumpSQL], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedDatabase}_dump_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess(`Database dump created successfully! ${result.tableCount} tables included.`);
      } else {
        showError(result.error);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const restoreDatabaseDump = async (dumpSQL: string) => {
    if (!selectedDatabase) return;

    try {
      const result = await window.electronAPI.restoreDatabaseDump({
        dbName: selectedDatabase,
        dumpSQL
      });
      
      if (result.success) {
        showSuccess(result.message);
        // Refresh tables and data
        if (selectedDatabase) {
          await loadTables(selectedDatabase);
        }
        if (selectedTable) {
          await loadTableData();
        }
      } else {
        showError(result.error);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const applyFilters = async (filters: Record<string, any>) => {
    setCurrentFilters(filters);
    
    // Clear any existing timeout
    if (filterTimeout) {
      clearTimeout(filterTimeout);
    }
    
    // Debounce the filter application to prevent rapid queries
    const timeout = setTimeout(async () => {
      // Reset to first page when applying filters
      await loadTableData(1, pageSize, filters);
    }, 300); // 300ms debounce
    
    setFilterTimeout(timeout);
  };

  const editTableStructure = async (columns: Column[]) => {
    if (!selectedDatabase || !selectedTable) return;

    try {
      const result = await window.electronAPI.editTableStructure({
        dbName: selectedDatabase,
        tableName: selectedTable,
        columns: columns
      });
      
      if (result.success) {
        // Refresh table structure
        await loadTableStructure(selectedTable);
        showSuccess('Table structure updated successfully!');
      } else {
        showError(result.message);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };




  return (
    <div id="app">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <Loader size="large" type="spinner" text="Connecting to database..." />
        </div>
      )}

      {/* Error Modal */}
      <Modal
        isOpen={!!error}
        onClose={hideError}
        title="Error"
        footer={
          <button onClick={hideError} className="btn btn-primary">OK</button>
        }
      >
        <p>{error}</p>
      </Modal>

      {/* Create Database Modal */}
      <CreateDatabaseModal
        isOpen={showCreateDbModal}
        onClose={() => setShowCreateDbModal(false)}
        onCreate={createDatabase}
      />

      {/* Delete Connection Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={cancelDeleteConnection}
        title="Delete Connection"
        footer={
          <>
            <button 
              onClick={cancelDeleteConnection}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteConnection}
              className="btn btn-danger"
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this connection? This action cannot be undone.</p>
      </Modal>

      {/* Login Screen */}
      {currentScreen === 'login' && (
        <LoginScreen
          onConnect={connectToDatabase}
          onUseSavedConnection={useSavedConnection}
          onDeleteSavedConnection={deleteSavedConnection}
          onLoadSavedConnections={loadSavedConnections}
          savedConnections={savedConnections}
          loading={loading}
        />
      )}

      {/* Database Screen */}
      {currentScreen === 'database' && (
        <DatabaseScreen
          currentConnection={currentConnection}
          selectedDatabase={selectedDatabase}
          selectedTable={selectedTable}
          databases={databases}
          tables={tables}
          tableColumns={tableColumns}
          tableData={tableData}
          activeTab={activeTab}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          loadingDatabases={loadingDatabases}
          loadingTables={loadingTables}
          loadingTableData={loadingTableData}
          loadingTableStructure={loadingTableStructure}
          onDisconnect={disconnect}
          onSelectDatabase={selectDatabase}
          onSelectTable={selectTable}
          onRefreshTables={refreshTables}
          onSwitchTab={switchTab}
          onRefreshTable={refreshTable}
          onChangePage={changePage}
          onChangePageSize={changePageSize}
          onCreateDatabase={() => setShowCreateDbModal(true)}
          onUpdateTableCell={updateTableCell}
          onDeleteTableRow={deleteTableRow}
          onAddTableRow={addTableRow}
          onExportTableData={exportTableData}
          onDeleteAllTableData={deleteAllTableData}
          onDeleteTable={deleteTable}
          onCreateTable={createTable}
          onImportTableData={importTableData}
          onCreateDatabaseDump={createDatabaseDump}
          onRestoreDatabaseDump={restoreDatabaseDump}
          onApplyFilters={applyFilters}
          onEditStructure={editTableStructure}
        />
      )}

      {/* Password Dialog */}
      {passwordDialogData && (
        <PasswordDialog
          isOpen={showPasswordDialog}
          onClose={() => {
            setShowPasswordDialog(false);
            setPasswordDialogData(null);
          }}
          onSubmit={passwordDialogData.onSubmit}
          title={passwordDialogData.title}
          message={passwordDialogData.message}
        />
      )}
    </div>
  );
};

export default App;