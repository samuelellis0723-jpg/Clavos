import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

import measureTapeUrl from '../assets/editorial/cinta-metrica.webp';

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, user, authNotice, setAuthNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const destination = location.state?.from?.pathname || '/app';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      setPassword('');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="wrap" style={{ paddingBlock: '4rem' }}>
        <div className="section-block">
          <div className="section-body" style={{ padding: '2.5rem 1.5rem' }}>
            <span className="eyebrow">SESIÓN ACTIVA EN MEMORIA</span>
            <h1 className="h-section" style={{ marginTop: '0.4rem' }}>
              Sesión iniciada como {user.full_name}
            </h1>
            <p style={{ marginTop: '0.5rem', color: 'var(--steel)' }}>
              Tu token opaco Bearer se encuentra activo en la memoria de la aplicación (<code>{user.email}</code>).
            </p>
            <div className="btn-group" style={{ marginTop: '1.25rem' }}>
              <Link to="/app" className="btn btn-primary pill">
                Ir al panel operativo
              </Link>
              <Link to="/catalog" className="btn btn-secondary pill">
                Explorar catálogo público
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-grid">
      {/* PANEL VISUAL EDITORIAL */}
      <aside className="auth-visual" aria-hidden="true">
        <img
          src={measureTapeUrl}
          alt=""
          width="896"
          height="1200"
        />
        <div className="auth-visual-copy">
          <span className="eyebrow on-dark" style={{ color: 'var(--signal-on-dark)' }}>
            Consola Operativa Segura
          </span>
          <h1 className="display display-l">
            Control integral del abastecimiento.
          </h1>
          <p>
            Acceso al circuito de requisiciones, aprobaciones, órdenes de compra, recepciones, inventario y finanzas. Autenticación verificada por <code>scrypt</code> con tokens opacos en memoria.
          </p>
          <div className="mono" style={{ fontSize: '0.74rem', color: '#a8adb5' }}>
            Sin cookies inseguras · Sin contraseñas demo precargadas · Auditoría por paso
          </div>
        </div>
      </aside>

      {/* PANEL DE FORMULARIO */}
      <div className="auth-panel">
        <div className="auth-card">
          <div>
            <span className="eyebrow">Acceso Privado</span>
            <h2 className="display" style={{ fontSize: '2rem', marginTop: '0.35rem' }}>
              Iniciar sesión
            </h2>
            <p style={{ color: 'var(--steel)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
              Ingresa tus credenciales corporativas habilitadas en MySQL.
            </p>
          </div>

          {authNotice ? (
            <div className="alert-banner alert-warning" role="status">
              <div className="alert-title">Aviso de sesión</div>
              <div className="alert-body">{authNotice}</div>
              <div style={{ marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary pill"
                  onClick={() => setAuthNotice(null)}
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : null}

          <ErrorAlert
            error={error}
            title="No fue posible iniciar sesión"
            onDismiss={() => setError(null)}
          />

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="login-email" className="form-label">
                Correo corporativo (email)
              </label>
              <input
                id="login-email"
                type="email"
                required
                maxLength={180}
                autoComplete="username"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@ferreteriaclavos.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                required
                maxLength={1024}
                autoComplete="current-password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <span className="form-helper">
                Tras 5 intentos fallidos consecutivos, el acceso se bloquea por 15 minutos.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg pill"
                disabled={submitting}
              >
                {submitting ? 'Verificando credenciales...' : 'Ingresar al sistema'}
              </button>
              <Link to="/catalog" className="btn btn-ghost pill">
                ← Continuar en catálogo público
              </Link>
            </div>
          </form>

          {/* AYUDA TÉCNICA DE APROVISIONAMIENTO CLI */}
          <details className="help-details">
            <summary>
              <span>¿Cómo habilitar un operador en tu entorno?</span>
              <ChevronDown />
            </summary>
            <div className="help-body">
              <p>
                Por seguridad, no existen cuentas predeterminadas. Un operador se habilita desde la terminal del backend conectada a MySQL:
              </p>
              <pre>
{`cd backend
npm run access:provision < /ruta/privada/acceso.json`}
              </pre>
              <p style={{ fontSize: '0.78rem' }}>
                Roles disponibles: <code>admin</code>, <code>requester</code>, <code>buyer</code>, <code>warehouse</code>, <code>finance</code>, <code>analyst</code>.
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
