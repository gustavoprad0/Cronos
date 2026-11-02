import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AuthPage from '../pages/AuthPage';
import Layout from '../components/layout/Layout';
import { BrandMark } from '../components/BrandMark';
import '../styles/theme.css';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const OrchestratorScreen = lazy(() => import('../pages/OrchestratorScreen').then(module => ({ default: module.OrchestratorScreen })));
const Gatilhos = lazy(() => import('../pages/Gatilhos'));
const Maquinas = lazy(() => import('../pages/Maquinas'));
const Historico = lazy(() => import('../pages/Historico'));
const Usuarios = lazy(() => import('../pages/Usuarios'));

function getPathname() {
  return window.location.pathname.replace(/\/$/, '') || '/';
}

function AppRouter() {
  const [pathname, setPathname] = useState(getPathname);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    function handlePopState() {
      setPathname(getPathname());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090a0f',
          color: '#94a3b8',
          gap: '16px',
        }}
      >
        <BrandMark size="large" />
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Carregando Cronos...</p>
      </div>
    );
  }

  // Se não estiver autenticado, qualquer rota direciona para autenticação segura
  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuthenticated={() => {
          window.history.pushState({}, '', '/dashboard');
          setPathname('/dashboard');
        }}
      />
    );
  }

  const route = pathname === '/orquestrador' || pathname === '/automacoes'
    ? { active: 'automation-cadastro', Page: OrchestratorScreen }
    : pathname === '/gatilhos' ? { active: 'automation-trigger', Page: Gatilhos }
    : pathname === '/maquinas' ? { active: 'automation-machines', Page: Maquinas }
    : pathname === '/historico' ? { active: 'automation-history', Page: Historico }
    : pathname === '/usuarios' || pathname === '/acessos' ? { active: 'settings-access', Page: Usuarios }
    : { active: 'dashboard', Page: Dashboard };
  const Page = route.Page;
  return <Layout activeItem={route.active}>
    <Suspense fallback={<div className="module-loading" role="status"><span className="module-loading-line" /><span className="module-loading-card" /><span className="module-loading-card" /><span className="module-loading-caption">Carregando módulo...</span></div>}>
      <Page />
    </Suspense>
  </Layout>;
}

export default function Routes() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
