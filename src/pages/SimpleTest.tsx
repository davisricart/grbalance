import React from 'react';

const SimpleTest: React.FC = () => {
  console.log('🚨 SIMPLE TEST PAGE IS RENDERING 🚨');
  
  return (
    <div style={{ padding: '50px', backgroundColor: 'yellow', color: 'black', fontSize: '24px' }}>
      <h1>🚨 SIMPLE TEST PAGE 🚨</h1>
      <p>If you can see this, React routing is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <div style={{ border: '5px solid red', padding: '20px', marginTop: '20px' }}>
        <h2>Basic Test</h2>
        <p>This is a minimal React component with no dependencies.</p>
      </div>
    </div>
  );
};

export default SimpleTest;