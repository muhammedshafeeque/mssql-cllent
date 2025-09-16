import React, { useState, useMemo } from 'react';
import { Table } from '../types';
import SkeletonLoader from './SkeletonLoader';

interface SidebarProps {
  selectedDatabase: string | null;
  tables: Table[];
  selectedTable: string | null;
  loadingTables?: boolean;
  onSelectTable: (tableName: string) => void;
  onRefreshTables: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedDatabase,
  tables,
  selectedTable,
  loadingTables = false,
  onSelectTable,
  onRefreshTables
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tables based on search term
  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) return tables;
    
    return tables.filter(table => {
      const fullTableName = `${table.schema_name}.${table.table_name}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return fullTableName.includes(searchLower) || 
             table.table_name.toLowerCase().includes(searchLower) ||
             table.schema_name.toLowerCase().includes(searchLower);
    });
  }, [tables, searchTerm]);

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-header">
          <h3>Tables in {selectedDatabase || 'database'}</h3>
          <button 
            onClick={onRefreshTables}
            className="btn-icon"
            title="Refresh Tables"
            disabled={loadingTables}
          >
            {loadingTables ? '⏳' : '🔄'}
          </button>
        </div>
        
        {/* Search Input */}
        <div className="table-search-container">
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="table-search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="tables-list" id="tables-list">
          {loadingTables ? (
            <SkeletonLoader type="list" rows={5} />
          ) : filteredTables && filteredTables.length > 0 ? (
            filteredTables.map((table) => (
              <div 
                key={`${table.schema_name}.${table.table_name}`}
                className={`table-item ${selectedTable === `${table.schema_name}.${table.table_name}` ? 'active' : ''}`}
                onClick={() => onSelectTable(`${table.schema_name}.${table.table_name}`)}
              >
                <div className="table-name">{table.schema_name}.{table.table_name}</div>
                <div className="table-details">
                  Rows: {table.row_count || 0} | Modified: {new Date(table.modify_date).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">
              {searchTerm ? `No tables found matching "${searchTerm}"` : 'No tables found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
