import React, { useState } from 'react';
import { Column, TableData } from '../types';
import SkeletonLoader from './SkeletonLoader';
import Loader from './Loader';
import TableToolbar from './TableToolbar';
import EditableCell from './EditableCell';
import AddRowModal from './AddRowModal';
import RelationsModal from './RelationsModal';
import CreateTableModal from './CreateTableModal';
import ImportDataModal from './ImportDataModal';
import FilterModal from './FilterModal';
import EditStructureModal from './EditStructureModal';
import ConfirmationModal from './ConfirmationModal';

interface TableViewerProps {
  selectedDatabase: string | null;
  selectedTable: string | null;
  tableColumns: Column[];
  tableData: TableData | null;
  activeTab: 'structure' | 'data';
  currentPage: number;
  pageSize: number;
  loadingTableData?: boolean;
  loadingTableStructure?: boolean;
  onSwitchTab: (tab: 'structure' | 'data') => void;
  onRefreshTable: () => void;
  onChangePage: (page: number) => void;
  onChangePageSize: (size: number) => void;
  onUpdateTableCell?: (columnName: string, value: any, rowIndex: number) => Promise<void>;
  onDeleteTableRow?: (rowIndex: number) => Promise<void>;
  onAddTableRow?: (data: Record<string, any>) => Promise<void>;
  onExportTableData?: (format: 'csv' | 'excel' | 'json') => Promise<void>;
  onDeleteAllTableData?: () => Promise<void>;
  onDeleteTable?: () => Promise<void>;
  onCreateTable?: (tableName: string, columns: any[]) => Promise<void>;
  onImportTableData?: (data: string, format: string) => Promise<void>;
  onApplyFilters?: (filters: Record<string, any>) => Promise<void>;
  onEditStructure?: (columns: Column[]) => Promise<void>;
}

const TableViewer: React.FC<TableViewerProps> = ({
  selectedDatabase,
  selectedTable,
  tableColumns,
  tableData,
  activeTab,
  currentPage,
  pageSize,
  loadingTableData = false,
  loadingTableStructure = false,
  onSwitchTab,
  onRefreshTable,
  onChangePage,
  onChangePageSize,
  onUpdateTableCell,
  onDeleteTableRow,
  onAddTableRow,
  onExportTableData,
  onDeleteAllTableData,
  onDeleteTable,
  onCreateTable,
  onImportTableData,
  onApplyFilters,
  onEditStructure
}) => {
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [showRelationsModal, setShowRelationsModal] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showImportDataModal, setShowImportDataModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditStructureModal, setShowEditStructureModal] = useState(false);
  const [relations, setRelations] = useState<any[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [showDeleteRowConfirm, setShowDeleteRowConfirm] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);

  const handleShowRelations = async () => {
    if (!selectedDatabase || !selectedTable) return;
    
    setLoadingRelations(true);
    try {
      const result = await window.electronAPI.getTableRelations({
        dbName: selectedDatabase,
        tableName: selectedTable
      });
      if (result.success) {
        setRelations(result.data);
        setShowRelationsModal(true);
      }
    } catch (error) {
      console.error('Error loading relations:', error);
    } finally {
      setLoadingRelations(false);
    }
  };

  const handleDeleteRow = async (rowIndex: number) => {
    if (!selectedDatabase || !selectedTable || !tableData || !onDeleteTableRow) return;
    
    const row = tableData.data[rowIndex];
    if (!row) return;

    setRowToDelete(rowIndex);
    setShowDeleteRowConfirm(true);
  };

  const confirmDeleteRow = async () => {
    if (rowToDelete === null || !onDeleteTableRow) return;
    
    try {
      await onDeleteTableRow(rowToDelete);
    } catch (error) {
      console.error('Error deleting row:', error);
      alert('Failed to delete row. Please check the console for details.');
    } finally {
      setShowDeleteRowConfirm(false);
      setRowToDelete(null);
    }
  };

  if (!selectedTable) {
    return (
      <div className="welcome-message">
        <h2>Welcome to Byzand</h2>
        <p>Select a database and table to get started</p>
        <TableToolbar
          selectedDatabase={selectedDatabase}
          selectedTable={selectedTable}
          onAddRow={() => {}}
          onDeleteAllData={() => {}}
          onExportData={() => {}}
          onShowRelations={() => {}}
          onCreateTable={() => setShowCreateTableModal(true)}
          onDeleteTable={() => {}}
          loading={false}
        />
        <CreateTableModal
          isOpen={showCreateTableModal}
          onClose={() => setShowCreateTableModal(false)}
          onCreate={onCreateTable || (() => Promise.resolve())}
          columns={[]}
          loading={false}
        />
      </div>
    );
  }

  return (
    <div className="table-details active">
      <div className="table-header">
        <h2 id="table-name">{selectedDatabase}.{selectedTable}</h2>
        <button 
          onClick={onRefreshTable}
          className="btn btn-sm btn-secondary"
          disabled={loadingTableData || loadingTableStructure}
        >
          {loadingTableData || loadingTableStructure ? (
            <Loader size="small" type="bars" />
          ) : 'Refresh'}
        </button>
      </div>

        <TableToolbar
          selectedDatabase={selectedDatabase}
          selectedTable={selectedTable}
          onAddRow={() => setShowAddRowModal(true)}
          onDeleteAllData={onDeleteAllTableData || (() => Promise.resolve())}
          onExportData={onExportTableData || (() => Promise.resolve())}
          onShowRelations={handleShowRelations}
          onCreateTable={() => setShowCreateTableModal(true)}
          onDeleteTable={onDeleteTable || (() => Promise.resolve())}
          onImportData={() => setShowImportDataModal(true)}
          onShowFilters={() => setShowFilterModal(true)}
          loading={loadingTableData || loadingTableStructure}
        />

      <div className="table-tabs">
        <button 
          className={`tab-btn ${activeTab === 'structure' ? 'active' : ''}`}
          onClick={() => onSwitchTab('structure')}
        >
          Structure
        </button>
        <button 
          className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => onSwitchTab('data')}
        >
          Data
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'structure' && (
          <div className="tab-pane structure-tab active">
            <div className="structure-header">
              <h3>Table Structure</h3>
              <button
                onClick={() => setShowEditStructureModal(true)}
                className="btn btn-sm btn-primary"
                disabled={loadingTableStructure}
              >
                ✏️ Edit Structure
              </button>
            </div>
            <div className="table-columns">
              {loadingTableStructure ? (
                <SkeletonLoader type="table" rows={6} columns={6} />
              ) : tableColumns && tableColumns.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Length</th>
                      <th>Nullable</th>
                      <th>Default</th>
                      <th>Primary Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableColumns.map((col, index) => (
                      <tr key={index}>
                        <td>{col.column_name}</td>
                        <td>{col.data_type}</td>
                        <td>{col.character_maximum_length || '-'}</td>
                        <td>{col.is_nullable}</td>
                        <td>{col.column_default || '-'}</td>
                        <td>{col.is_primary_key}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">No structure information available</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="tab-pane data-tab active">
            <div className="table-data">
              <div className="data-header">
                <h3>Table Data</h3>
                <div className="data-info">
                  {tableData && (
                    <span className="data-info-text">
                      Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, tableData.totalCount)} of {tableData.totalCount} rows
                    </span>
                  )}
                </div>
              </div>
              <div className="data-table-container">
                {loadingTableData ? (
                  <SkeletonLoader type="table" rows={10} columns={4} />
                ) : tableData ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        {tableData.data.length > 0 ? (
                          Object.keys(tableData.data[0]).map((col) => (
                            <th key={col}>{col}</th>
                          ))
                        ) : (
                          tableColumns.map((col) => (
                            <th key={col.column_name}>{col.column_name}</th>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.data.length > 0 ? (
                        tableData.data.map((row, index) => (
                          <tr key={index}>
                            {Object.keys(row).map((col) => (
                              <EditableCell
                                key={col}
                                value={row[col]}
                                columnName={col}
                                rowIndex={index}
                                onSave={onUpdateTableCell || (() => Promise.resolve())}
                                isEditable={col !== 'row_num'}
                              />
                            ))}
                            <td className="row-actions">
                              <button
                                onClick={() => handleDeleteRow(index)}
                                className="btn btn-sm btn-danger"
                                title="Delete row"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={tableColumns.length} className="no-data-cell">
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">No data available</div>
                )}
              </div>
              {tableData && (
                <div className="pagination">
                  <div className="pagination-info">
                    Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, tableData.totalCount)} of {tableData.totalCount} rows
                  </div>
                  <div className="pagination-controls">
                    <button 
                      onClick={() => onChangePage(1)} 
                      disabled={currentPage === 1}
                      className="btn-icon"
                    >
                      &lt;&lt;
                    </button>
                    <button 
                      onClick={() => onChangePage(currentPage - 1)} 
                      disabled={currentPage === 1}
                      className="btn-icon"
                    >
                      &lt;
                    </button>
                    <span className="current-page">{currentPage}</span>
                    <button 
                      onClick={() => onChangePage(currentPage + 1)} 
                      disabled={currentPage === tableData.totalPages}
                      className="btn-icon"
                    >
                      &gt;
                    </button>
                    <button 
                      onClick={() => onChangePage(tableData.totalPages)} 
                      disabled={currentPage === tableData.totalPages}
                      className="btn-icon"
                    >
                      &gt;&gt;
                    </button>
                  </div>
                  <div className="page-size-selector">
                    <label>Rows per page:</label>
                    <select 
                      value={pageSize} 
                      onChange={(e) => onChangePageSize(Number(e.target.value))}
                      className="page-size-select"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddRowModal
        isOpen={showAddRowModal}
        onClose={() => setShowAddRowModal(false)}
        onSave={onAddTableRow || (() => Promise.resolve())}
        columns={tableColumns}
        loading={loadingTableData}
      />

      <RelationsModal
        isOpen={showRelationsModal}
        onClose={() => setShowRelationsModal(false)}
        relations={relations}
        loading={loadingRelations}
      />

      <CreateTableModal
        isOpen={showCreateTableModal}
        onClose={() => setShowCreateTableModal(false)}
        onCreate={onCreateTable || (() => Promise.resolve())}
        columns={[]}
        loading={false}
      />

      <ImportDataModal
        isOpen={showImportDataModal}
        onClose={() => setShowImportDataModal(false)}
        onImport={onImportTableData || (() => Promise.resolve())}
        tableName={selectedTable || ''}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={onApplyFilters || (() => Promise.resolve())}
        columns={tableColumns}
        currentFilters={currentFilters}
      />

      <EditStructureModal
        isOpen={showEditStructureModal}
        onClose={() => setShowEditStructureModal(false)}
        columns={tableColumns}
        tableName={selectedTable || ''}
        onSave={onEditStructure || (() => Promise.resolve())}
        loading={loadingTableStructure}
      />

      {/* Delete Row Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteRowConfirm}
        onClose={() => {
          setShowDeleteRowConfirm(false);
          setRowToDelete(null);
        }}
        onConfirm={confirmDeleteRow}
        title="Delete Row"
        message={(() => {
          if (rowToDelete === null || !tableData) return '';
          const row = tableData.data[rowToDelete];
          if (!row) return '';
          
          const primaryKey = tableColumns.find(col => col.is_primary_key === 'YES') || tableColumns[0];
          const primaryKeyValue = row[primaryKey.column_name];
          
          const rowSummary = Object.entries(row)
            .filter(([key]) => key !== 'row_num')
            .slice(0, 3)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

          return `Are you sure you want to delete this row from "${selectedTable}"?\n\nRow Details:\n${rowSummary}\n\nPrimary Key: ${primaryKey.column_name} = ${primaryKeyValue}\n\n⚠️ This action cannot be undone!`;
        })()}
        confirmText="Delete Row"
        cancelText="Cancel"
        type="danger"
        requireTextInput="DELETE"
      />
    </div>
  );
};

export default TableViewer;
