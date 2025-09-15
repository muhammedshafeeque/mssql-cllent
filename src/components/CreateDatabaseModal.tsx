import React, { useState } from 'react';
import Modal from './Modal';

interface CreateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dbName: string) => void;
}

const CreateDatabaseModal: React.FC<CreateDatabaseModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [dbName, setDbName] = useState('');

  const handleCreate = () => {
    if (dbName.trim()) {
      onCreate(dbName.trim());
      setDbName('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Database"
      footer={
        <>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            className="btn btn-primary"
          >
            Create
          </button>
        </>
      }
    >
      <div className="form-group">
        <label htmlFor="new-db-name">Database Name</label>
        <input
          type="text"
          id="new-db-name"
          value={dbName}
          onChange={(e) => setDbName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter database name"
        />
      </div>
    </Modal>
  );
};

export default CreateDatabaseModal;
