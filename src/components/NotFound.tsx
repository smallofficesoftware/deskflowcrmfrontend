import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 style={{ fontSize: '3rem', color: '#ff6b6b' }}>404</h1>
      <p style={{ fontSize: '1.5rem', color: '#555' }}>Page Not Found</p>
      <Link to="/" style={{ fontSize: '1rem', color: '#007bff', textDecoration: 'none' }}>
        Go Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
