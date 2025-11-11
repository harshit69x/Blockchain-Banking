function AddressBadge({ address }) {
  const shortAddress = `${address.substring(0, 6)}...${address.substring(38)}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
  };

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '8px 16px',
        background: '#f0f0f0',
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer'
      }}
      onClick={copyToClipboard}
      title={address}
    >
      <span>🔑</span>
      <span>{shortAddress}</span>
    </div>
  );
}

export default AddressBadge;
