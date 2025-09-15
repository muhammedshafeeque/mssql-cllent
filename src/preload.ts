// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  connectDatabase: (config: any) => ipcRenderer.invoke('connect-database', config),
  connectToDatabase: (dbName: string) => ipcRenderer.invoke('connect-to-database', dbName),
  getDatabases: () => ipcRenderer.invoke('get-databases'),
  saveCredentials: (credentials: any) => ipcRenderer.invoke('save-credentials', credentials),
  loadCredentials: () => ipcRenderer.invoke('load-credentials'),
  deleteCredentials: (id: string) => ipcRenderer.invoke('delete-credentials', id),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  createDatabase: (dbName: string) => ipcRenderer.invoke('create-database', dbName),
  deleteDatabase: (dbName: string) => ipcRenderer.invoke('delete-database', dbName),
  getTables: (dbName: string) => ipcRenderer.invoke('get-tables', dbName),
  getTableStructure: (params: { dbName: string, tableName: string }) => ipcRenderer.invoke('get-table-structure', params),
  getTableData: (params: { dbName: string, tableName: string, page?: number, pageSize?: number }) => ipcRenderer.invoke('get-table-data', params),
  
  // Advanced table operations
  updateTableCell: (params: any) => ipcRenderer.invoke('update-table-cell', params),
  deleteTableRow: (params: any) => ipcRenderer.invoke('delete-table-row', params),
  insertTableRow: (params: any) => ipcRenderer.invoke('insert-table-row', params),
  getTableRelations: (params: any) => ipcRenderer.invoke('get-table-relations', params),
  deleteAllTableData: (params: any) => ipcRenderer.invoke('delete-all-table-data', params),
  exportTableData: (params: any) => ipcRenderer.invoke('export-table-data', params),
  createTable: (params: any) => ipcRenderer.invoke('create-table', params),
  deleteTable: (params: any) => ipcRenderer.invoke('delete-table', params),
  
  // Import and dump operations
  importTableData: (params: any) => ipcRenderer.invoke('import-table-data', params),
  createDatabaseDump: (params: any) => ipcRenderer.invoke('create-database-dump', params),
  restoreDatabaseDump: (params: any) => ipcRenderer.invoke('restore-database-dump', params),
  
  // Session management
  loadSession: () => ipcRenderer.invoke('load-session'),
  restoreSession: (session: any) => ipcRenderer.invoke('restore-session', session)
});
