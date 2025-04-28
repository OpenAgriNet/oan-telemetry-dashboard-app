
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Render the app
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

// Initialize the application
renderApp();
