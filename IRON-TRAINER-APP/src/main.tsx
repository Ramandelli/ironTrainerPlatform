import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { storage } from './utils/storage'

// Ensure install date is set on first run (non-blocking)
storage.ensureInstallDate();

import { exerciseLibrary } from './utils/exerciseLibrary';
// Migra exercícios existentes para a biblioteca (uma vez) antes de renderizar
const boot = exerciseLibrary.migrate().catch((e) => console.error('Library migration failed', e));

boot.finally(() => createRoot(document.getElementById("root")!).render(<App />));
