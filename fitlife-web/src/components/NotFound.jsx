import React from 'react';

const NotFound = () => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light" style={{ background: 'linear-gradient(135deg, #f8ffae 0%, #43c6ac 100%)' }}>
      <div className="card shadow p-5 border-0 text-center" style={{ maxWidth: 400 }}>
        <img src="src/assets/logo.png" alt="Not Found" width="160" className="mb-4 mx-auto" />
        <h1 className="display-3 fw-bold mb-3 text-danger">404</h1>
        <h2 className="mb-2">Page Not Found</h2>
        <p className="text-muted mb-4">Sorry, the page you are looking for does not exist.</p>
        <a href="/" className="btn btn-primary btn-lg">Go Home</a>
      </div>
    </div>
  );
};

export default NotFound;