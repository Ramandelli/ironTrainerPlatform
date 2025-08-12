import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { storage } from './utils/storage'

// Ensure install date is set on first run (non-blocking)
storage.ensureInstallDate();

createRoot(document.getElementById("root")!).render(<App />);
