import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Copy, RefreshCw, ShieldCheck, ShieldOff, UserX, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CompanyMember {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user" | null;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const userId = session.user.id;
      setCurrentUserId(userId);

      // Check admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) { navigate("/app"); return; }

      // Get empresa
      const { data: profileData } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("id", userId)
        .maybeSingle();

      if (!profileData?.empresa_id) { navigate("/app"); return; }

      const eId = profileData.empresa_id;
      setEmpresaId(eId);

      await Promise.all([fetchInviteCode(eId), fetchMembers(eId)]);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const fetchInviteCode = async (eId: string) => {
    const { data } = await supabase
      .from("empresas")
      .select("invite_code")
      .eq("id", eId)
      .single();
    if (data) setInviteCode(data.invite_code);
  };

  const fetchMembers = async (eId: string) => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("empresa_id", eId);

    if (!profiles) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", profiles.map(p => p.id));

    const rolesMap = new Map((roles || []).map(r => [r.user_id, r.role as "admin" | "user"]));

    setMembers(profiles.map(p => ({
      id: p.id,
      full_name: p.full_name || "",
      email: p.email || "",
      role: rolesMap.get(p.id) ?? null,
    })));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Código copiado!");
  };

  const handleRegenerateCode = async () => {
    if (!empresaId) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.rpc("regenerar_invite_code", { _empresa_id: empresaId });
      if (error) throw error;
      setInviteCode(data as string);
      toast.success("Código regenerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao regenerar código.");
    }
    setRegenerating(false);
  };

  const handlePromote = async (memberId: string) => {
    try {
      await supabase.from("user_roles").upsert({ user_id: memberId, role: "admin" });
      toast.success("Usuário promovido a administrador.");
      if (empresaId) await fetchMembers(empresaId);
    } catch {
      toast.error("Erro ao promover usuário.");
    }
  };

  const handleDemote = async (memberId: string) => {
    try {
      await supabase.from("user_roles").delete().eq("user_id", memberId).eq("role", "admin");
      if (empresaId) await fetchMembers(empresaId);
      toast.success("Administrador rebaixado para usuário.");
    } catch {
      toast.error("Erro ao rebaixar usuário.");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      const { error } = await supabase.rpc("remover_membro", { _target_user_id: memberId });
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success("Usuário removido da empresa.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover usuário.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" asChild>
              <Link to="/app"><ChevronLeft className="w-4 h-4" />Voltar</Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold">Gerenciar Usuários</h1>
              <p className="text-xs text-muted-foreground">Controle de acesso da empresa</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Invite Code Card */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Código de Convite</h2>
            <p className="text-xs text-muted-foreground">Compartilhe este código para que novos usuários entrem na empresa.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 font-mono text-xl font-bold tracking-[0.3em] text-center py-3 px-4 rounded-lg bg-muted border border-border">
              {inviteCode}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleCopyCode}>
                <Copy className="w-3.5 h-3.5" />Copiar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={regenerating}>
                    <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
                    Novo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerar código?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O código atual será invalidado. Usuários que ainda não entraram precisarão do novo código.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateCode}>Regenerar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold">Membros da Empresa</h2>
            <p className="text-xs text-muted-foreground">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y">
            {members.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum membro encontrado.</div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="px-5 py-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: m.role === "admin" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#22d3ee,#0ea5e9)" }}>
                    {(m.full_name || m.email).charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{m.full_name || "—"}</span>
                      {m.role === "admin" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-indigo-500/15 text-indigo-500 border-indigo-500/25">
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />Admin
                        </Badge>
                      )}
                      {m.id === currentUserId && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Você</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>

                  {/* Actions (not self) */}
                  {m.id !== currentUserId && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {m.role === "admin" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
                              <ShieldOff className="w-3.5 h-3.5" />Rebaixar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Rebaixar administrador?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {m.full_name || m.email} perderá os privilégios de administrador.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDemote(m.id)}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
                              <ShieldCheck className="w-3.5 h-3.5" />Promover
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Promover a administrador?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {m.full_name || m.email} poderá gerenciar todos os patrimônios e usuários.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handlePromote(m.id)}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <UserX className="w-3.5 h-3.5" />Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {m.full_name || m.email} perderá acesso à empresa. Os patrimônios cadastrados por ele serão mantidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(m.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
