import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Routes from './routes';
import './styles/theme.css';
import { initializeTheme } from './hooks/useTheme';

initializeTheme();

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <Routes />
        </StrictMode>
    );
}
