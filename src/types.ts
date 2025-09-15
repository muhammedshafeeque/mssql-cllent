// Types
export interface Connection {
  id: string;
  name: string;
  server: string;
  username: string;
  password: string;
}

export interface Database {
  name: string;
  create_date: string;
}

export interface Table {
  table_name: string;
  schema_name: string;
  create_date: string;
  modify_date: string;
  row_count: number;
}

export interface Column {
  column_name: string;
  data_type: string;
  character_maximum_length: number | null;
  is_nullable: string;
  column_default: string | null;
  is_primary_key: string;
}

export interface TableData {
  data: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      connectDatabase: (credentials: any) => Promise<any>;
      connectToDatabase: (dbName: string) => Promise<any>;
      getDatabases: () => Promise<any>;
      saveCredentials: (credentials: any) => Promise<any>;
      loadCredentials: () => Promise<any>;
      deleteCredentials: (id: string) => Promise<any>;
      disconnect: () => Promise<any>;
      createDatabase: (dbName: string) => Promise<any>;
      deleteDatabase: (dbName: string) => Promise<any>;
      getTables: (dbName: string) => Promise<any>;
      getTableStructure: (params: { dbName: string; tableName: string }) => Promise<any>;
      getTableData: (params: { dbName: string; tableName: string; page: number; pageSize: number; filters?: Record<string, any> }) => Promise<any>;
      
      // Advanced table operations
      updateTableCell: (params: any) => Promise<any>;
      deleteTableRow: (params: any) => Promise<any>;
      insertTableRow: (params: any) => Promise<any>;
      getTableRelations: (params: any) => Promise<any>;
      deleteAllTableData: (params: any) => Promise<any>;
      exportTableData: (params: any) => Promise<any>;
      createTable: (params: any) => Promise<any>;
      deleteTable: (params: any) => Promise<any>;
      
      // Import and dump operations
      importTableData: (params: any) => Promise<any>;
      createDatabaseDump: (params: any) => Promise<any>;
      restoreDatabaseDump: (params: any) => Promise<any>;
      
      // Session management
      loadSession: () => Promise<any>;
      restoreSession: (session: any) => Promise<any>;
    };
  }
}
