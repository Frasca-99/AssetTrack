import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Bot, Zap, Shield, BarChart3, Clock, Users,
  ArrowRight, CheckCircle2, TrendingUp, Activity, Cpu, Database,
} from "lucide-react";
import logo from "@/assets/patrimony-logo.png";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const BG = "linear-gradient(145deg,#010307 0%,#020810 30%,#030d1a 60%,#020609 100%)";
const GRID = {
  backgroundImage: `linear-gradient(rgba(34,211,238,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.07) 1px,transparent 1px),linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)`,
  backgroundSize: "48px 48px, 48px 48px, 240px 240px, 240px 240px",
};

/* ── Wireframe 3D ── */
const WireframeShape = ({ size = 140, color = "#818cf8", revDir = false }: { size?: number; color?: string; revDir?: boolean }) => (
  <div style={{ width: size, height: size, perspective: 600 }}>
    <div className="w-full h-full" style={{ transformStyle: "preserve-3d", animation: `${revDir ? "spinYReverse" : "spinY"} 20s linear infinite` }}>
      <svg viewBox="0 0 200 200" fill="none" width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <circle cx="100" cy="100" r="90" stroke={color} strokeWidth="0.8" opacity="0.6" />
        <ellipse cx="100" cy="100" rx="90" ry="26" stroke={color} strokeWidth="0.7" opacity="0.45" />
        <ellipse cx="100" cy="63"  rx="72" ry="20" stroke={color} strokeWidth="0.7" opacity="0.35" />
        <ellipse cx="100" cy="137" rx="72" ry="20" stroke={color} strokeWidth="0.7" opacity="0.35" />
        {[0,36,72,108,144].map(a => <ellipse key={a} cx="100" cy="100" rx="90" ry="28" stroke={color} strokeWidth="0.6" opacity="0.28" transform={`rotate(${a} 100 100)`} />)}
        <polygon points="100,10 175,145 25,145" stroke={color} strokeWidth="0.6" opacity="0.2" fill="none" />
        <polygon points="100,190 25,55 175,55"  stroke={color} strokeWidth="0.6" opacity="0.2" fill="none" />
        <polygon points="10,100 145,25 145,175" stroke={color} strokeWidth="0.5" opacity="0.15" fill="none" />
      </svg>
    </div>
  </div>
);

/* ── Glass stat card ── */
const GlassCard = ({ icon: Icon, label, value, sub, accentColor, className = "", delay = 0 }: {
  icon: any; label: string; value: string; sub?: string; accentColor: string; className?: string; delay?: number;
}) => (
  <div className={`absolute rounded-2xl p-4 ${className}`} style={{
    background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.1)", boxShadow: `0 8px 32px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.08),0 0 20px ${accentColor}20`,
    animation: `floatUp ${3.5 + delay * 0.8}s ease-in-out infinite`, animationDelay: `${delay}s`, minWidth: 140,
  }}>
    <div className="flex items-center gap-2 mb-2">
      <div className="rounded-lg p-1.5" style={{ background: `${accentColor}25` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
      </div>
      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
    </div>
    <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
    {sub && <div className="text-xs mt-1 font-medium" style={{ color: accentColor }}>{sub}</div>}
  </div>
);

/* ── Central glass panel ── */
const CentralPanel = () => {
  const bars = [38,55,45,72,50,88,64,78,55,70,92,68];
  return (
    <div className="rounded-3xl overflow-hidden" style={{
      width: 400, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.1),0 0 60px rgba(99,102,241,0.15)",
      animation: "floatUp 5s ease-in-out infinite", animationDelay: "0.5s",
    }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: "0 0 8px #4ade80" }} />
          <span className="text-sm font-semibold text-white">Painel de Controle</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>Ao vivo</span>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[{l:"Ativos",v:"1.248",c:"#e2e8f0"},{l:"Manutenção",v:"34",c:"#fb923c"},{l:"Finalizados",v:"987",c:"#4ade80"}].map(({l,v,c})=>(
            <div key={l} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</div>
              <div className="text-base font-bold" style={{ color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Atividade Mensal</span>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "#22d3ee" }} />
          </div>
          <div className="flex items-end gap-0.5 h-16">
            {bars.map((h,i)=>(
              <div key={i} className="flex-1 rounded-sm animate-bar-grow" style={{
                height:`${h}%`, animationDelay:`${i*0.06}s`,
                background: i===bars.length-2 ? "linear-gradient(to top,#6366f1,#22d3ee)" : `rgba(99,102,241,${0.18+i*0.045})`,
                boxShadow: i===bars.length-2 ? "0 0 8px rgba(34,211,238,0.5)" : "none",
              }}/>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Recentes</div>
          {[{num:"#0142",model:"Dell Inspiron 15",dot:"#4ade80",st:"Finalizada"},{num:"#0141",model:"HP EliteBook 840",dot:"#fb923c",st:"Manutenção"},{num:"#0140",model:"Lenovo ThinkPad X",dot:"#22d3ee",st:"Entregue"}].map(({num,model,dot,st})=>(
            <div key={num} className="flex items-center gap-2">
              <span className="text-[9px] w-9" style={{color:"rgba(255,255,255,0.3)"}}>{num}</span>
              <span className="text-[9px] flex-1 truncate" style={{color:"rgba(255,255,255,0.65)"}}>{model}</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{background:dot,boxShadow:`0 0 6px ${dot}`}}/>
                <span className="text-[9px]" style={{color:"rgba(255,255,255,0.4)"}}>{st}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Hero visual ── */
const HeroVisual = () => (
  <div className="relative flex items-center justify-center" style={{ minHeight: 480, width: "100%" }}>
    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 65% 55% at 50% 50%,rgba(99,102,241,0.18) 0%,rgba(34,211,238,0.06) 55%,transparent 75%)" }} />
    <div className="absolute -top-6 -right-6 opacity-55 pointer-events-none"><WireframeShape size={120} color="#818cf8" /></div>
    <div className="absolute bottom-0 -left-10 opacity-45 pointer-events-none"><WireframeShape size={90} color="#22d3ee" revDir /></div>
    <GlassCard icon={Activity} label="CPU Usage"    value="68%"   sub="↑ 4%"  accentColor="#818cf8" className="top-2 -left-6 z-20"    delay={0}   />
    <GlassCard icon={Database} label="Total Ativos" value="1.248" sub="+12%"  accentColor="#4ade80" className="-top-8 right-2 z-20"    delay={1.2} />
    <GlassCard icon={Cpu}      label="Manutenção"   value="34"    sub="-3%"   accentColor="#fb923c" className="bottom-10 -left-4 z-20" delay={0.6} />
    <div className="relative z-10"><CentralPanel /></div>
  </div>
);

const features = [
  { icon: Bot,       title: "Assistente IA (Beta)",  desc: "Chatbot inteligente para auxiliar no cadastro e gestão dos seus patrimônios"   },
  { icon: Zap,       title: "Gestão Rápida",         desc: "Cadastre e gerencie patrimônios em segundos com nossa interface intuitiva"      },
  { icon: Shield,    title: "Seguro e Confiável",    desc: "Dados protegidos com criptografia de ponta a ponta e backup automático"         },
  { icon: BarChart3, title: "Relatórios Detalhados", desc: "Métricas e indicadores em tempo real sobre todos os seus ativos"               },
  { icon: Users,     title: "Multi-usuário",         desc: "Controle de acesso por perfis e permissões para toda a equipe"                 },
  { icon: Clock,     title: "Histórico Completo",    desc: "Todo o histórico de manutenções e movimentações dos equipamentos"              },
];

const stats = [
  { value: "1.200+", label: "Patrimônios gerenciados" },
  { value: "99.9%",  label: "Uptime garantido"        },
  { value: "< 2s",   label: "Tempo de resposta"       },
  { value: "100%",   label: "Dados criptografados"    },
];

/* ── Page ── */
const Landing = () => {
  const navigate = useNavigate();
  useScrollReveal();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/app");
    });
  }, [navigate]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: BG, position: "relative" }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)", backgroundSize: "100% 4px", mixBlendMode: "multiply" }} />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b" style={{ background: "rgba(1,3,7,0.92)", borderColor: "rgba(34,211,238,0.12)" }}>
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="AssetTrack" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-lg tracking-tight text-white">AssetTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[["funcionalidades","Funcionalidades"],["quem-somos","Quem Somos"],["diferenciais","Diferenciais"]].map(([id,label])=>(
              <button key={id} onClick={()=>scrollTo(id)} className="text-sm font-medium transition-colors" style={{ color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={e=>(e.currentTarget.style.color="#fff")} onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.55)")}>
                {label}
              </button>
            ))}
          </div>
          <Button onClick={()=>navigate("/auth")} className="text-white border-0 font-semibold"
            style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}>
            Começar Agora
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={GRID} />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(29,78,216,0.32)" }} />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(34,211,238,0.15)" }} />
        <div className="absolute bottom-1/4 left-1/5 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(99,102,241,0.22)" }} />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(6,182,212,0.08)" }} />
        {[
          {top:"15%",left:"10%",s:3,c:"#818cf8",d:0},{top:"30%",left:"85%",s:2,c:"#22d3ee",d:0.5},
          {top:"65%",left:"15%",s:4,c:"#a78bfa",d:1},{top:"75%",left:"70%",s:2,c:"#6366f1",d:1.5},
          {top:"20%",left:"60%",s:3,c:"#22d3ee",d:2},{top:"45%",left:"5%",s:2,c:"#38bdf8",d:0.8},
          {top:"55%",left:"90%",s:3,c:"#c084fc",d:1.3},{top:"10%",left:"45%",s:2,c:"#34d399",d:2.2},
        ].map(({top,left,s,c,d},i)=>(
          <div key={i} className="absolute rounded-full pointer-events-none" style={{ top, left, width:s+1, height:s+1, background:c, boxShadow:`0 0 ${s*5}px ${s*2}px ${c}55`, animation:`floatUp ${3+d}s ease-in-out infinite`, animationDelay:`${d}s` }} />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg,transparent 0%,rgba(99,102,241,0.7) 30%,rgba(34,211,238,0.8) 60%,rgba(99,102,241,0.4) 80%,transparent 100%)", boxShadow: "0 0 12px rgba(34,211,238,0.4)" }} />

        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center min-h-[540px]">
          <div className="reveal-left">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-full mb-7"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", backdropFilter: "blur(8px)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: "0 0 6px #22d3ee" }} />
              Sistema em produção — 100% gratuito
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
              <span className="text-white">Gestão de Patrimônio</span><br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Simples e Eficiente
              </span>
            </h1>
            <p className="text-lg mb-10 leading-relaxed max-w-lg" style={{ color: "#cbd5e1" }}>
              Controle total sobre os computadores e equipamentos da sua organização. Rastreie, gerencie e otimize seus ativos em um único lugar.
            </p>
            <div className="flex gap-4 flex-wrap items-center">
              <Button onClick={()=>navigate("/auth")} size="lg" className="h-12 px-8 text-base font-semibold text-white border-0"
                style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", boxShadow:"0 8px 32px rgba(99,102,241,0.4),0 2px 8px rgba(34,211,238,0.2)" }}>
                Começar Gratuitamente <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg" onClick={()=>scrollTo("funcionalidades")} className="h-12 px-8 text-base border"
                style={{ color:"rgba(255,255,255,0.85)", borderColor:"rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.06)", backdropFilter:"blur(8px)" }}>
                Saiba Mais
              </Button>
            </div>
            <div className="flex items-center gap-5 mt-8 flex-wrap">
              {["Sem cartão de crédito","Setup em minutos","Dados seguros"].map(t=>(
                <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color:"rgba(255,255,255,0.6)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />{t}
                </div>
              ))}
            </div>
          </div>
          <div className="reveal-right"><HeroVisual /></div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 px-6 relative" style={{ borderTop: "1px solid rgba(34,211,238,0.1)", borderBottom: "1px solid rgba(34,211,238,0.1)", background: "rgba(0,0,0,0.28)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({value,label}, i)=>(
            <div key={label} className={`text-center reveal reveal-delay-${i+1}`}>
              <div className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {value}
              </div>
              <div className="text-sm" style={{ color:"rgba(255,255,255,0.65)" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" className="py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={GRID} />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-14 reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Funcionalidades Poderosas</h2>
            <p style={{ color:"#22d3ee" }}>Tudo que você precisa para gerenciar patrimônios de forma eficiente</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({icon:Icon,title,desc}, i)=>(
              <div key={title} className={`group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 reveal reveal-delay-${i+1}`}
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(12px)", boxShadow:"0 4px 24px rgba(0,0,0,0.2)" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.border="1px solid rgba(99,102,241,0.4)";(e.currentTarget as HTMLElement).style.boxShadow="0 8px 40px rgba(99,102,241,0.2)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.border="1px solid rgba(255,255,255,0.08)";(e.currentTarget as HTMLElement).style.boxShadow="0 4px 24px rgba(0,0,0,0.2)";}}>
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                  style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.2),rgba(34,211,238,0.15))", border:"1px solid rgba(99,102,241,0.25)" }}>
                  <Icon className="h-5 w-5" style={{ color:"#818cf8" }} />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-white">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:"rgba(255,255,255,0.72)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quem Somos ── */}
      <section id="quem-somos" className="py-24 px-6 relative" style={{ background:"rgba(0,0,0,0.28)", borderTop:"1px solid rgba(34,211,238,0.1)" }}>
        <div className="max-w-3xl mx-auto text-center reveal">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Quem Somos</h2>
          <p className="text-lg leading-relaxed" style={{ color:"rgba(255,255,255,0.75)" }}>
            O <strong className="text-white">AssetTrack</strong> é uma solução moderna para gestão de patrimônio,
            desenvolvida para organizações que precisam de controle eficiente sobre seus equipamentos e ativos.
            Nossa plataforma simplifica o processo de cadastro, rastreamento e manutenção de ponta a ponta.
          </p>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section id="diferenciais" className="py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={GRID} />
        <div className="relative max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-white reveal">Por que o AssetTrack?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {title:"Interface Intuitiva", desc:"Desenhada para ser usada por qualquer pessoa, sem treinamento técnico"},
              {title:"Dados em Nuvem",      desc:"Acesse seus patrimônios de qualquer lugar, a qualquer hora, em qualquer dispositivo"},
              {title:"Suporte Dedicado",    desc:"Equipe disponível para ajudar na implantação, configuração e uso diário"},
            ].map(({title,desc},i)=>(
              <div key={title} className={`text-center px-4 reveal reveal-delay-${i+1}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white font-bold text-lg mb-5"
                  style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", boxShadow:"0 8px 24px rgba(99,102,241,0.35)" }}>
                  {i+1}
                </div>
                <h3 className="font-semibold text-xl mb-3 text-white">{title}</h3>
                <p className="leading-relaxed" style={{ color:"rgba(255,255,255,0.72)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como Funciona ── */}
      <section className="py-24 px-6 relative" style={{ background:"rgba(0,0,0,0.28)", borderTop:"1px solid rgba(34,211,238,0.1)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Como Funciona</h2>
            <p style={{ color:"#22d3ee" }}>Três passos simples para começar a gerenciar seus ativos</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Linha conectora */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px" style={{ background:"linear-gradient(90deg,rgba(99,102,241,0.4),rgba(34,211,238,0.4))" }} />
            {[
              { step:"01", title:"Crie sua conta",       desc:"Cadastre-se gratuitamente em menos de 2 minutos. Sem cartão de crédito necessário.",          icon:"🔐" },
              { step:"02", title:"Cadastre seus ativos", desc:"Adicione os equipamentos da sua organização com número, modelo, status e localização.",       icon:"📦" },
              { step:"03", title:"Gerencie em tempo real",desc:"Acompanhe manutenções, histórico e relatórios diretamente no painel de controle.",          icon:"📊" },
            ].map(({step,title,desc,icon},i)=>(
              <div key={step} className={`relative text-center reveal reveal-delay-${i+1}`}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 text-3xl"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(99,102,241,0.3)", boxShadow:"0 0 24px rgba(99,102,241,0.15)" }}>
                  {icon}
                </div>
                <div className="text-xs font-bold mb-2 tracking-widest" style={{ color:"#22d3ee" }}>PASSO {step}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color:"rgba(255,255,255,0.65)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preview do Sistema ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={GRID} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(99,102,241,0.07)" }} />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-14 reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Veja na Prática</h2>
            <p style={{ color:"#22d3ee" }}>Uma interface pensada para produtividade e clareza</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="reveal-left space-y-6">
              {[
                { title:"Cadastro rápido",      desc:"Adicione um novo patrimônio em menos de 30 segundos com nosso formulário inteligente.",         color:"#818cf8" },
                { title:"Busca instantânea",    desc:"Encontre qualquer equipamento pelo número de patrimônio em tempo real.",                         color:"#22d3ee" },
                { title:"Status visual",        desc:"Identifique de relance o estado de cada ativo com indicadores coloridos e claros.",               color:"#4ade80" },
                { title:"Exportação de dados",  desc:"Exporte relatórios completos para análise e controle administrativo.",                           color:"#fb923c" },
              ].map(({title,desc,color},i)=>(
                <div key={title} className="flex gap-4 items-start">
                  <div className="w-1 h-12 rounded-full flex-shrink-0 mt-1" style={{ background:color, boxShadow:`0 0 12px ${color}` }} />
                  <div>
                    <h3 className="font-semibold text-white mb-1">{title}</h3>
                    <p className="text-sm" style={{ color:"rgba(255,255,255,0.6)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="reveal-right rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 24px 80px rgba(0,0,0,0.5)", background:"rgba(255,255,255,0.03)" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.2)" }}>
                <div className="flex gap-1.5">{["#f87171","#facc15","#4ade80"].map(c=><div key={c} className="w-2.5 h-2.5 rounded-full" style={{background:c,opacity:0.7}}/>)}</div>
                <span className="text-xs ml-2" style={{ color:"rgba(255,255,255,0.35)" }}>Sistema de Patrimônios</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:"rgba(99,102,241,0.2)" }}>💻</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Dell Inspiron 15</div>
                    <div className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>Patrimônio #0142</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full" style={{background:"rgba(74,222,128,0.15)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.3)"}}>Finalizada</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:"rgba(251,146,60,0.2)" }}>🖥️</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">HP EliteBook 840</div>
                    <div className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>Patrimônio #0141</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full" style={{background:"rgba(251,146,60,0.15)",color:"#fb923c",border:"1px solid rgba(251,146,60,0.3)"}}>Manutenção</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background:"rgba(34,211,238,0.2)" }}>⌨️</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Lenovo ThinkPad X1</div>
                    <div className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>Patrimônio #0140</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-full" style={{background:"rgba(34,211,238,0.15)",color:"#22d3ee",border:"1px solid rgba(34,211,238,0.3)"}}>Entregue</div>
                </div>
                <div className="mt-2 pt-3" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex justify-between text-xs mb-2" style={{color:"rgba(255,255,255,0.4)"}}>
                    <span>Progresso do mês</span><span>78%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{background:"rgba(255,255,255,0.08)"}}>
                    <div className="h-1.5 rounded-full w-[78%]" style={{background:"linear-gradient(90deg,#6366f1,#22d3ee)"}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section className="py-24 px-6 relative" style={{ background:"rgba(0,0,0,0.28)", borderTop:"1px solid rgba(34,211,238,0.1)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">O que dizem sobre nós</h2>
            <p style={{ color:"#22d3ee" }}>Experiências reais de quem usa o AssetTrack</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name:"Carlos Silva",    role:"Gestor de TI",          org:"Prefeitura Municipal",  text:"O AssetTrack transformou nossa gestão de equipamentos. Antes levávamos horas para localizar um patrimônio, agora é questão de segundos." },
              { name:"Ana Rodrigues",  role:"Coordenadora Administrativa", org:"Secretaria de Educação", text:"Interface simples e intuitiva. Consegui treinar toda a equipe em menos de uma tarde. Recomendo fortemente." },
              { name:"Roberto Lima",   role:"Analista de Infraestrutura", org:"Hospital Regional",   text:"A visualização em tempo real e os filtros de status nos ajudam a priorizar as manutenções corretamente." },
            ].map(({name,role,org,text},i)=>(
              <div key={name} className={`rounded-2xl p-6 reveal reveal-delay-${i+1}`}
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(12px)" }}>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_,j)=><span key={j} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color:"rgba(255,255,255,0.72)" }}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)" }}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{name}</div>
                    <div className="text-xs" style={{color:"rgba(255,255,255,0.45)"}}>{role} · {org}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={GRID} />
        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-14 reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">Dúvidas Frequentes</h2>
            <p style={{ color:"#22d3ee" }}>Tudo que você precisa saber antes de começar</p>
          </div>
          <div className="space-y-4">
            {[
              { q:"O AssetTrack é realmente gratuito?",                 a:"Sim! O plano atual é 100% gratuito. Crie sua conta e comece a usar imediatamente, sem cartão de crédito." },
              { q:"Preciso instalar algum software?",                   a:"Não. O AssetTrack roda direto no navegador. Funciona em qualquer dispositivo com acesso à internet." },
              { q:"Meus dados ficam seguros?",                         a:"Sim. Utilizamos Supabase com criptografia de ponta a ponta e backups automáticos. Seus dados nunca são compartilhados." },
              { q:"Posso ter vários usuários na mesma organização?",    a:"Sim! O sistema suporta múltiplos usuários com diferentes níveis de acesso (admin e usuário padrão)." },
              { q:"É possível exportar os dados?",                     a:"Sim, você pode exportar relatórios com todos os patrimônios cadastrados para análise externa." },
            ].map(({q,a},i)=>(
              <div key={q} className={`rounded-2xl p-5 reveal reveal-delay-${(i%3)+1}`}
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", color:"white" }}>?</div>
                  <div>
                    <div className="font-semibold text-white mb-1.5">{q}</div>
                    <div className="text-sm" style={{ color:"rgba(255,255,255,0.65)" }}>{a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-white text-center relative overflow-hidden" style={{ background:"rgba(0,0,0,0.3)", borderTop:"1px solid rgba(34,211,238,0.1)" }}>
        <div className="absolute inset-0 pointer-events-none" style={GRID} />
        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(99,102,241,0.12)" }} />
        <div className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background:"rgba(34,211,238,0.08)" }} />
        <div className="relative reveal">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para começar?</h2>
          <p className="mb-8 text-lg max-w-md mx-auto" style={{ color:"#cbd5e1" }}>
            Crie sua conta gratuitamente e gerencie seus patrimônios hoje mesmo.
          </p>
          <Button onClick={()=>navigate("/auth")} size="lg" className="h-12 px-10 text-base font-semibold text-white border-0"
            style={{ background:"linear-gradient(135deg,#6366f1,#22d3ee)", boxShadow:"0 8px 32px rgba(99,102,241,0.4)" }}>
            Criar Conta Grátis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6" style={{ borderTop:"1px solid rgba(34,211,238,0.1)", background:"rgba(0,0,0,0.3)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AssetTrack" className="h-6 w-6 rounded" />
            <span className="text-sm font-semibold text-white">AssetTrack</span>
          </div>
          <p className="text-xs" style={{ color:"rgba(255,255,255,0.3)" }}>© 2026 AssetTrack. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
