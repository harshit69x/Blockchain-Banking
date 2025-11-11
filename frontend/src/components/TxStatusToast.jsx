function TxStatusToast({ type, message, hash, onClose }) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`toast ${type}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <div className="toast-header">
            {getIcon()} {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
          <div className="toast-message">{message}</div>
          {hash && (
            <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              <a 
                href={`https://etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'none' }}
              >
                View Transaction →
              </a>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#999',
            marginLeft: '10px'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default TxStatusToast;
