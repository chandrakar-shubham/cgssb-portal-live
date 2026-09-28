import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { RemoteConfigProvider } from './context/RemoteConfigContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RemoteConfigProvider>
        <App />
      </RemoteConfigProvider>
    </ErrorBoundary>
  </StrictMode>,
);
