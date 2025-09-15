import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showPercentage?: boolean;
  animated?: boolean;
  text?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  size = 'medium', 
  color = '#667eea',
  showPercentage = true,
  animated = true,
  text
}) => {
  const sizeClasses = {
    small: 'progress-small',
    medium: 'progress-medium',
    large: 'progress-large'
  };

  return (
    <div className="progress-container">
      {text && <div className="progress-text">{text}</div>}
      <div className={`progress-bar ${sizeClasses[size]}`}>
        <div 
          className={`progress-fill ${animated ? 'progress-animated' : ''}`}
          style={{ 
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: color
          }}
        ></div>
      </div>
      {showPercentage && (
        <div className="progress-percentage">{Math.round(progress)}%</div>
      )}
    </div>
  );
};

export default ProgressBar;
