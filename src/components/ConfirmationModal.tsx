import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  loading?: boolean;
  requireTextInput?: string; // Text that user must type to confirm
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false,
  requireTextInput
}) => {
  console.log('ConfirmationModal render:', { isOpen, title });
  const [inputText, setInputText] = React.useState('');
  const [inputError, setInputError] = React.useState('');

  const handleConfirm = () => {
    if (requireTextInput) {
      if (inputText !== requireTextInput) {
        setInputError(`Please type "${requireTextInput}" to confirm`);
        return;
      }
    }
    onConfirm();
    setInputText('');
    setInputError('');
  };

  const handleClose = () => {
    setInputText('');
    setInputError('');
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '🚨',
          confirmClass: 'btn-danger',
          titleClass: 'text-danger'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmClass: 'btn-warning',
          titleClass: 'text-warning'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmClass: 'btn-info',
          titleClass: 'text-info'
        };
      default:
        return {
          icon: '⚠️',
          confirmClass: 'btn-warning',
          titleClass: 'text-warning'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) {
    console.log('ConfirmationModal not open, returning null');
    return null;
  }

  console.log('ConfirmationModal rendering modal with isOpen:', isOpen);

  return (
    <>
      {/* Debug indicator */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'red',
        color: 'white',
        padding: '10px',
        zIndex: 9999,
        fontSize: '12px'
      }}>
        MODAL IS RENDERING: {title}
      </div>
      
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          <div className={`confirmation-title ${styles.titleClass}`}>
            <span className="confirmation-icon">{styles.icon}</span>
            {title}
          </div>
        }
        footer={
          <>
            <button 
              onClick={handleClose} 
              className="btn btn-secondary"
              disabled={loading}
            >
              {cancelText}
            </button>
            <button 
              onClick={handleConfirm} 
              className={`btn ${styles.confirmClass}`}
              disabled={loading || (requireTextInput && inputText !== requireTextInput)}
            >
              {loading ? '⏳' : confirmText}
            </button>
          </>
        }
      >
      <div className="confirmation-content">
        <div className="confirmation-message">
          {message.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>

        {requireTextInput && (
          <div className="confirmation-input">
            <label htmlFor="confirmation-input">
              Type <strong>"{requireTextInput}"</strong> to confirm:
            </label>
            <input
              id="confirmation-input"
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setInputError('');
              }}
              className={`form-input ${inputError ? 'error' : ''}`}
              placeholder={`Type "${requireTextInput}" here`}
              autoFocus
            />
            {inputError && (
              <div className="input-error">{inputError}</div>
            )}
          </div>
        )}
      </div>
      </Modal>
    </>
  );
};

export default ConfirmationModal;
