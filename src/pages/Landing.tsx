import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, CheckCircle2, Database, Lock, Package, Shield, Users } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ─── TOKENS ─── */
const C = {
  white:   "#FFFFFF",
  ink:     "#0F172A",
  hero:    "#18181B",
  footer:  "#0F172A",
  slate:   "#52525B",
  muted:   "#71717A",
  subtle:  "#A1A1AA",
  border:  "#E4E4E7",
  surface: "#FAFAFA",
  blue:    "#0EA5E9",
  blueBg:  "#F0F9FF",
  blueMid: "#0284C7",
  green:   "#16A34A",  greenBg: "#DCFCE7",  greenTx: "#15803D",
  amber:   "#D97706",  amberBg: "#FEF3C7",  amberTx: "#B45309",
  red:     "#DC2626",  redBg:   "#FEE2E2",  redTx:   "#B91C1C",
};

/* ─── MINI UI: Patrimony table ─── */
const TableUI = () => {
  const rows = [
    { num: "#0247", model: "Dell Latitude 5540",   status: "Ativo",      loc: "Sala 203",   c: C.greenTx, bg: C.greenBg },
    { num: "#0246", model: "HP EliteBook 840 G10", status: "Manutenção", loc: "TI",         c: C.amberTx, bg: C.amberBg },
    { num: "#0245", model: "Lenovo ThinkPad X1",   status: "Ativo",      loc: "Diretoria",  c: C.greenTx, bg: C.greenBg },
  ];
  return (
    <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.09), 0 4px 16px rgba(0,0,0,.05)" }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Patrimônios</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.greenTx, background: C.greenBg, borderRadius: 999, padding: "3px 11px" }}>247 ativos</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 90px", gap: 12, padding: "8px 18px", borderBottom: `1px solid ${C.border}` }}>
        {["Nº", "Modelo", "Status", "Local"].map(h => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={r.num} style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 90px", gap: 12, padding: "12px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", background: i % 2 === 0 ? C.white : C.surface }}>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: C.muted, fontWeight: 600 }}>{r.num}</span>
          <span style={{ fontSize: 12, color: C.ink, fontWeight: 500 }}>{r.model}</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: r.bg, borderRadius: 999, padding: "3px 9px", width: "fit-content" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: r.c }}>{r.status}</span>
          </div>
          <span style={{ fontSize: 11, color: C.muted }}>{r.loc}</span>
        </div>
      ))}
      <div style={{ padding: "10px 18px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Sistema online · atualizado agora</span>
      </div>
    </div>
  );
};

/* ─── MINI UI: Audit log ─── */
const AuditUI = () => {
  const logs = [
    { action: "INSERT", desc: "#0247 · Dell Latitude 5540", user: "maria@pref.gov",  time: "Agora",    c: C.greenTx, bg: C.greenBg },
    { action: "UPDATE", desc: "#0246 · Status alterado",    user: "joao@pref.gov",   time: "5m atrás", c: C.amberTx, bg: C.amberBg },
    { action: "DELETE", desc: "#0240 · Ativo removido",     user: "admin@pref.gov",  time: "1h atrás", c: C.redTx,   bg: C.redBg   },
  ];
  return (
    <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.09), 0 4px 16px rgba(0,0,0,.05)" }}>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "13px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <Shield size={13} color={C.muted} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Log de Auditoria</span>
        <div style={{ marginLeft: "auto", fontSize: 11, color: C.muted, fontWeight: 500 }}>Últimas operações</div>
      </div>
      {logs.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: i < logs.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: l.c, background: l.bg, borderRadius: 5, padding: "3px 7px", flexShrink: 0, letterSpacing: "0.05em" }}>{l.action}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.desc}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{l.user}</div>
          </div>
          <span style={{ fontSize: 10, color: C.subtle, flexShrink: 0 }}>{l.time}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── MINI UI: Multi-tenant ─── */
const TenantUI = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {[
      { name: "Prefeitura Municipal", count: 12, role: "Administrador", active: true  },
      { name: "Secretaria de Educação", count: 5, role: "Usuário",     active: false },
    ].map((o, i) => (
      <div key={o.name} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px", boxShadow: i === 0 ? "0 8px 28px rgba(0,0,0,.07)" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: i === 0 ? C.ink : C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={15} color={i === 0 ? "#fff" : C.muted} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{o.name}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{o.count} membros</div>
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: i === 0 ? C.ink : C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999, padding: "3px 10px" }}>{o.role}</div>
        </div>
        <div style={{ display: "flex" }}>
          {Array.from({ length: Math.min(o.count, 6) }).map((_, j) => (
            <div key={j} style={{ width: 24, height: 24, borderRadius: "50%", background: `hsl(${j * 55},18%,72%)`, border: `2px solid ${C.white}`, marginLeft: j > 0 ? -8 : 0, flexShrink: 0 }} />
          ))}
          {o.count > 6 && (
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.surface, border: `2px solid ${C.white}`, marginLeft: -8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 8, color: C.muted, fontWeight: 700 }}>+{o.count - 6}</span>
            </div>
          )}
        </div>
      </div>
    ))}
    <div style={{ textAlign: "center", fontSize: 11, color: C.subtle, fontWeight: 500 }}>Dados completamente isolados entre organizações</div>
  </div>
);

/* ─── FEATURES ─── */
const FEATURES = [
  {
    tag: "01 — Cadastro",
    title: "Registre qualquer ativo em segundos.",
    desc: "Formulário inteligente com validação em tempo real. Número de patrimônio, modelo, localização e responsável são capturados e associados automaticamente à empresa e ao usuário.",
    points: ["Número único por patrimônio", "Localização e status rastreados", "Responsável atribuído automaticamente"],
    Visual: TableUI,
  },
  {
    tag: "02 — Multi-tenant",
    title: "Cada empresa, seus dados. Sem exceções.",
    desc: "A arquitetura multi-tenant garante que nenhuma organização acesse os dados de outra. Administradores gerenciam membros com código de convite exclusivo e controle total de papéis.",
    points: ["Isolamento total entre empresas", "Código de convite exclusivo", "Promoção e remoção de membros"],
    Visual: TenantUI,
  },
  {
    tag: "03 — Auditoria",
    title: "Rastreabilidade automática de tudo.",
    desc: "Cada inserção, edição ou exclusão é registrada automaticamente com data, hora e usuário responsável. Histórico imutável, filtrável por período e consultável em tempo real.",
    points: ["Log gerado sem configuração", "Filtros por data e usuário", "Visível apenas para administradores"],
    Visual: AuditUI,
  },
];

/* ─── PILLARS ─── */
const PILLARS = [
  { icon: Shield,   title: "Segurança",  items: ["Autenticação via Supabase Auth", "Row Level Security (RLS)", "Dados criptografados em repouso", "Backup automático contínuo"] },
  { icon: Database, title: "Governança", items: ["Isolamento completo por empresa", "Auditoria automática de operações", "Rastreabilidade de responsáveis", "Histórico imutável de alterações"] },
  { icon: Users,    title: "Controle",   items: ["Perfis admin e usuário padrão", "Convite por código exclusivo", "Promoção e rebaixamento de funções", "Remoção segura de membros"] },
];

/* ─── LANDING ─── */
const Landing = () => {
  const navigate = useNavigate();
  useScrollReveal();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/app");
    });
  }, [navigate]);

  return (
    <div style={{ background: C.white, color: C.ink, fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif", overflowX: "hidden" }}>

      {/* ── CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
        .reveal        { opacity:0; transform:translateY(32px);  transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .reveal-left   { opacity:0; transform:translateX(-40px); transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .reveal-right  { opacity:0; transform:translateX(40px);  transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .reveal-scale  { opacity:0; transform:scale(.97);        transition:opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
        .reveal.visible,.reveal-left.visible,.reveal-right.visible,.reveal-scale.visible { opacity:1; transform:none; }
        .reveal-delay-1 { transition-delay:.08s; }
        .reveal-delay-2 { transition-delay:.18s; }
        .reveal-delay-3 { transition-delay:.28s; }
        .reveal-delay-4 { transition-delay:.38s; }
        .nav-link { background:none; border:none; cursor:pointer; font-size:14px; font-weight:500; color:${C.slate}; padding:6px 10px; border-radius:8px; transition:color .15s; font-family:inherit; text-decoration:none; }
        .nav-link:hover { color:${C.blue}; }
        .btn-primary { display:inline-flex; align-items:center; gap:8px; background:${C.white}; color:${C.ink}; font-weight:700; font-size:15px; padding:14px 28px; border-radius:12px; border:none; cursor:pointer; font-family:inherit; transition:transform .15s, box-shadow .2s; letter-spacing:-0.01em; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(0,0,0,.18); }
        .btn-ghost { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,.06); color:rgba(255,255,255,.55); font-weight:500; font-size:15px; padding:14px 28px; border-radius:12px; border:1px solid rgba(255,255,255,.1); cursor:pointer; font-family:inherit; transition:background .15s; }
        .btn-ghost:hover { background:rgba(255,255,255,.1); }
        .btn-dark { display:inline-flex; align-items:center; gap:8px; background:${C.blue}; color:#fff; font-weight:700; font-size:14px; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; font-family:inherit; transition:opacity .15s, transform .15s; letter-spacing:-0.01em; }
        .btn-dark:hover { background:${C.blueMid}; transform:translateY(-1px); }
        .feat-row { border-top: 1px solid ${C.border}; }
        .pillar-card { border-right: 1px solid rgba(255,255,255,.07); }
        .pillar-card:last-child { border-right: none; }
        .faq-item { border-bottom: 1px solid ${C.border}; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: C.ink, letterSpacing: "-0.025em" }}>AssetTrack</span>
          </div>

          <div className="hidden md:flex" style={{ gap: 2 }}>
            <button className="nav-link">Produto</button>
            <button className="nav-link">Segurança</button>
            <button className="nav-link">FAQ</button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="nav-link" onClick={() => navigate("/auth")}>Entrar</button>
            <button className="btn-dark" onClick={() => navigate("/auth")}>
              Começar grátis <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: C.hero, paddingTop: 132, paddingBottom: 100, position: "relative", overflow: "hidden" }}>
        {/* Radial highlight from top */}
        <div style={{ position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)", width: 900, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(255,255,255,.04) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 28px", textAlign: "center", position: "relative" }}>
          {/* Badge */}
          <div className="reveal" style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid rgba(14,165,233,.25)`, borderRadius: 999, padding: "7px 18px", background: "rgba(14,165,233,.08)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, flexShrink: 0, animation: "pulse 2.5s infinite" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 500, letterSpacing: "0.01em" }}>Plataforma enterprise · 100% gratuita</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="reveal reveal-delay-1" style={{ fontSize: "clamp(2.8rem, 6.5vw, 5rem)", fontWeight: 900, color: C.white, lineHeight: 1.0, letterSpacing: "-0.048em", marginBottom: 28 }}>
            Gestão de patrimônio corporativo sem complicação.
          </h1>

          {/* Subtitle */}
          <p className="reveal reveal-delay-2" style={{ fontSize: 17, color: "rgba(255,255,255,.42)", lineHeight: 1.75, maxWidth: 500, margin: "0 auto 44px", fontWeight: 400 }}>
            Cadastre, rastreie e audite ativos da sua organização com segurança, governança e isolamento total de dados.
          </p>

          {/* CTAs */}
          <div className="reveal reveal-delay-3" style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 52, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/auth")}>
              Criar conta grátis <ArrowRight size={16} />
            </button>
            <button className="btn-ghost">
              Ver como funciona
            </button>
          </div>

          {/* Trust signals */}
          <div className="reveal reveal-delay-4" style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
            {["Sem cartão de crédito", "Multi-tenant", "Auditoria automática"].map(t => (
              <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,.28)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                <CheckCircle2 size={13} color="rgba(255,255,255,.22)" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOCKUP ── */}
      <div style={{ background: `linear-gradient(to bottom, ${C.hero} 50%, ${C.white} 50%)` }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 28px" }}>
          <div className="reveal-scale" style={{ background: C.white, borderRadius: 22, overflow: "hidden", boxShadow: "0 40px 100px -20px rgba(0,0,0,.35), 0 12px 32px rgba(0,0,0,.12)", border: `1px solid ${C.border}` }}>
            {/* Window chrome */}
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", gap: 7 }}>
                {["#FF5F57", "#FFBD2E", "#28CA41"].map(c => <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />)}
              </div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 9, padding: "5px 16px", display: "flex", alignItems: "center", gap: 7, maxWidth: 300 }}>
                  <Lock size={10} color={C.muted} />
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>assettrack.app/dashboard</span>
                </div>
              </div>
            </div>

            {/* App header */}
            <div style={{ padding: "16px 26px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={15} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, letterSpacing: "-0.015em" }}>AssetTrack</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Prefeitura Municipal · 247 patrimônios</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 11, color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}>Usuários</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: C.blue, borderRadius: 7, padding: "5px 12px", cursor: "pointer" }}>+ Adicionar</div>
              </div>
            </div>

            {/* Toolbar */}
            <div style={{ padding: "10px 26px", background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, width: 280, flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <span style={{ fontSize: 11, color: C.subtle }}>Buscar por número ou modelo...</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["Todos", "Ativos", "Manutenção", "Inativos"].map((f, i) => (
                  <div key={f} style={{ fontSize: 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.blue : C.muted, background: i === 0 ? C.blueBg : "transparent", border: `1px solid ${i === 0 ? C.blue + "40" : "transparent"}`, borderRadius: 999, padding: "4px 12px", cursor: "pointer" }}>{f}</div>
                ))}
              </div>
            </div>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "84px 1fr 110px 130px 80px 48px", gap: 16, padding: "9px 26px", borderBottom: `1px solid ${C.border}` }}>
              {["Número", "Modelo", "Status", "Localização", "Responsável", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.subtle, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {[
              { num: "#0247", model: "Dell Latitude 5540",   status: "Ativo",      loc: "Sala 203",  resp: "M. Santos",  c: C.greenTx, bg: C.greenBg },
              { num: "#0246", model: "HP EliteBook 840 G10", status: "Manutenção", loc: "TI",        resp: "J. Pereira",  c: C.amberTx, bg: C.amberBg },
              { num: "#0245", model: "Lenovo ThinkPad X1",   status: "Ativo",      loc: "Diretoria", resp: "M. Santos",  c: C.greenTx, bg: C.greenBg },
              { num: "#0244", model: "Apple MacBook Pro 14", status: "Inativo",    loc: "—",         resp: "Admin",      c: C.redTx,   bg: C.redBg   },
            ].map((r, i) => (
              <div key={r.num} style={{ display: "grid", gridTemplateColumns: "84px 1fr 110px 130px 80px 48px", gap: 16, padding: "13px 26px", borderBottom: i < 3 ? `1px solid ${C.border}` : "none", alignItems: "center", background: i % 2 === 0 ? C.white : C.surface }}>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: C.muted, fontWeight: 600 }}>{r.num}</span>
                <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{r.model}</span>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: r.bg, borderRadius: 999, padding: "3px 10px", width: "fit-content" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: r.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.c }}>{r.status}</span>
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{r.loc}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{r.resp}</span>
                <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </div>
                </div>
              </div>
            ))}

            {/* Footer */}
            <div style={{ padding: "11px 26px", background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: C.muted }}>247 patrimônios · Página 1 de 10</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Sistema online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ background: C.white, padding: "80px 28px 72px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 0 }}>
            {[
              { value: "247+",  label: "Patrimônios gerenciados" },
              { value: "99.9%", label: "Disponibilidade"         },
              { value: "< 2s",  label: "Tempo de resposta"       },
              { value: "100%",  label: "Dados criptografados"    },
            ].map(({ value, label }, i) => (
              <div key={label} className={`reveal reveal-delay-${i + 1}`} style={{ textAlign: "center", padding: "32px 20px", borderLeft: i > 0 ? `1px solid ${C.border}` : undefined }}>
                <div style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 900, color: C.ink, letterSpacing: "-0.04em", marginBottom: 8 }}>{value}</div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "72px 28px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p className="reveal" style={{ fontSize: "clamp(1.6rem, 3.8vw, 2.6rem)", fontWeight: 800, color: C.ink, lineHeight: 1.25, letterSpacing: "-0.035em" }}>
            "Gestão de patrimônio não precisa ser cara, complicada ou inacessível.<br />Só precisa funcionar."
          </p>
          <p className="reveal reveal-delay-1" style={{ marginTop: 20, fontSize: 13, color: C.subtle, fontWeight: 500 }}>— Filosofia do AssetTrack</p>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="produto" style={{ background: C.white, padding: "96px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div className="reveal" style={{ marginBottom: 72 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Funcionalidades</div>
            <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.2rem)", fontWeight: 900, color: C.ink, letterSpacing: "-0.04em", lineHeight: 1.1, maxWidth: 560 }}>
              Tudo que você precisa,<br />sem o que você não precisa.
            </h2>
          </div>

          {/* Feature rows */}
          {FEATURES.map(({ tag, title, desc, points, Visual }, fi) => (
            <div key={tag} className={`feat-row grid md:grid-cols-2`} style={{ gap: "5rem", alignItems: "center", padding: "72px 0" }}>
              <div className="reveal-left">
                <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>{tag}</div>
                <h3 style={{ fontSize: "clamp(1.4rem,2.8vw,2rem)", fontWeight: 800, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 18 }}>{title}</h3>
                <p style={{ fontSize: 15, color: C.slate, lineHeight: 1.75, marginBottom: 28 }}>{desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {points.map(pt => (
                    <div key={pt} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 size={15} color={C.blue} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.slate, fontWeight: 500 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="reveal-right">
                <Visual />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section id="seguranca" style={{ background: C.ink, padding: "96px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 64, maxWidth: 600 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.28)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Enterprise</div>
            <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.2rem)", fontWeight: 900, color: C.white, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 20 }}>
              Segurança e governança desde a arquitetura.
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,.38)", lineHeight: 1.7 }}>
              Projetado para conformidade institucional com isolamento total entre organizações.
            </p>
          </div>

          <div className="grid md:grid-cols-3" style={{ borderTop: "1px solid rgba(255,255,255,.07)", marginTop: 8 }}>
            {PILLARS.map(({ icon: Icon, title, items }, i) => (
              <div key={title} className={`reveal reveal-delay-${i + 1} pillar-card`} style={{ padding: "44px 36px 44px 0", paddingLeft: i > 0 ? 36 : 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(14,165,233,.12)", border: "1px solid rgba(14,165,233,.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                  <Icon size={18} color={C.blue} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 20, letterSpacing: "-0.015em" }}>{title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <CheckCircle2 size={13} color={C.blue} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ background: C.white, padding: "96px 28px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, color: C.ink, letterSpacing: "-0.04em", lineHeight: 1.1 }}>Dúvidas frequentes</h2>
          </div>

          {[
            { q: "O AssetTrack é gratuito?",                          a: "Sim. O plano atual é 100% gratuito. Crie sua conta e comece a usar imediatamente, sem cartão de crédito." },
            { q: "Quantas empresas posso criar?",                     a: "Cada conta pode ser vinculada a uma única empresa. Para criar uma nova organização, utilize uma conta diferente." },
            { q: "Meus dados ficam isolados de outras organizações?", a: "Sim. A arquitetura multi-tenant garante que cada empresa veja exclusivamente seus próprios dados, sem exceções." },
            { q: "Como funciona o controle de acesso?",               a: "Administradores gerenciam a equipe via código de convite exclusivo e podem promover, rebaixar ou remover membros a qualquer momento." },
            { q: "Preciso instalar algum software?",                  a: "Não. O AssetTrack roda integralmente no navegador, em qualquer dispositivo com acesso à internet." },
          ].map(({ q, a }, i) => (
            <div key={q} className={`faq-item reveal reveal-delay-${(i % 3) + 1}`} style={{ padding: "26px 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 10, letterSpacing: "-0.01em" }}>{q}</div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.75 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: C.ink, padding: "128px 28px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div className="reveal">
            <h2 style={{ fontSize: "clamp(2.6rem,7vw,5rem)", fontWeight: 900, color: C.white, letterSpacing: "-0.05em", lineHeight: 1.0, marginBottom: 28 }}>
              Comece agora.<br />É gratuito.
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.38)", marginBottom: 52, lineHeight: 1.7 }}>
              Sem instalação. Sem cartão de crédito.<br />Configure sua organização em minutos.
            </p>
            <button onClick={() => navigate("/auth")} className="btn-primary" style={{ padding: "17px 36px", fontSize: 16, borderRadius: 14 }}>
              Criar conta grátis <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.footer, borderTop: "1px solid rgba(255,255,255,.05)", padding: "36px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(14,165,233,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={13} color={C.blue} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.35)", letterSpacing: "-0.01em" }}>AssetTrack</span>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.18)" }}>© 2026 AssetTrack. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
