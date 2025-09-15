import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'table' | 'card' | 'list';
  rows?: number;
  columns?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'text', 
  rows = 3, 
  columns = 4 
}) => {
  const renderTextSkeleton = () => (
    <div className="skeleton-text">
      {Array.from({ length: rows }).map((_, index) => (
        <div 
          key={index} 
          className={`skeleton-line ${index === rows - 1 ? 'skeleton-line-short' : ''}`}
        ></div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="skeleton-table-cell"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton-table-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="skeleton-card">
      <div className="skeleton-card-header"></div>
      <div className="skeleton-card-content">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="skeleton-line"></div>
        ))}
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-line-short"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'table':
        return renderTableSkeleton();
      case 'card':
        return renderCardSkeleton();
      case 'list':
        return renderListSkeleton();
      default:
        return renderTextSkeleton();
    }
  };

  return (
    <div className="skeleton-container">
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;
