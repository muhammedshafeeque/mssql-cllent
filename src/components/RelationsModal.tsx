import React from 'react';
import Loader from './Loader';

interface Relation {
  foreign_key_name: string;
  parent_table: string;
  parent_column: string;
  referenced_table: string;
  referenced_column: string;
}

interface RelationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  relations: Relation[];
  loading?: boolean;
}

const RelationsModal: React.FC<RelationsModalProps> = ({
  isOpen,
  onClose,
  relations,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <div className="modal-header">
          <h3>Table Relations & Foreign Keys</h3>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <Loader type="spinner" size="large" />
              <p>Loading relations...</p>
            </div>
          ) : relations.length === 0 ? (
            <div className="no-data">
              <p>No foreign key relationships found for this table.</p>
            </div>
          ) : (
            <div className="relations-table">
              <table>
                <thead>
                  <tr>
                    <th>Foreign Key Name</th>
                    <th>Parent Table</th>
                    <th>Parent Column</th>
                    <th>Referenced Table</th>
                    <th>Referenced Column</th>
                  </tr>
                </thead>
                <tbody>
                  {relations.map((relation, index) => (
                    <tr key={index}>
                      <td>{relation.foreign_key_name}</td>
                      <td>{relation.parent_table}</td>
                      <td>{relation.parent_column}</td>
                      <td>{relation.referenced_table}</td>
                      <td>{relation.referenced_column}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationsModal;
