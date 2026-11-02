import { FormEvent, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

type AuthPageProps = {
  onAuthenticated?: () => void;
};

const brandMessages = [
  {
    eyebrow: 'Orquestre o que importa',
    title: 'Menos tarefas soltas.',
    emphasis: 'Mais tempo para criar.',
    description: 'Um espaço inteligente para conectar processos, automatizar rotinas e acompanhar o trabalho em movimento.',
  },
  {
    eyebrow: 'Dê ritmo às suas ideias',
    title: 'Clareza para avançar.',
    emphasis: 'Consistência para crescer.',
    description: 'Transforme planos em passos possíveis e mantenha cada parte do seu trabalho no mesmo compasso.',
  },
  {
    eyebrow: 'Seu trabalho, no seu tempo',
    title: 'O próximo passo',
    emphasis: 'começa aqui.',
    description: 'Crie uma rotina mais leve, conecte o que importa e abra espaço para o que realmente pede sua atenção.',
  },
];


export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const { login } = useAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [activeMessage, setActiveMessage] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inactivityNotice, setInactivityNotice] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('cronos_logout_reason') === 'inactivity') {
      setInactivityNotice(true);
      sessionStorage.removeItem('cronos_logout_reason');
    }
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;
    const carouselTimer = window.setInterval(() => {
      setActiveMessage((currentMessage) => (currentMessage + 1) % brandMessages.length);
    }, 6000);

    return () => window.clearInterval(carouselTimer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setAuthError('');
    setIsSubmitting(true);

    try {
      await login(normalizedEmail, password, rememberMe);
      onAuthenticated?.();
    } catch (err: any) {
      setAuthError(err.message || 'Falha ao autenticar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main className="auth-page">
        <button type="button" className="auth-theme-toggle" onClick={toggleTheme} aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}><FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} /> <span>{theme === 'light' ? 'Tema escuro' : 'Tema claro'}</span></button>
      <section className="brand-panel" aria-label="Sobre o Cronos">
        <div className="brand-panel__glow brand-panel__glow--top" />
        <div className="brand-panel__glow brand-panel__glow--bottom" />
        <header className="brand-lockup">
          <BrandMark size="small" />
          <span className="brand-lockup__copy">
            <span className="brand-lockup__name">Cronos</span>
            <span className="brand-lockup__tagline">Orquestrador de automações</span>
          </span>
        </header>
        <div key={activeMessage} className="brand-panel__content brand-message" aria-live="off">
          <p className="eyebrow">{brandMessages[activeMessage].eyebrow}</p>
          <h1>
            {brandMessages[activeMessage].title} <em>{brandMessages[activeMessage].emphasis}</em>
          </h1>
          <p className="brand-panel__description">{brandMessages[activeMessage].description}</p>
        </div>
        <div className="brand-panel__carousel-controls" aria-label="Mensagens do Cronos">
          {brandMessages.map((message, index) => (
            <button
              className={`carousel-dot ${activeMessage === index ? 'is-active' : ''}`}
              key={message.eyebrow}
              onClick={() => setActiveMessage(index)}
              aria-label={`Mostrar mensagem ${index + 1}`}
              aria-current={activeMessage === index ? 'true' : undefined}
              type="button"
            />
          ))}
        </div>
      </section>

      <section className="form-panel">

        <div className="form-panel__inner">
          {isRecovering ? <section className="access-recovery" aria-labelledby="recover-title"><span className="form-heading__kicker">RECUPERAR ACESSO</span><h2 id="recover-title">Vamos recuperar<br />seu acesso.</h2><p>Seu acesso é gerenciado pela equipe responsável pelo Cronos.</p><div className="recovery-instructions"><span className="recovery-step">01</span><div><strong>Fale com o administrador</strong><p>Informe o e-mail ou nome de usuário da sua conta e solicite uma nova senha.</p></div><span className="recovery-step">02</span><div><strong>Entre com a nova senha</strong><p>Assim que receber a senha, volte para esta tela e acesse sua conta normalmente.</p></div></div><button className="submit-button recovery-back" type="button" onClick={() => setIsRecovering(false)}>Voltar ao login</button><p className="recovery-footnote">Não compartilhe sua senha com outras pessoas.</p></section> : <>

          <div className="form-heading">
            <span className="form-heading__kicker">SEU ACESSO AO CRONOS</span>
            <h2>Bem-vindo de volta.</h2>
            <p>Acesse sua conta para acompanhar suas automações.</p>
          </div>

          {inactivityNotice && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '0.82rem',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ display: 'block', color: '#fecaca', marginBottom: '2px' }}>
                Sessão encerrada por inatividade:
              </strong>
              Você esteve sem interação por mais de 2 horas. Por segurança, realize o login novamente.
            </div>
          )}

          <div className="auth-mode-content">
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>E-mail ou usuário</span>
                <input
                  type="text"
                  name="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setAuthError('');
                  }}
                  placeholder="E-mail ou nome de usuário"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label-row">
                  <span>Senha</span>
                </span>
                <span className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setAuthError('');
                    }}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    minLength={6}
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                  >
                    <svg className={`password-eye${showPassword ? ' is-visible' : ''}`} key={String(showPassword)} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="eye-outline" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle className="eye-pupil" cx="12" cy="12" r="3" />{!showPassword && <path className="eye-slash" d="m4 4 16 16" />}</svg>
                  </button>
                </span>
              </label>

              <div className="auth-options"><label className="check-row remember-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="switch-track" aria-hidden="true" />
                <span>Manter minha sessão ativa</span>
              </label><button className="forgot-link" type="button" onClick={() => setIsRecovering(true)}>Esqueceu a senha?<FontAwesomeIcon icon={faArrowRight} aria-hidden="true" /></button></div>

              {authError && <p className="auth-error" role="alert">{authError}</p>}
              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Acessando...' : 'Acessar'}

              </button>
            </form>
          </div>

          </> }
        </div>
      </section>
    </main>
  );
}
