import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faRobot, faBolt, faClockRotateLeft, faEllipsis, faDesktop, faUsers, faXmark, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const destinations = [
  { id: 'dashboard', label: 'Início', path: '/dashboard', icon: faHouse },
  { id: 'automation-cadastro', label: 'Automações', path: '/automacoes', icon: faRobot },
  { id: 'automation-trigger', label: 'Gatilhos', path: '/gatilhos', icon: faBolt },
  { id: 'automation-history', label: 'Histórico', path: '/historico', icon: faClockRotateLeft },
];

export default function MobileNavigation({ activeItem }: { activeItem?: string }) {
  const { canManageUsers } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const extras = [
    { id: 'automation-machines', label: 'Máquinas', description: 'Gerencie seus agentes de execução', path: '/maquinas', icon: faDesktop },
    ...(canManageUsers ? [{ id: 'settings-access', label: 'Usuários', description: 'Contas e permissões de acesso', path: '/usuarios', icon: faUsers }] : []),
  ];
  const moreActive = extras.some(item => item.id === activeItem);

  useEffect(() => {
    if (!moreOpen) return;
    const sheet = sheetRef.current;
    sheet?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const query = window.matchMedia('(min-width: 769px)');
    const closeOnDesktop = () => { if (query.matches) setMoreOpen(false); };
    query.addEventListener('change', closeOnDesktop);
    return () => {
      sheet?.close();
      document.body.style.overflow = previous;
      query.removeEventListener('change', closeOnDesktop);
    };
  }, [moreOpen]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, path: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMoreOpen(false);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0 });
    }
  }

  return <>
    <nav className="mobile-navigation" aria-label="Navegação principal no celular">
      {destinations.map(item => <a key={item.id} href={item.path} onClick={event => navigate(event, item.path)} aria-current={activeItem === item.id ? 'page' : undefined}><span className="mobile-navigation-icon"><FontAwesomeIcon icon={item.icon} aria-hidden="true" /></span><span>{item.label}</span></a>)}
      <button type="button" ref={moreRef} onClick={() => setMoreOpen(true)} className={moreActive ? 'is-active' : undefined} aria-label="Mais módulos" aria-haspopup="dialog" aria-expanded={moreOpen} aria-controls="mobile-modules"><span className="mobile-navigation-icon"><FontAwesomeIcon icon={faEllipsis} aria-hidden="true" /></span><span>Mais</span></button>
    </nav>
    <dialog ref={sheetRef} id="mobile-modules" className="mobile-modules" aria-labelledby="mobile-modules-title" onCancel={() => setMoreOpen(false)} onClose={() => { setMoreOpen(false); moreRef.current?.focus(); }} onClick={event => { if (event.target === event.currentTarget) setMoreOpen(false); }}>
      <div className="mobile-modules-content"><div className="mobile-sheet-handle" aria-hidden="true" /><header><div><span>SEU AMBIENTE</span><h2 id="mobile-modules-title">Mais módulos</h2></div><button type="button" onClick={() => setMoreOpen(false)} aria-label="Fechar módulos"><FontAwesomeIcon icon={faXmark} /></button></header>
        <nav aria-label="Outros módulos">{extras.map(item => <a key={item.id} href={item.path} onClick={event => navigate(event, item.path)} aria-current={activeItem === item.id ? 'page' : undefined}><span className="mobile-module-icon"><FontAwesomeIcon icon={item.icon} /></span><span><strong>{item.label}</strong><small>{item.description}</small></span><FontAwesomeIcon icon={faChevronRight} /></a>)}</nav>
      </div>
    </dialog>
  </>;
}
