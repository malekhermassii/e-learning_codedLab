import React from 'react';
import AuthDebug from './AuthDebug';

const DebugPage = () => {
  return (
    <div>
      <h1>Page de débogage</h1>
      <p>Cette page sert à diagnostiquer les problèmes d'authentification.</p>
      
      <AuthDebug />
    </div>
  );
};

export default DebugPage; 