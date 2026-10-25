import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { LangProvider } from './i18n.jsx';
import { ToastProvider } from './ui.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode><LangProvider><ToastProvider><App /></ToastProvider></LangProvider></StrictMode>,
);
