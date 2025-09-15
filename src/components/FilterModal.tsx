import React, { useState, useEffect } from 'react';
import { Column } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Record<string, any>) => void;
  columns: Column[];
  currentFilters?: Record<string, any>;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  columns,
  currentFilters = {}
}) => {
  const [filters, setFilters] = useState<Record<string, any>>(currentFilters);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleFilterChange = (columnName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const handleApplyFilters = async () => {
    setIsLoading(true);
    try {
      await onApplyFilters(filters);
      onClose();
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleClose = () => {
    setFilters(currentFilters);
    onClose();
  };

  const renderFilterInput = (column: Column) => {
    const columnName = column.column_name;
    const currentValue = filters[columnName] || '';

    switch (column.data_type.toLowerCase()) {
      case 'int':
      case 'bigint':
      case 'smallint':
      case 'tinyint':
      case 'decimal':
      case 'numeric':
      case 'float':
      case 'real':
        return (
          <div className="filter-input-group">
            <input
              type="number"
              value={currentValue}
              onChange={(e) => handleFilterChange(columnName, e.target.value)}
              placeholder={`Filter ${columnName}...`}
              className="form-input"
            />
          </div>
        );

      case 'bit':
        return (
          <div className="filter-input-group">
            <select
              value={currentValue}
              onChange={(e) => handleFilterChange(columnName, e.target.value)}
              className="form-select"
            >
              <option value="">All</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        );

      case 'date':
      case 'datetime':
      case 'datetime2':
      case 'smalldatetime':
        return (
          <div className="filter-input-group">
            <input
              type="date"
              value={currentValue}
              onChange={(e) => handleFilterChange(columnName, e.target.value)}
              className="form-input"
            />
          </div>
        );

      case 'time':
        return (
          <div className="filter-input-group">
            <input
              type="time"
              value={currentValue}
              onChange={(e) => handleFilterChange(columnName, e.target.value)}
              className="form-input"
            />
          </div>
        );

      default:
        return (
          <div className="filter-input-group">
            <input
              type="text"
              value={currentValue}
              onChange={(e) => handleFilterChange(columnName, e.target.value)}
              placeholder={`Filter ${columnName}...`}
              className="form-input"
            />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h2>Filter Data</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="filters-container">
            {columns.map((column) => (
              <div key={column.column_name} className="filter-row">
                <div className="filter-column-info">
                  <label className="filter-label">
                    {column.column_name}
                    <span className="filter-type">({column.data_type})</span>
                    {column.is_nullable === 'NO' && <span className="required">*</span>}
                  </label>
                </div>
                <div className="filter-input">
                  {renderFilterInput(column)}
                </div>
              </div>
            ))}
          </div>

          <div className="filter-help">
            <strong>Filter Tips:</strong>
            <ul>
              <li>Leave fields empty to show all values</li>
              <li>Text fields support partial matching</li>
              <li>Numeric fields support exact matching</li>
              <li>Date fields support exact date matching</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            Clear All
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleApplyFilters}
            disabled={isLoading}
          >
            {isLoading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
