import { usePreference } from '../../hooks/usePreference';
import { useEffect, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faRightFromBracket, faMoon, faSun, faHouse } from '@fortawesome/free-solid-svg-icons';
import './Layout.css';
import '../../styles/workspace.css';

interface LayoutProps {
  children: ReactNode;
  activeItem?: string;
  onNavigate?: (id: string) => void;
}

export default function Layout({ children, activeItem, onNavigate }: LayoutProps) {
  const [collapsed, setCollapsed] = usePreference('menu.collapsed', false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const profileRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) profileRef.current.open = false;
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && profileRef.current?.open) {
        profileRef.current.open = false;
        profileRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onEscape);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', onEscape); };
  }, []);

  return (
    <div className={`layout${collapsed ? ' layout--collapsed' : ''}`}>
      <Sidebar
        activeItem={activeItem}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <main className="layout-main">
        <header className="workspace-header">
          <span className="mobile-workspace-brand">Cronos<span>Orquestrador</span></span>
          <a className="workspace-home" href="/dashboard" aria-label="Ir para a página inicial" aria-current={activeItem === 'dashboard' ? 'page' : undefined} onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (window.location.pathname !== '/dashboard') {
              window.history.pushState({}, '', '/dashboard');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}><FontAwesomeIcon icon={faHouse} aria-hidden="true" /><span>Início</span></a>

          <div className="workspace-account">
            <button className="workspace-theme" type="button" onClick={toggleTheme} aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'} title="Trocar tema"><FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} /></button>
            <div className="account-block">
              <details className="profile-menu" ref={profileRef}>
                <summary aria-label="Ver dados do perfil">
                  <span className="account-avatar" aria-hidden="true">{(user?.nome || 'U').split(' ').filter(Boolean).slice(0,2).map(part => part[0]).join('')}</span>
                  <span className="profile-identity"><strong>{user?.nome || 'Usuário'}</strong><small>{user?.role === 'admin' ? 'Administrador' : 'Operador'}</small></span>
                  <FontAwesomeIcon className="profile-chevron" icon={faChevronDown} />
                </summary>
                <div className="profile-popover"><span className="profile-popover-label">CONECTADO COMO</span><strong>{user?.nome}</strong><span>{user?.email}</span>{user?.username && <small>@{user.username}</small>}<button className="profile-signout" type="button" onClick={() => logout()}><FontAwesomeIcon icon={faRightFromBracket} /><span>Sair da conta</span></button></div>
              </details>
            </div>
          </div>
        </header>
        {children}
      </main>
      <MobileNavigation activeItem={activeItem} />
    </div>
  );
}
