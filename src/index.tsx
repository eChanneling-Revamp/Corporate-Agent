import './index.css';
import { createRoot } from 'react-dom/client';
import { App } from "./App";
import { AppStateProvider } from './store/AppState';
import { ToastProvider } from './store/Toast';

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');
const root = createRoot(container);
root.render(
  <ToastProvider>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </ToastProvider>
);