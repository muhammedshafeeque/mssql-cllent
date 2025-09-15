import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  type?: 'spinner' | 'dots' | 'pulse' | 'bars';
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  color = '#667eea', 
  text,
  type = 'spinner' 
}) => {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };

  const renderSpinner = () => (
    <div className={`loader-spinner ${sizeClasses[size]}`} style={{ borderTopColor: color }}>
      <div className="spinner-inner"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`loader-dots ${sizeClasses[size]}`}>
      <div className="dot" style={{ backgroundColor: color }}></div>
      <div className="dot" style={{ backgroundColor: color }}></div>
      <div className="dot" style={{ backgroundColor: color }}></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`loader-pulse ${sizeClasses[size]}`} style={{ backgroundColor: color }}></div>
  );

  const renderBars = () => (
    <div className={`loader-bars ${sizeClasses[size]}`}>
      <div className="bar" style={{ backgroundColor: color }}></div>
      <div className="bar" style={{ backgroundColor: color }}></div>
      <div className="bar" style={{ backgroundColor: color }}></div>
      <div className="bar" style={{ backgroundColor: color }}></div>
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'bars':
        return renderBars();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="loader-container">
      {renderLoader()}
      {text && <div className="loader-text" style={{ color }}>{text}</div>}
    </div>
  );
};

export default Loader;
