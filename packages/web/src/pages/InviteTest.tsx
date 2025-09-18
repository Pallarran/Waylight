import React from 'react';
import { useParams } from 'react-router-dom';

const InviteTest: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '20px',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'green' }}>✅ INVITATION PAGE IS WORKING!</h1>
      <p><strong>Token:</strong> {token}</p>
      <p>If you can see this, the routing is working correctly.</p>
      <div style={{ backgroundColor: 'white', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
        <h2>Debug Info:</h2>
        <p>Current URL: {window.location.href}</p>
        <p>Current pathname: {window.location.pathname}</p>
        <p>Token param: {token || 'NOT FOUND'}</p>
      </div>
    </div>
  );
};

export default InviteTest;