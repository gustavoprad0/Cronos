import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faHistory, faRotate } from '@fortawesome/free-solid-svg-icons';
import { apiRequest } from '../services/api';
import './Dashboard.css';

interface Automation { id: number; ativo: boolean }
interface HistoryItem { id: number; automacao_nome: string; status: string; data_inicio: string; maquina_nome?: string }

export default function Dashboard() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [machines, setMachines] = useState<{id: number; is_online: boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<Automation[]>('/automacoes'),
      apiRequest<{id: number; is_online: boolean}[]>('/maquinas'),
      apiRequest<{ items: HistoryItem[]; total: number }>('/historico?limit=5'),
    ]).then(([autos, machineList, result]) => {
      if (!active) return;
      setAutomations(autos);
      setMachines(machineList);
      setHistory(result.items);
      setTotal(result.total);
    }).catch(() => {
      if (active) setError('Não foi possível carregar o resumo. Verifique a conexão e tente novamente.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  const statuses: Record<string, string> = { sucesso: 'Concluída', erro: 'Falhou', parado: 'Interrompida', em_execucao: 'Em execução', pendente: 'Pendente' };
  const unavailable = loading || Boolean(error);
  return (
    <div className="overview">
      <header className="overview-heading">
        <div><p className="overview-eyebrow">CENTRAL DE OPERAÇÕES</p><h1>Visão geral</h1><p>O que está acontecendo nas suas automações.</p></div>
        <button type="button" className="overview-button" disabled={loading} onClick={() => setRevision(value => value + 1)}><FontAwesomeIcon icon={faRotate} spin={loading} /> Atualizar</button>
      </header>
      {error && <div className="overview-error" role="alert">{error}</div>}
      <section className="overview-metrics" aria-label="Resumo do ambiente">
        <article><div className="overview-metric-label"><FontAwesomeIcon icon={faRobot} /> Automações ativas</div><strong>{unavailable ? '—' : automations.filter(a => a.ativo).length}</strong><span>{unavailable ? 'Aguardando dados' : `${automations.length} automações cadastradas`}</span></article>
        <article><div className="overview-metric-label"><span className="overview-dot" /> Máquinas conectadas</div><strong>{unavailable ? '—' : machines.filter(m => m.is_online).length}</strong><span>{unavailable ? 'Aguardando dados' : `${machines.length} máquinas no ambiente`}</span></article>
        <article><div className="overview-metric-label"><FontAwesomeIcon icon={faHistory} /> Execuções registradas</div><strong>{unavailable ? '—' : total}</strong><span>Histórico completo do ambiente</span></article>
      </section>
      <section className="overview-activity" aria-labelledby="activity-title">
        <div className="overview-section-heading"><div><h2 id="activity-title">Últimas execuções</h2><p>Os cinco registros mais recentes do ambiente.</p></div><button type="button" className="overview-link" onClick={() => navigate('/historico')}><FontAwesomeIcon icon={faHistory} aria-hidden="true" /><span>Abrir histórico</span></button></div>
        {loading ? <div className="overview-empty" role="status"><FontAwesomeIcon icon={faRotate} spin /><h3>Carregando execuções</h3><p>Buscando as atividades do seu ambiente.</p></div> : error ? <div className="overview-empty"><h3>Resumo indisponível</h3><p>Use Atualizar para tentar novamente.</p></div> : history.length === 0 ? <div className="overview-empty"><div className="overview-empty-icon"><FontAwesomeIcon icon={faHistory} /></div><h3>Seu histórico começa aqui</h3><p>Execute uma automação para acompanhar o resultado neste espaço.</p><button type="button" className="overview-link" onClick={() => navigate('/automacoes')}><FontAwesomeIcon icon={faRobot} aria-hidden="true" /><span>Ver automações</span></button></div> : <div className="overview-table-scroll" tabIndex={0} role="region" aria-label="Últimas execuções com rolagem horizontal"><table className="overview-table"><thead><tr><th>Automação</th><th>Máquina</th><th>Resultado</th><th>Quando</th></tr></thead><tbody>{history.map(item => <tr key={item.id}><td><span className="overview-run-name">{item.automacao_nome}</span><small>Execução #{item.id}</small></td><td>{item.maquina_nome || 'Máquina indisponível'}</td><td><span className={`overview-status is-${item.status}`}><i />{statuses[item.status] || item.status}</span></td><td>{item.data_inicio ? <><span>{new Date(item.data_inicio).toLocaleDateString('pt-BR')}</span><small>{new Date(item.data_inicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</small></> : '—'}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
