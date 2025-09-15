import React from 'react';
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
        <div className="tables-list" id="tables-list">
          {loadingTables ? (
            <SkeletonLoader type="list" rows={5} />
          ) : tables && tables.length > 0 ? (
            tables.map((table) => (
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
            <div className="no-data">No tables found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
