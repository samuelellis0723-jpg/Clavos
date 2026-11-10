import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../features/AuthContext.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

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
      <div className="section-block">
        <div className="section-body">
          <span className="folio-num">SESIÓN ACTIVA EN MEMORIA</span>
          <h1 style={{ fontSize: '1.4rem', marginTop: '0.35rem' }}>
            Sesión iniciada como {user.full_name} ({user.email})
          </h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--ink-secondary)' }}>
            Tu token opaco Bearer ya se encuentra activo en memoria de la aplicación.
          </p>
          <div className="btn-group" style={{ marginTop: '1rem' }}>
            <Link to="/app" className="btn btn-primary">
              Ir al panel operativo
            </Link>
            <Link to="/catalog" className="btn btn-secondary">
              Ver catálogo público
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="page-masthead" aria-labelledby="login-heading">
        <div className="page-masthead-primary">
          <span className="folio-num">ACCESO PRIVADO — POST /api/auth/login</span>
          <h1 id="login-heading" className="page-title">
            Inicio de Sesión Operativo
          </h1>
          <p className="page-description">
            Acceso al circuito interno de requisiciones, aprobaciones, órdenes de compra, recepciones, inventario, facturas, pagos y administración de maestros.
          </p>
        </div>

        <div className="page-masthead-meta">
          <div>
            <span className="folio-num">ARQUITECTURA DE SESIÓN</span>
            <p style={{ marginTop: '0.35rem', color: 'var(--ink-secondary)', fontSize: '0.825rem' }}>
              El servidor emite un token aleatorio opaco de 64 caracteres hexadecimales (<code>Bearer</code>) y almacena únicamente su hash SHA-256 en MySQL. El token se conserva en memoria de React; al recargar la página o expirar, deberás autenticarte de nuevo.
            </p>
          </div>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
            Sin registro público | Sin cuentas demo preinstaladas
          </div>
        </div>
      </section>

      {authNotice ? (
        <div className="alert-banner alert-warning" role="status">
          <div className="alert-title">Aviso de sesión</div>
          <div className="alert-body">{authNotice}</div>
          <div style={{ marginTop: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
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

      <div className="swiss-grid swiss-grid-asymmetric">
        <section className="swiss-cell" aria-labelledby="credentials-form-title">
          <span className="folio-num">CREDENCIALES VERIFICADAS POR SCRYPT</span>
          <h2 id="credentials-form-title" style={{ fontSize: '1.2rem' }}>
            Ingresar al Sistema
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="form-field">
              <label htmlFor="login-email" className="form-label">
                Correo electrónico corporativo (email)
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
                placeholder="usuario@dominio"
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Contraseña (password)
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
                placeholder="Ingresa tu contraseña habilitada"
              />
              <span className="form-helper">
                Tras 5 intentos fallidos consecutivos, la credencial se bloquea temporalmente por 15 minutos. El servidor también limita intentos por IP (HTTP 429).
              </span>
            </div>

            <div className="btn-group" style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Verificando credenciales...' : 'Iniciar sesión'}
              </button>
              <Link to="/catalog" className="btn btn-secondary">
                Continuar en catálogo público
              </Link>
            </div>
          </form>
        </section>

        <aside className="swiss-cell swiss-cell-canvas" aria-labelledby="provisioning-help-title">
          <span className="folio-num">PROCEDIMIENTO ADMINISTRATIVO CLI</span>
          <h2 id="provisioning-help-title" style={{ fontSize: '1.1rem' }}>
            ¿Cómo habilitar una cuenta en tu entorno local?
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            Por seguridad, no existen usuarios de prueba con contraseñas fijas ni endpoints públicos de registro. Un operador habilita cuentas desde la terminal del backend conectada a MySQL:
          </p>
          <pre
            className="mono"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--grid-hairline)',
              padding: '0.75rem',
              fontSize: '0.75rem',
              overflowX: 'auto',
              margin: 0,
            }}
          >
{`cd backend
npm run access:provision < /ruta/privada/acceso.json`}
          </pre>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
            Roles técnicos reconocidos por el recorrido: <code>admin</code>, <code>requester</code>, <code>buyer</code>, <code>warehouse</code>, <code>finance</code>, <code>analyst</code>, además de cualquier rol específico asignado en una regla de aprobación (<code>approval_rules</code>).
          </p>
        </aside>
      </div>
    </div>
  );
}
