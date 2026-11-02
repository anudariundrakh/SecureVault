import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const emptyItem = {
  name: "",
  username: "",
  password: "",
  url: "",
  notes: "",
};

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M7.5 10V7.75a4.5 4.5 0 0 1 9 0V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="15" r="1.25" fill="currentColor" />
        </svg>
      </span>
      <span>SecureVault</span>
    </div>
  );
}

function Icon({ name }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    search: <path d="m21 21-4.4-4.4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeoff: <><path d="m3 3 18 18" /><path d="M10.6 6.2A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a14.4 14.4 0 0 1-2.1 2.7M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9.4 9.4 0 0 0 3.8-.8" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M15 8l3 3M17 6l3 3" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17a8 8 0 0 0 13.7-5M4 17v-5h5M20 7A8 8 0 0 0 6.3 12" /></>,
  };

  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const token = sessionStorage.getItem("securevault_token");
    const user = sessionStorage.getItem("securevault_user");
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  if (!session) {
    return <AuthScreen onAuthenticated={setSession} />;
  }

  return <VaultScreen session={session} onLogout={() => {
    sessionStorage.removeItem("securevault_token");
    sessionStorage.removeItem("securevault_user");
    setSession(null);
  }} />;
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = mode === "login"
        ? await api.login(email, password)
        : await api.register(email, password);

      sessionStorage.setItem("securevault_token", data.token);
      sessionStorage.setItem("securevault_user", JSON.stringify(data.user));
      onAuthenticated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-frame">
        <header className="auth-topline">
          <Logo />
          <span className="auth-security-note"><Icon name="shield" /> Local-first security mindset</span>
        </header>

        <section className="auth-stage">
          <div className="auth-intro">
            <span className="eyebrow">Secure workspace</span>
            <h1>Keep the important things private.</h1>
            <p>One calm place for credentials, protected with modern password hashing and authenticated encryption.</p>

            <div className="trust-row">
              <span><Icon name="shield" /> AES-256-GCM vault encryption</span>
              <span><Icon name="key" /> Argon2id password hashing</span>
            </div>
          </div>

          <div className="auth-card">
            <span className="eyebrow">{mode === "login" ? "Welcome back" : "Create account"}</span>
            <h2>{mode === "login" ? "Open your vault" : "Create your vault"}</h2>
            <p className="muted auth-subtitle">
              {mode === "login"
                ? "Sign in to continue to your private workspace."
                : "Use a strong password with at least 12 characters."}
            </p>

            <form onSubmit={submit} className="form-stack">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <div className="input-with-action">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={mode === "register" ? 12 : undefined}
                    required
                  />
                  <button type="button" className="icon-button" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                    <Icon name={showPassword ? "eyeoff" : "eye"} />
                  </button>
                </div>
              </label>

              {error && <div className="error-message">{error}</div>}

              <button className="primary-button full-width" disabled={loading}>
                {loading ? "Working…" : mode === "login" ? "Continue" : "Create account"}
              </button>
            </form>

            <p className="switch-copy">
              {mode === "login" ? "New to SecureVault?" : "Already have an account?"}
              <button className="text-button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
                {mode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </section>

        <footer className="auth-footnote">SecureVault · Your credentials stay encrypted at rest.</footer>
      </div>
    </main>
  );
}

function VaultScreen({ session, onLogout }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await api.getItems();
      setItems(data.items);
    } catch (err) {
      if (err.status === 401) onLogout();
      else showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function saveItem(item, id) {
    const data = id ? await api.updateItem(id, item) : await api.createItem(item);
    setItems((current) => id
      ? current.map((entry) => entry.id === id ? data.item : entry)
      : [data.item, ...current]
    );
    setModal(null);
    showToast(id ? "Credential updated" : "Credential added");
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this credential? This cannot be undone.")) return;
    await api.deleteItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
    showToast("Credential deleted");
  }

  async function copy(text, label = "Copied") {
    await navigator.clipboard.writeText(text);
    showToast(label);
  }

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      [item.name, item.username, item.url].some((value) =>
        String(value || "").toLowerCase().includes(normalized)
      )
    );
  }, [items, query]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Logo /></div>

        <nav className="sidebar-nav" aria-label="SecureVault navigation">
          <button className="sidebar-link active"><Icon name="key" /><span>Vault</span></button>
          <button className="sidebar-link" onClick={() => setModal({ type: "generator" })}><Icon name="refresh" /><span>Generator</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-security">
            <span className="status-dot" />
            <div><strong>Vault protected</strong><span>AES-256-GCM</span></div>
          </div>
          <div className="sidebar-account">
            <div className="account-avatar">{initials(session.user.email)}</div>
            <div className="account-copy"><strong>{session.user.email}</strong><span>Signed in</span></div>
            <button className="icon-button sidebar-logout" onClick={onLogout} aria-label="Sign out"><Icon name="logout" /></button>
          </div>
        </div>
      </aside>

      <header className="mobile-topbar">
        <Logo />
        <button className="icon-button bordered" onClick={onLogout} aria-label="Sign out"><Icon name="logout" /></button>
      </header>

      <main className="dashboard">
        <section className="dashboard-heading">
          <div>
            <span className="eyebrow">Private workspace</span>
            <h1>Vault</h1>
            <p className="muted">Your saved logins, organized and encrypted.</p>
          </div>
          <button className="primary-button" onClick={() => setModal({ type: "edit", item: null })}>
            <Icon name="plus" /> New credential
          </button>
        </section>

        <section className="security-strip" aria-label="Vault summary">
          <div><span>Saved</span><strong>{items.length} {items.length === 1 ? "credential" : "credentials"}</strong></div>
          <div><span>Encryption</span><strong>AES-256-GCM</strong></div>
          <button onClick={() => setModal({ type: "generator" })}><span>Password tool</span><strong>Generate securely <Icon name="refresh" /></strong></button>
        </section>

        <section className="vault-section">
          <div className="section-toolbar">
            <div>
              <h2>Credentials</h2>
              <p className="muted">{filteredItems.length} {filteredItems.length === 1 ? "result" : "results"}</p>
            </div>
            <div className="search-box">
              <Icon name="search" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your vault" />
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><div className="spinner" /><p>Opening your vault…</p></div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Icon name="key" /></span>
              <h3>{items.length ? "No matching credentials" : "Your vault is ready"}</h3>
              <p>{items.length ? "Try another search." : "Add your first login and keep everything organized in one place."}</p>
              {!items.length && <button className="secondary-button" onClick={() => setModal({ type: "edit", item: null })}>Add first credential</button>}
            </div>
          ) : (
            <div className="credential-list">
              {filteredItems.map((item) => (
                <article className="credential-card" key={item.id}>
                  <div className="credential-avatar">{initials(item.name)}</div>
                  <div className="credential-main">
                    <div className="credential-title-row">
                      <div>
                        <h3>{item.name}</h3>
                        <span>{item.username}</span>
                      </div>
                      <div className="card-actions">
                        <button className="icon-button bordered" onClick={() => setModal({ type: "edit", item })} aria-label="Edit credential"><Icon name="edit" /></button>
                        <button className="icon-button bordered danger" onClick={() => deleteItem(item.id)} aria-label="Delete credential"><Icon name="trash" /></button>
                      </div>
                    </div>

                    <div className="password-row">
                      <code>{revealed[item.id] ? item.password : "••••••••••••••••"}</code>
                      <div>
                        <button className="icon-button" onClick={() => setRevealed((current) => ({ ...current, [item.id]: !current[item.id] }))} aria-label="Toggle password visibility"><Icon name={revealed[item.id] ? "eyeoff" : "eye"} /></button>
                        <button className="icon-button" onClick={() => copy(item.password, "Password copied")} aria-label="Copy password"><Icon name="copy" /></button>
                      </div>
                    </div>

                    {item.url && <a className="credential-url" href={normalizeUrl(item.url)} target="_blank" rel="noreferrer">{item.url}</a>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {modal?.type === "edit" && (
        <CredentialModal item={modal.item} onClose={() => setModal(null)} onSave={saveItem} />
      )}
      {modal?.type === "generator" && (
        <GeneratorModal onClose={() => setModal(null)} onCopy={copy} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function CredentialModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item ? {
    name: item.name || "",
    username: item.username || "",
    password: item.password || "",
    url: item.url || "",
    notes: item.notes || "",
  } : emptyItem);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form, item?.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function generate() {
    update("password", generatePassword(20, true, true, true, true));
    setShowPassword(true);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <div><span className="eyebrow">Vault item</span><h2>{item ? "Edit credential" : "Add credential"}</h2></div>
          <button className="icon-button bordered" onClick={onClose}><Icon name="close" /></button>
        </div>

        <form onSubmit={submit} className="form-stack modal-form">
          <div className="form-grid two">
            <label><span>Name</span><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="GitHub" required /></label>
            <label><span>Website</span><input value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="github.com" /></label>
          </div>
          <label><span>Username or email</span><input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="you@example.com" required /></label>
          <label>
            <span>Password</span>
            <div className="input-with-action double-action">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required />
              <div>
                <button type="button" className="mini-text-button" onClick={generate}>Generate</button>
                <button type="button" className="icon-button" onClick={() => setShowPassword((v) => !v)}><Icon name={showPassword ? "eyeoff" : "eye"} /></button>
              </div>
            </div>
          </label>
          <label><span>Secure note <em>optional</em></span><textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Recovery email, account notes…" /></label>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={saving}>{saving ? "Saving…" : item ? "Save changes" : "Add to vault"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GeneratorModal({ onClose, onCopy }) {
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [nonce, setNonce] = useState(0);
  const password = useMemo(() => generatePassword(length, options.upper, options.lower, options.numbers, options.symbols), [length, options, nonce]);

  function toggle(key) {
    setOptions((current) => {
      const next = { ...current, [key]: !current[key] };
      return Object.values(next).some(Boolean) ? next : current;
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card generator-modal">
        <div className="modal-header">
          <div><span className="eyebrow">Security tool</span><h2>Password generator</h2></div>
          <button className="icon-button bordered" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="generated-password">
          <code>{password}</code>
          <div className="generated-actions">
            <button className="icon-button bordered" onClick={() => setNonce((n) => n + 1)} aria-label="Generate another password"><Icon name="refresh" /></button>
            <button className="icon-button bordered" onClick={() => onCopy(password, "Generated password copied")} aria-label="Copy password"><Icon name="copy" /></button>
          </div>
        </div>

        <div className="range-row">
          <div><span>Length</span><strong>{length}</strong></div>
          <input type="range" min="12" max="40" value={length} onChange={(e) => setLength(Number(e.target.value))} />
        </div>

        <div className="toggle-grid">
          {[["upper", "Uppercase"], ["lower", "Lowercase"], ["numbers", "Numbers"], ["symbols", "Symbols"]].map(([key, label]) => (
            <button key={key} className={`toggle-card ${options[key] ? "active" : ""}`} onClick={() => toggle(key)}>
              <span>{label}</span><span className="switch"><i /></span>
            </button>
          ))}
        </div>

        <button className="primary-button full-width" onClick={() => onCopy(password, "Generated password copied")}>Copy password</button>
      </div>
    </div>
  );
}

function generatePassword(length, upper, lower, numbers, symbols) {
  const groups = [];
  if (upper) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (lower) groups.push("abcdefghijklmnopqrstuvwxyz");
  if (numbers) groups.push("0123456789");
  if (symbols) groups.push("!@#$%^&*()-_=+[]{};:,.?");

  const pool = groups.join("");
  const result = [];

  for (const group of groups) {
    result.push(group[secureIndex(group.length)]);
  }

  while (result.length < length) {
    result.push(pool[secureIndex(pool.length)]);
  }

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = secureIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join("");
}

function secureIndex(max) {
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return array[0] % max;
}

function initials(name) {
  return String(name || "SV").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default App;
