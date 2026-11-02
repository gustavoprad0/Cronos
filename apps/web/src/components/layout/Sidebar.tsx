import { usePreference } from '../../hooks/usePreference';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';


/* ─── Inline SVG icons (no external deps) ─── */

function IconDashboard() {
    return (
        <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

function IconAutomation() {
    return (
        <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
    );
}

function IconSettings() {
    return (
        <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z" />
        </svg>
    );
}

function IconChevronLeft() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

function IconChevronDown() {
    return (
        <svg className="sidebar-submenu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function IconMenu() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    );
}

/* ─── Nav items config with submenus ─── */

interface SubmenuItem {
    id: string;
    label: string;
}

interface NavItem {
    id: string;
    label: string;
    Icon: () => ReactNode;
    children?: SubmenuItem[];
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
    {
        id: 'automations',
        label: 'Automações',
        Icon: IconAutomation,
        children: [
            { id: 'automation-cadastro', label: 'Cadastro de Automações' },
            { id: 'automation-trigger', label: 'Gatilhos' },
            { id: 'automation-machines', label: 'Cadastro de Máquinas' },
            { id: 'automation-history', label: 'Histórico' },
        ],
    },
    {
        id: 'settings',
        label: 'Configurações',
        Icon: IconSettings,
        children: [
            { id: 'settings-access', label: 'Usuários e Permissões' },
        ],
    },
];

/* ─── Sidebar component ─── */

interface SidebarProps {
    activeItem?: string;
    onNavigate?: (id: string) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function Sidebar({
    activeItem = 'dashboard',
    onNavigate,
    collapsed = false,
    onToggleCollapse,
}: SidebarProps) {
    const { canManageUsers } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = usePreference<string[]>('menu.expandedGroups', [], (value): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string' && navItems.some(group => group.id === item)));

    useEffect(() => {
        const group = navItems.find(item => item.children?.some(child => child.id === activeItem));
        if (group) {
            setExpandedMenus(current => current.includes(group.id) ? current : [...current, group.id]);
        }
    }, [activeItem]);

    useEffect(() => {
        if (!mobileOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileOpen(false);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [mobileOpen]);

    const filteredNavItems = navItems.map((item) => {
        if (!item.children) return item;
        const filteredChildren = item.children.filter((child) => {
            if (child.id === 'settings-access') {
                return canManageUsers;
            }
            return true;
        });
        return { ...item, children: filteredChildren };
    });

    const handleNav = (id: string) => {
        onNavigate?.(id);

        if (id === 'dashboard') {
            setMobileOpen(false);
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    };

    const handleSubmenuNav = (id: string) => {
        handleNav(id);
        setMobileOpen(false);

        if (id === 'automation-cadastro' || id === 'automation-tests') {
            window.history.pushState({}, '', '/automacoes');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
        if (id === 'automation-trigger') {
            window.history.pushState({}, '', '/gatilhos');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
        if (id === 'automation-machines') {
            window.history.pushState({}, '', '/maquinas');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
        if (id === 'automation-history') {
            window.history.pushState({}, '', '/historico');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
        if (id === 'settings-access') {
            window.history.pushState({}, '', '/usuarios');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    };

    const toggleSubmenu = (id: string) => {
        setExpandedMenus((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    };

    return (
        <>
            {/* Mobile toggle */}
            <button
                className="sidebar-mobile-toggle"
                onClick={() => {
                    if (!mobileOpen && collapsed) onToggleCollapse?.();
                    setMobileOpen(!mobileOpen);
                }}
                aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={mobileOpen}
                aria-controls="main-navigation"
            >
                <IconMenu />
            </button>

            <aside id="main-navigation" className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' open' : ''}`}>
                {/* Logo — centralizado */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-img-wrap">
                        <img src="/icone.jpg" alt="Cronos" />
                    </div>
                    <div className="sidebar-logo-text">
                        <span className="logo-name">Cronos</span>
                        <span className="logo-subtitle">Orquestrador</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {filteredNavItems.map(({ id, label, Icon, children }) => {
                        const isGroupActive =
                            activeItem === id || (children && children.some((c) => c.id === activeItem));
                        const isExpanded = expandedMenus.includes(id) && !collapsed;

                        return (
                            <div
                                className={`sidebar-nav-group${isExpanded ? ' expanded' : ''}`}
                                key={id}
                            >
                                <button
                                    className={`sidebar-nav-item${isGroupActive ? ' active' : ''}`}
                                    onClick={() => {
                                        handleNav(id);
                                        if (children) {
                                            if (collapsed) {
                                                onToggleCollapse?.();
                                                setExpandedMenus([id]);
                                            } else {
                                                toggleSubmenu(id);
                                            }
                                        }
                                    }}
                                    data-tooltip={label}
                                    aria-expanded={children ? isExpanded : undefined}
                                >
                                    <Icon />
                                    <span className="sidebar-nav-label">{label}</span>
                                    {children && <IconChevronDown />}
                                </button>

                                {children && !collapsed && isExpanded && (
                                    <div className="sidebar-submenu">
                                        {children.map((child) => (
                                            <button
                                                className={`sidebar-submenu-item${activeItem === child.id ? ' active' : ''}`}
                                                key={child.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSubmenuNav(child.id);
                                                }}
                                            >
                                                <span className="sidebar-submenu-bullet" />
                                                <span>{child.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Botão de recolher/expandir integrado dentro do menu */}

                <div className="sidebar-collapse-wrapper">
                    <button
                        className="sidebar-collapse-button"
                        onClick={onToggleCollapse}
                        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
                        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
                    >
                        <span className="sidebar-collapse-icon-wrap">
                            <IconChevronLeft />
                        </span>
                        <span className="sidebar-collapse-label">Recolher menu</span>
                    </button>
                </div>

                {/* Footer — centralizado com versão em destaque branco */}
                <div className="sidebar-footer">
                    <span className="sidebar-version">Cronos v1.0.0</span>
                </div>
            </aside>

            {/* Mobile overlay */}
            <div
                className="sidebar-overlay"
                onClick={() => setMobileOpen(false)}
                style={{ display: mobileOpen ? 'block' : undefined }}
            />
        </>
    );
}
