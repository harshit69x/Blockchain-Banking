function TokenCard({ vc }) {
  const { tokenId, tokenURI, isValid, isRevoked } = vc;
  
  return (
    <div className="card">
      <div className="card-header">
        <h4 style={{ margin: 0 }}>VC Token #{tokenId}</h4>
        <span className={`status-badge ${isValid ? 'valid' : 'revoked'}`}>
          {isValid ? '✓ Valid' : '✗ Revoked'}
        </span>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Token URI:</strong>
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#666', 
            wordBreak: 'break-all',
            marginTop: '5px'
          }}>
            {tokenURI}
          </div>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <strong>Status:</strong>
          <div style={{ marginTop: '5px' }}>
            {isRevoked ? (
              <span style={{ color: '#e74c3c' }}>🚫 This credential has been revoked</span>
            ) : (
              <span style={{ color: '#27ae60' }}>✅ This credential is active and valid</span>
            )}
          </div>
        </div>
        
        {tokenURI.startsWith('ipfs://') && (
          <div style={{ marginTop: '15px' }}>
            <a 
              href={`https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}
            >
              📄 View on IPFS →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default TokenCard;
