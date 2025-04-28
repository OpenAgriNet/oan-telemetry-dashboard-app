
import { createRoot } from 'react-dom/client'
import React from 'react' // Make sure React is imported
import App from './App.tsx'
import './index.css'

// Render the app
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Initialize the application
renderApp();
