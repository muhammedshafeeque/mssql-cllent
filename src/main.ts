import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import sql from 'mssql';
import { promises as fs } from 'fs';
import { homedir } from 'os';

// Workaround for Linux namespace/sandbox issues when not running as root
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Global connection pools for different databases
let connectionPools: Map<string, sql.ConnectionPool> = new Map();
let connectionConfigs: Map<string, any> = new Map();
let currentDatabase: string | null = null;

// Credentials storage path
const credentialsPath = path.join(homedir(), '.byzand-credentials.json');
const sessionPath = path.join(homedir(), '.byzand-session.json');

// Load saved credentials
const loadCredentials = async (): Promise<any[]> => {
  try {
    const data = await fs.readFile(credentialsPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Save credentials
const saveCredentials = async (credentials: any[]): Promise<void> => {
  await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2));
};

// Session management functions
const saveSession = async (session: any): Promise<void> => {
  try {
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

const loadSession = async (): Promise<any> => {
  try {
    const data = await fs.readFile(sessionPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const clearSession = async (): Promise<void> => {
  try {
    await fs.unlink(sessionPath);
  } catch {
    // File doesn't exist, that's fine
  }
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
  }
};

// IPC handlers for database operations
ipcMain.handle('connect-database', async (event, config) => {
  try {
    // Close all existing connections
    for (const [dbName, pool] of connectionPools) {
      await pool.close();
    }
    connectionPools.clear();
    currentDatabase = null;

    // Create connection to master database
    const masterPool = new sql.ConnectionPool({
      server: config.server,
      user: config.username,
      password: config.password,
      database: 'master',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    await masterPool.connect();
    connectionPools.set('master', masterPool);
    connectionConfigs.set('master', config);
    
    // Save active session
    await saveSession({
      server: config.server,
      username: config.username,
      connectionName: config.connectionName,
      connectedAt: new Date().toISOString()
    });
    
    return { success: true, message: 'Connected successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-databases', async () => {
  try {
    const masterPool = connectionPools.get('master');
    if (!masterPool) {
      throw new Error('No active connection');
    }

    const result = await masterPool.request().query(`
      SELECT name, database_id, create_date 
      FROM sys.databases 
      WHERE database_id > 4 
      ORDER BY name
    `);

    return { success: true, databases: result.recordset };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('save-credentials', async (event, credentials) => {
  try {
    const savedCredentials = await loadCredentials();
    const newCredential = {
      id: Date.now().toString(),
      name: credentials.name || `${credentials.server} - ${credentials.username}`,
      server: credentials.server,
      username: credentials.username,
      password: credentials.password,
      savedAt: new Date().toISOString(),
    };
    
    savedCredentials.push(newCredential);
    await saveCredentials(savedCredentials);
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-credentials', async () => {
  try {
    const credentials = await loadCredentials();
    return { success: true, credentials };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-credentials', async (event, id) => {
  try {
    const credentials = await loadCredentials();
    const filtered = credentials.filter((cred: any) => cred.id !== id);
    await saveCredentials(filtered);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});




ipcMain.handle('connect-to-database', async (event, dbName) => {
  try {
    // Check if we already have a connection to this database
    if (connectionPools.has(dbName)) {
      currentDatabase = dbName;
      return { success: true, message: `Connected to ${dbName}` };
    }

    // Get master connection to get server details
    const masterPool = connectionPools.get('master');
    if (!masterPool) {
      throw new Error('No active connection');
    }

    // Create new connection to specific database
    // We need to get the original config from the connection request
    const originalConfig = connectionConfigs.get('master');
    if (!originalConfig) {
      throw new Error('No original connection config found');
    }
    const dbPool = new sql.ConnectionPool({
      server: originalConfig.server,
      user: originalConfig.username,
      password: originalConfig.password,
      database: dbName,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    await dbPool.connect();
    connectionPools.set(dbName, dbPool);
    currentDatabase = dbName;
    
    return { success: true, message: `Connected to ${dbName}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-tables', async (event, dbName) => {
  try {
    // Ensure we have a connection to this database
    if (!connectionPools.has(dbName)) {
      const connectResult = await ipcMain.emit('connect-to-database', null, dbName);
      if (!connectResult) {
        throw new Error(`Failed to connect to database ${dbName}`);
      }
    }

    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const result = await dbPool.request().query(`
      SELECT 
        t.name as table_name,
        s.name as schema_name,
        t.create_date,
        t.modify_date,
        p.rows as row_count
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      LEFT JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
      ORDER BY s.name, t.name
    `);

    return { success: true, tables: result.recordset };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-table-structure', async (event, { dbName, tableName }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    // Handle schema.table format properly
    const schemaName = tableName.includes('.') ? tableName.split('.')[0] : 'dbo';
    const actualTableName = tableName.includes('.') ? tableName.split('.')[1] : tableName;

    const result = await dbPool.request().query(`
      SELECT 
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_primary_key
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      WHERE c.table_schema = '${schemaName}' AND c.table_name = '${actualTableName}'
      ORDER BY c.ordinal_position
    `);

    return { success: true, columns: result.recordset };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('create-database', async (event, dbName) => {
  try {
    const masterPool = connectionPools.get('master');
    if (!masterPool) {
      throw new Error('No active connection');
    }

    // Validate database name
    if (!dbName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
      throw new Error('Invalid database name. Use only letters, numbers, and underscores.');
    }

    await masterPool.request().query(`CREATE DATABASE [${dbName}]`);
    return { success: true, message: `Database '${dbName}' created successfully` };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-database', async (event, dbName) => {
  try {
    const masterPool = connectionPools.get('master');
    if (!masterPool) {
      throw new Error('No active connection');
    }

    // Prevent deletion of system databases
    const systemDbs = ['master', 'tempdb', 'model', 'msdb'];
    if (systemDbs.includes(dbName.toLowerCase())) {
      throw new Error('Cannot delete system databases');
    }

    // Close connection to the database being deleted
    if (connectionPools.has(dbName)) {
      await connectionPools.get(dbName)!.close();
      connectionPools.delete(dbName);
    }

    await masterPool.request().query(`DROP DATABASE [${dbName}]`);
    return { success: true, message: `Database '${dbName}' deleted successfully` };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('disconnect', async () => {
  try {
    // Close all connections
    for (const [dbName, pool] of connectionPools) {
      await pool.close();
    }
    connectionPools.clear();
    currentDatabase = null;
    
    // Clear session
    await clearSession();
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Session management IPC handlers
ipcMain.handle('load-session', async () => {
  try {
    const session = await loadSession();
    return { success: true, session };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-session', async (event, session) => {
  try {
    // Close all existing connections
    for (const [dbName, pool] of connectionPools) {
      await pool.close();
    }
    connectionPools.clear();
    connectionConfigs.clear();
    currentDatabase = null;

    // Create connection to master database
    const masterPool = new sql.ConnectionPool({
      server: session.server,
      user: session.username,
      password: '', // We don't store passwords in session
      database: 'master',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    await masterPool.connect();
    connectionPools.set('master', masterPool);
    connectionConfigs.set('master', {
      server: session.server,
      user: session.username,
      password: '', // Will need to be re-entered
      database: 'master',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    return { success: true, message: 'Session restored successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-table-data', async (event, { dbName, tableName, page = 1, pageSize = 10, filters = {} }) => {
  try {
    console.log('get-table-data called with:', { dbName, tableName, page, pageSize });
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    // Handle schema.table format properly
    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    console.log('Full table name:', fullTableName);

    // Build WHERE clause for filters
    const whereConditions: string[] = [];
    const request = dbPool.request();
    
    Object.entries(filters).forEach(([columnName, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const paramName = `filter_${columnName.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // Handle different data types appropriately
        // Check for boolean values (both actual booleans and string representations)
        const isBooleanValue = typeof value === 'boolean' || 
                              (typeof value === 'string' && (value === 'true' || value === 'false'));
        
        if (isBooleanValue) {
          // Boolean values need exact matching
          whereConditions.push(`[${columnName}] = @${paramName}`);
          request.input(paramName, value === 'true' || value === true);
        } else if (typeof value === 'number' || !isNaN(Number(value))) {
          // Numeric values need exact matching
          whereConditions.push(`[${columnName}] = @${paramName}`);
          request.input(paramName, Number(value));
        } else {
          // String values can use LIKE for partial matching
          whereConditions.push(`[${columnName}] LIKE @${paramName}`);
          request.input(paramName, `%${value}%`);
        }
      }
    });
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count with filters
    const countQuery = `SELECT COUNT(*) as total_count FROM ${fullTableName} ${whereClause}`;
    console.log('Count query:', countQuery);
    const countResult = await request.query(countQuery);
    const totalCount = countResult.recordset[0].total_count;
    console.log('Total count:', totalCount);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Get paginated data with filters
    const dataQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as row_num
        FROM ${fullTableName}
        ${whereClause}
      ) AS numbered
      WHERE row_num > ${offset} AND row_num <= ${offset + pageSize}
    `;
    console.log('Data query:', dataQuery);
    const dataResult = await request.query(dataQuery);
    console.log('Data result rows:', dataResult.recordset.length);

    const result = { 
      success: true, 
      data: dataResult.recordset,
      totalCount: totalCount,
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
    console.log('Returning result:', result);
    return result;
  } catch (error) {
    console.error('Error getting table data:', error);
    return { success: false, message: error.message };
  }
});

// Advanced table operations
ipcMain.handle('update-table-cell', async (event, { dbName, tableName, columnName, value, whereClause }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    
    const query = `UPDATE ${fullTableName} SET [${columnName}] = @value WHERE ${whereClause}`;
    await dbPool.request()
      .input('value', value)
      .query(query);

    return { success: true, message: 'Cell updated successfully' };
  } catch (error) {
    console.error('Error updating table cell:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-table-row', async (event, { dbName, tableName, whereClause }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    
    const query = `DELETE FROM ${fullTableName} WHERE ${whereClause}`;
    await dbPool.request().query(query);

    return { success: true, message: 'Row deleted successfully' };
  } catch (error) {
    console.error('Error deleting table row:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('insert-table-row', async (event, { dbName, tableName, data }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    
    const columns = Object.keys(data).map(col => `[${col}]`).join(', ');
    const values = Object.keys(data).map((col, index) => `@value${index}`).join(', ');
    
    const request = dbPool.request();
    Object.keys(data).forEach((col, index) => {
      request.input(`value${index}`, data[col]);
    });
    
    const query = `INSERT INTO ${fullTableName} (${columns}) VALUES (${values})`;
    await request.query(query);

    return { success: true, message: 'Row inserted successfully' };
  } catch (error) {
    console.error('Error inserting table row:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-table-relations', async (event, { dbName, tableName }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const schema = tableName.split('.')[0];
    const table = tableName.split('.')[1];

    const query = `
      SELECT 
        fk.name AS foreign_key_name,
        tp.name AS parent_table,
        cp.name AS parent_column,
        tr.name AS referenced_table,
        cr.name AS referenced_column
      FROM sys.foreign_keys AS fk
      INNER JOIN sys.tables AS tp ON fk.parent_object_id = tp.object_id
      INNER JOIN sys.tables AS tr ON fk.referenced_object_id = tr.object_id
      INNER JOIN sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.columns AS cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
      INNER JOIN sys.columns AS cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
      WHERE tp.name = '${table}' AND SCHEMA_NAME(tp.schema_id) = '${schema}'
    `;

    const result = await dbPool.request().query(query);
    return { success: true, data: result.recordset };
  } catch (error) {
    console.error('Error getting table relations:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-all-table-data', async (event, { dbName, tableName }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    
    const query = `DELETE FROM ${fullTableName}`;
    await dbPool.request().query(query);

    return { success: true, message: 'All data deleted successfully' };
  } catch (error) {
    console.error('Error deleting all table data:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('export-table-data', async (event, { dbName, tableName, format }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    
    const query = `SELECT * FROM ${fullTableName}`;
    const result = await dbPool.request().query(query);

    let exportData;
    switch (format) {
      case 'csv':
        exportData = convertToCSV(result.recordset);
        break;
      case 'json':
        exportData = JSON.stringify(result.recordset, null, 2);
        break;
      case 'excel':
        exportData = convertToExcel(result.recordset);
        break;
      default:
        throw new Error('Unsupported export format');
    }

    return { success: true, data: exportData, format };
  } catch (error) {
    console.error('Error exporting table data:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('create-table', async (event, { dbName, tableName, columns }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    
    const columnDefinitions = columns.map((col: any) => 
      `[${col.name}] ${col.type}${col.length ? `(${col.length})` : ''} ${col.nullable ? 'NULL' : 'NOT NULL'}${col.default ? ` DEFAULT ${col.default}` : ''}`
    ).join(', ');

    const query = `CREATE TABLE ${fullTableName} (${columnDefinitions})`;
    await dbPool.request().query(query);

    return { success: true, message: 'Table created successfully' };
  } catch (error) {
    console.error('Error creating table:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-table', async (event, { dbName, tableName }) => {
  try {
    const dbPool = connectionPools.get(dbName);
    if (!dbPool) {
      throw new Error(`No connection to database ${dbName}`);
    }

    const fullTableName = tableName.includes('.') ? `[${tableName.split('.')[0]}].[${tableName.split('.')[1]}]` : `[${tableName}]`;
    
    const query = `DROP TABLE ${fullTableName}`;
    await dbPool.request().query(query);

    return { success: true, message: 'Table deleted successfully' };
  } catch (error) {
    console.error('Error deleting table:', error);
    return { success: false, message: error.message };
  }
});

// Helper functions for export
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function convertToExcel(data: any[]): string {
  // For now, return CSV format. In a real implementation, you'd use a library like xlsx
  return convertToCSV(data);
}

// Import data to table
ipcMain.handle('import-table-data', async (event, { dbName, tableName, data, format }) => {
  try {
    console.log(`Importing data to table: ${tableName} in database: ${dbName}`);
    
    if (!dbName || !tableName || !data) {
      throw new Error('Missing required parameters: dbName, tableName, or data');
    }

    // Get the connection pool for the specific database
    const poolKey = `${dbName}`;
    let pool = connectionPools.get(poolKey);
    
    if (!pool) {
      // Create a new pool for this database
      const config = connectionConfigs.get('master');
      if (!config) {
        throw new Error('No master connection configuration found');
      }
      
      const dbConfig = {
        ...config,
        database: dbName,
        options: {
          ...config.options,
          encrypt: false,
          trustServerCertificate: true
        }
      };
      
      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      connectionPools.set(poolKey, pool);
    }

    const request = pool.request();
    
    // Parse data based on format
    let parsedData;
    if (format === 'csv') {
      parsedData = parseCSVData(data);
    } else if (format === 'json') {
      parsedData = JSON.parse(data);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error('No valid data to import');
    }

    // Get table structure to validate columns
    const structureQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = '${tableName.split('.')[1] || tableName}' 
      AND TABLE_SCHEMA = '${tableName.split('.')[0] || 'dbo'}'
      ORDER BY ORDINAL_POSITION
    `;
    
    const structureResult = await request.query(structureQuery);
    const columns = structureResult.recordset;
    
    if (columns.length === 0) {
      throw new Error(`Table ${tableName} not found`);
    }

    // Get column names
    const columnNames = columns.map((col: any) => col.COLUMN_NAME);
    const dataColumns = Object.keys(parsedData[0]);
    
    // Validate that all data columns exist in the table
    const invalidColumns = dataColumns.filter(col => !columnNames.includes(col));
    if (invalidColumns.length > 0) {
      throw new Error(`Invalid columns: ${invalidColumns.join(', ')}`);
    }

    // Insert data
    let insertedCount = 0;
    for (const row of parsedData) {
      const values = columnNames.map(col => {
        const value = row[col];
        if (value === null || value === undefined || value === '') {
          return 'NULL';
        }
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
        }
        return value;
      });
      
      const insertQuery = `
        INSERT INTO [${tableName.split('.')[0] || 'dbo'}].[${tableName.split('.')[1] || tableName}] 
        (${columnNames.map(col => `[${col}]`).join(', ')})
        VALUES (${values.join(', ')})
      `;
      
      await request.query(insertQuery);
      insertedCount++;
    }

    return {
      success: true,
      message: `Successfully imported ${insertedCount} rows to ${tableName}`,
      insertedCount
    };

  } catch (error) {
    console.error('Error importing data:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Create database dump
ipcMain.handle('create-database-dump', async (event, { dbName, includeData = true }) => {
  try {
    console.log(`Creating database dump for: ${dbName}`);
    
    if (!dbName) {
      throw new Error('Database name is required');
    }

    // Get the connection pool for the specific database
    const poolKey = `${dbName}`;
    let pool = connectionPools.get(poolKey);
    
    if (!pool) {
      // Create a new pool for this database
      const config = connectionConfigs.get('master');
      if (!config) {
        throw new Error('No master connection configuration found');
      }
      
      const dbConfig = {
        ...config,
        database: dbName,
        options: {
          ...config.options,
          encrypt: false,
          trustServerCertificate: true
        }
      };
      
      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      connectionPools.set(poolKey, pool);
    }

    const request = pool.request();
    let dumpSQL = `-- Database Dump for ${dbName}\n-- Generated on ${new Date().toISOString()}\n\n`;
    
    // Get all tables
    const tablesQuery = `
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const tablesResult = await request.query(tablesQuery);
    const tables = tablesResult.recordset;
    
    for (const table of tables) {
      const fullTableName = `[${table.TABLE_SCHEMA}].[${table.TABLE_NAME}]`;
      
      // Get table structure
      const structureQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          NUMERIC_PRECISION,
          NUMERIC_SCALE,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${table.TABLE_NAME}' 
        AND TABLE_SCHEMA = '${table.TABLE_SCHEMA}'
        ORDER BY ORDINAL_POSITION
      `;
      
      const structureResult = await request.query(structureQuery);
      const columns = structureResult.recordset;
      
      // Create table statement
      dumpSQL += `-- Table structure for ${fullTableName}\n`;
      dumpSQL += `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${table.TABLE_NAME}' AND xtype='U')\n`;
      dumpSQL += `CREATE TABLE ${fullTableName} (\n`;
      
      const columnDefinitions = columns.map((col: any) => {
        let definition = `  [${col.COLUMN_NAME}] ${col.DATA_TYPE}`;
        
        if (col.CHARACTER_MAXIMUM_LENGTH) {
          definition += `(${col.CHARACTER_MAXIMUM_LENGTH})`;
        } else if (col.NUMERIC_PRECISION) {
          definition += `(${col.NUMERIC_PRECISION}`;
          if (col.NUMERIC_SCALE) {
            definition += `,${col.NUMERIC_SCALE}`;
          }
          definition += `)`;
        }
        
        if (col.IS_NULLABLE === 'NO') {
          definition += ' NOT NULL';
        }
        
        if (col.COLUMN_DEFAULT) {
          definition += ` DEFAULT ${col.COLUMN_DEFAULT}`;
        }
        
        return definition;
      });
      
      dumpSQL += columnDefinitions.join(',\n');
      dumpSQL += `\n);\n\n`;
      
      // Include data if requested
      if (includeData) {
        const dataQuery = `SELECT * FROM ${fullTableName}`;
        const dataResult = await request.query(dataQuery);
        
        if (dataResult.recordset.length > 0) {
          dumpSQL += `-- Data for ${fullTableName}\n`;
          
          for (const row of dataResult.recordset) {
            const columnNames = Object.keys(row);
            const values = columnNames.map(col => {
              const value = row[col];
              if (value === null || value === undefined) {
                return 'NULL';
              }
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`;
              }
              if (value instanceof Date) {
                return `'${value.toISOString()}'`;
              }
              return value;
            });
            
            dumpSQL += `INSERT INTO ${fullTableName} (${columnNames.map(col => `[${col}]`).join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          
          dumpSQL += `\n`;
        }
      }
    }
    
    return {
      success: true,
      dumpSQL,
      tableCount: tables.length
    };

  } catch (error) {
    console.error('Error creating database dump:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Restore database from dump
ipcMain.handle('restore-database-dump', async (event, { dbName, dumpSQL }) => {
  try {
    console.log(`Restoring database dump for: ${dbName}`);
    
    if (!dbName || !dumpSQL) {
      throw new Error('Database name and dump SQL are required');
    }

    // Get the connection pool for the specific database
    const poolKey = `${dbName}`;
    let pool = connectionPools.get(poolKey);
    
    if (!pool) {
      // Create a new pool for this database
      const config = connectionConfigs.get('master');
      if (!config) {
        throw new Error('No master connection configuration found');
      }
      
      const dbConfig = {
        ...config,
        database: dbName,
        options: {
          ...config.options,
          encrypt: false,
          trustServerCertificate: true
        }
      };
      
      pool = new sql.ConnectionPool(dbConfig);
      await pool.connect();
      connectionPools.set(poolKey, pool);
    }

    const request = pool.request();
    
    // Split SQL into individual statements
    const statements = dumpSQL
      .split(';')
      .map((stmt: string) => stmt.trim())
      .filter((stmt: string) => stmt.length > 0 && !stmt.startsWith('--'));
    
    let executedCount = 0;
    const errors = [];
    
    for (const statement of statements) {
      try {
        await request.query(statement);
        executedCount++;
      } catch (error) {
        console.error(`Error executing statement: ${statement}`, error);
        errors.push({
          statement: statement.substring(0, 100) + '...',
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      message: `Successfully executed ${executedCount} statements`,
      executedCount,
      errors: errors.length > 0 ? errors : null
    };

  } catch (error) {
    console.error('Error restoring database dump:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Helper function to parse CSV data
function parseCSVData(csvText: string) {
  const lines = csvText.split('\n').filter((line: string) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v: string) => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i + 1}: column count mismatch`);
      continue;
    }
    
    const row: any = {};
    headers.forEach((header: string, index: number) => {
      row[header] = values[index] || null;
    });
    data.push(row);
  }
  
  return data;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
