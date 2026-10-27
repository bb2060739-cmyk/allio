import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initAutoTranslate } from './utils/autoTranslate';

// Initialize zero-cost automated on-the-fly DOM translation
initAutoTranslate();

createRoot(document.getElementById('root')!).render(<App />);
