import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SelectionTimerProvider } from './contexts/SelectionTimerContext';
import App from './App';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-sans-sc';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SelectionTimerProvider>
          <App />
        </SelectionTimerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
