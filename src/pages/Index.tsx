import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Search, Package, Upload, LogOut, ShieldCheck, Users, ClipboardList, Copy, KeyRound, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { PatrimonyForm } from "@/components/PatrimonyForm";
import { PatrimonyTable } from "@/components/PatrimonyTable";
import { PatrimonyCard } from "@/components/PatrimonyCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Patrimony, PatrimonyStatus, PatrimonyLocation, PatrimonyProblem } from "@/types/patrimony";
import { toast } from "sonner";
import { z } from "zod";

const STORAGE_KEY = "patrimonies";
const MIGRATION_KEY = "patrimonies_migrated_to_cloud";

const inviteSchema = z.string().trim().min(6, "Código inválido").max(12);
const companySchema = z.string().trim().min(2, "Nome é obrigatório").max(200);

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; email?: string; empresa_id?: string | null } | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null | undefined>(undefined); // undefined = loading
  const [empresaNome, setEmpresaNome] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [patrimonies, setPatrimonies] = useState<Patrimony[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatrimony, setSelectedPatrimony] = useState<Patrimony | null>(null);
  const [editingPatrimony, setEditingPatrimony] = useState<Patrimony | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  // CompanyGate state
  const [gateMode, setGateMode] = useState<"join" | "create">("join");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
          fetchProfile(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkAdminStatus(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if user has admin role
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  // Fetch user profile (includes empresa_id)
  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, empresa_id')
        .eq('id', userId)
        .maybeSingle();
      setProfile(data);
      const eId = data?.empresa_id ?? null;
      setEmpresaId(eId);
      if (eId) {
        supabase.from('empresas').select('nome').eq('id', eId).maybeSingle()
          .then(({ data: emp }) => { if (emp) setEmpresaNome(emp.nome); });
      }
    } catch {
      setProfile(null);
      setEmpresaId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // ── CompanyGate handlers ──

  const handleJoinCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGateError(null);
    setGateLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const code = inviteSchema.parse(fd.get("inviteCode"));
      const { data, error } = await supabase.rpc("entrar_empresa", { _code: code });
      if (error) throw error;
      setEmpresaId(data as string);
      toast.success("Você entrou na empresa!");
    } catch (err: any) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : (err.message || "Código inválido ou empresa inativa.");
      setGateError(msg);
    }
    setGateLoading(false);
  };

  const handleCreateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGateError(null);
    if (isAdmin || empresaId) {
      setGateError("Esta conta já está vinculada a uma empresa. Não é possível criar outra.");
      return;
    }
    setGateLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const nome = companySchema.parse(fd.get("companyName"));
      const cnpj = (fd.get("cnpj") as string)?.trim() || null;
      const { data, error } = await supabase.rpc("criar_empresa", { _nome: nome, _cnpj: cnpj });
      if (error) throw error;
      setEmpresaId(data as string);
      setIsAdmin(true);
      setEmpresaNome(nome);
      toast.success("Empresa criada! Você é o administrador.");
    } catch (err: any) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : (err.message || "Erro ao criar empresa.");
      setGateError(msg);
    }
    setGateLoading(false);
  };

  // ── Data loading ──

  const migrateLocalStorageToCloud = async () => {
    if (!user) return;
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
    if (alreadyMigrated === "true") return;
    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) { localStorage.setItem(MIGRATION_KEY, "true"); return; }

    try {
      setIsMigrating(true);
      const localPatrimonies = JSON.parse(localData);
      if (localPatrimonies.length === 0) {
        localStorage.setItem(MIGRATION_KEY, "true");
        return;
      }
      const dataToInsert = localPatrimonies.map((p: any) => ({
        id: p.id,
        number: p.number,
        model: p.model,
        registered_by: p.registeredBy,
        observations: p.observations || '',
        status: p.status,
        location: p.location,
        custom_location: p.customLocation || null,
        registered_at: p.registeredAt,
        user_id: user.id,
      }));
      const { error } = await supabase.from('patrimonies').insert(dataToInsert);
      if (error) throw error;
      localStorage.setItem(MIGRATION_KEY, "true");
      toast.success(`${localPatrimonies.length} patrimônio(s) migrado(s) para a nuvem!`);
    } catch (error) {
      console.error("Erro na migração:", error);
      toast.error("Erro ao migrar dados. Tente novamente.");
    } finally {
      setIsMigrating(false);
    }
  };

  const loadPatrimonies = async () => {
    try {
      const { data, error } = await supabase
        .from('patrimonies')
        .select('*, creator:profiles!user_id(full_name, email)')
        .order('registered_at', { ascending: false });

      if (error) throw error;

      const formattedData: Patrimony[] = (data || []).map((p: any) => ({
        id: p.id,
        number: p.number,
        model: p.model,
        registeredBy: p.registered_by,
        registeredAt: new Date(p.registered_at),
        observations: p.observations || '',
        status: p.status as PatrimonyStatus,
        location: p.location as PatrimonyLocation,
        customLocation: p.custom_location || undefined,
        problem: p.problem as PatrimonyProblem | undefined,
        userId: p.user_id,
        empresaId: p.empresa_id,
        creatorName: p.creator?.full_name || p.registered_by,
        creatorEmail: p.creator?.email,
      }));

      setPatrimonies(formattedData);
    } catch (error) {
      console.error("Erro ao carregar patrimônios:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    // For anonymous users or users still loading empresa, skip data load
    if (user.is_anonymous) {
      const init = async () => {
        await migrateLocalStorageToCloud();
        await loadPatrimonies();
      };
      init();
      return;
    }
    // Wait until empresa_id is resolved
    if (empresaId === undefined) return;
    if (empresaId === null) { setLoading(false); return; }

    const init = async () => {
      await migrateLocalStorageToCloud();
      await loadPatrimonies();
    };
    init();
  }, [user, empresaId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('patrimonies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patrimonies' }, () => {
        loadPatrimonies();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddPatrimony = async (data: {
    number: string;
    model: string;
    observations: string;
    status: PatrimonyStatus;
    location: PatrimonyLocation;
    customLocation?: string;
    problem?: PatrimonyProblem;
  }) => {
    if (!user) return;
    const registeredBy = profile?.full_name || user.email || "Desconhecido";

    try {
      if (editingPatrimony) {
        const { error } = await supabase
          .from('patrimonies')
          .update({
            number: data.number,
            model: data.model,
            observations: data.observations,
            status: data.status,
            location: data.location,
            custom_location: data.customLocation || null,
            problem: data.problem || null,
          })
          .eq('id', editingPatrimony.id);

        if (error) throw error;
        toast.success("Patrimônio atualizado com sucesso!");
        setEditingPatrimony(null);
      } else {
        const { error } = await supabase
          .from('patrimonies')
          .insert({
            number: data.number,
            model: data.model,
            registered_by: registeredBy,
            observations: data.observations,
            status: data.status,
            location: data.location,
            custom_location: data.customLocation || null,
            problem: data.problem || null,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("Patrimônio cadastrado com sucesso!");
      }
      setIsFormOpen(false);
      await loadPatrimonies();
    } catch (error: any) {
      console.error("Erro ao salvar patrimônio:", error);
      toast.error(error.message || "Erro ao salvar patrimônio.");
    }
  };

  const handleViewDetails = (patrimony: Patrimony) => {
    setSelectedPatrimony(patrimony);
    setIsDetailsOpen(true);
  };

  const handleEditPatrimony = (patrimony: Patrimony) => {
    if (!isAdmin && patrimony.userId !== user?.id) {
      toast.error("Apenas administradores podem editar patrimônios de outros usuários");
      return;
    }
    setEditingPatrimony(patrimony);
    setIsFormOpen(true);
  };

  const handleDeletePatrimony = async (id: string, patrimony: Patrimony) => {
    if (!isAdmin && patrimony.userId !== user?.id) {
      toast.error("Apenas administradores podem deletar patrimônios de outros usuários");
      return;
    }
    try {
      const { error } = await supabase.from('patrimonies').delete().eq('id', id);
      if (error) throw error;
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      toast.success("Patrimônio deletado com sucesso!");
      await loadPatrimonies();
    } catch (error) {
      console.error("Erro ao deletar patrimônio:", error);
      toast.error("Erro ao deletar patrimônio.");
    }
  };

  const handleDeleteSelected = async () => {
    if (!user) return;
    if (!isAdmin) {
      const selectedPatrimonies = patrimonies.filter(p => selectedIds.has(p.id));
      if (selectedPatrimonies.some(p => p.userId !== user.id)) {
        toast.error("Você não tem permissão para deletar patrimônios de outros usuários");
        return;
      }
    }
    try {
      const { error } = await supabase.from('patrimonies').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} patrimônio(s) deletado(s) com sucesso!`);
      setSelectedIds(new Set());
      await loadPatrimonies();
    } catch (error) {
      console.error("Erro ao deletar patrimônios:", error);
      toast.error("Erro ao deletar patrimônios.");
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredPatrimonies.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredPatrimonies.map(p => p.id)));
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingPatrimony(null);
  };

  const filteredPatrimonies = patrimonies.filter((p) =>
    p.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Loading screen ──
  if (loading || isMigrating || empresaId === undefined) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background w-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3 animate-pulse">
            {isMigrating ? <Upload className="h-5 w-5 text-muted-foreground" /> : <Package className="h-5 w-5 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {isMigrating ? "Migrando dados para a nuvem..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  // ── Company Gate: user without empresa_id ──
  if (!user?.is_anonymous && empresaId === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border bg-card shadow-sm p-6 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">Vincule sua conta a uma empresa</h2>
            <p className="text-sm text-muted-foreground">Para continuar, entre em uma empresa existente ou crie a sua.</p>
          </div>

          <div className={`grid gap-2 ${isAdmin ? "grid-cols-1" : "grid-cols-2"}`}>
            <button type="button" onClick={() => { setGateMode("join"); setGateError(null); }}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${gateMode === "join" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border"}`}>
              <KeyRound className="w-3 h-3" /> Código de convite
            </button>
            {!isAdmin && (
              <button type="button" onClick={() => { setGateMode("create"); setGateError(null); }}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${gateMode === "create" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border"}`}>
                <Building2 className="w-3 h-3" /> Nova empresa
              </button>
            )}
          </div>

          {gateMode === "join" ? (
            <form onSubmit={handleJoinCompany} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gate-invite" className="text-xs">Código de Convite</Label>
                <Input id="gate-invite" name="inviteCode" placeholder="Ex: AB12CD34"
                  required disabled={gateLoading} className="uppercase tracking-widest font-mono h-9 text-sm" />
                <p className="text-[11px] text-muted-foreground">Solicite o código ao administrador da empresa.</p>
              </div>
              <Button type="submit" className="w-full h-9 text-sm" disabled={gateLoading}>
                Entrar na Empresa
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gate-company" className="text-xs">Nome da Empresa</Label>
                <Input id="gate-company" name="companyName" placeholder="Nome da organização"
                  required disabled={gateLoading} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gate-cnpj" className="text-xs">CNPJ <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="gate-cnpj" name="cnpj" placeholder="00.000.000/0001-00"
                  disabled={gateLoading} className="h-9 text-sm" />
              </div>
              <Button type="submit" className="w-full h-9 text-sm" disabled={gateLoading}>
                Criar Empresa
              </Button>
            </form>
          )}

          {gateError && (
            <p className="text-xs text-destructive text-center bg-destructive/10 border border-destructive/25 rounded-lg px-3 py-2">
              {gateError}
            </p>
          )}

          <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={handleLogout}>
            Sair da conta
          </Button>
        </div>
      </div>
    );
  }

  // ── Main App ──
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">AssetTrack</h1>
              {empresaNome ? (
                <p className="text-xs text-muted-foreground">{empresaNome}</p>
              ) : (
                <p className="text-xs text-muted-foreground hidden sm:block">Sistema de controle de manutenção</p>
              )}
            </div>

            {/* Nav links */}
            {empresaId && (
              <nav className="hidden sm:flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" asChild>
                  <Link to="/app/empresa"><Building2 className="w-3.5 h-3.5" />Empresa</Link>
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" asChild>
                      <Link to="/app/usuarios"><Users className="w-3.5 h-3.5" />Usuários</Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" asChild>
                      <Link to="/app/auditoria"><ClipboardList className="w-3.5 h-3.5" />Auditoria</Link>
                    </Button>
                  </>
                )}
              </nav>
            )}

            {/* User profile chip */}
            {user && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border bg-muted/40">
                <div className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)" }}>
                  {profile?.full_name
                    ? profile.full_name.charAt(0).toUpperCase()
                    : user.email?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {profile?.full_name || (user.is_anonymous ? "Visitante" : user.email)}
                    </span>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/25">
                        <ShieldCheck className="w-2.5 h-2.5" />Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[140px] block">
                    {user.is_anonymous ? "Conta temporária" : user.email}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-9">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
              <ThemeToggle />
              <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9 text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Adicionar</span>
                    <span className="xs:hidden">Novo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                      {editingPatrimony ? "Editar Patrimônio" : "Novo Patrimônio"}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingPatrimony
                        ? "Atualize as informações do equipamento"
                        : "Preencha as informações do equipamento"}
                    </DialogDescription>
                  </DialogHeader>
                  <PatrimonyForm
                    onSubmit={handleAddPatrimony}
                    existingNumbers={patrimonies
                      .filter((p) => p.id !== editingPatrimony?.id)
                      .map((p) => p.number)}
                    initialData={editingPatrimony || undefined}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm bg-background"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
        {patrimonies.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nenhum patrimônio cadastrado</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              Comece adicionando seu primeiro equipamento ao sistema de gestão
            </p>
            <Button onClick={() => setIsFormOpen(true)} className="h-10">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Patrimônio
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {filteredPatrimonies.length} {filteredPatrimonies.length === 1 ? 'patrimônio' : 'patrimônios'}
                </p>
                {selectedIds.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-8 text-xs sm:text-sm w-full sm:w-auto">
                      Excluir Selecionados ({selectedIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg font-semibold">Confirmar exclusão múltipla</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Tem certeza que deseja deletar {selectedIds.size} patrimônio{selectedIds.size !== 1 ? 's' : ''}? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSelected}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
                      >
                        Deletar Todos
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <PatrimonyTable
              patrimonies={filteredPatrimonies}
              onViewDetails={handleViewDetails}
              onEdit={handleEditPatrimony}
              onDelete={handleDeletePatrimony}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              showCreatorEmail={isAdmin}
            />
          </div>
        )}
      </main>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Detalhes</DialogTitle>
          </DialogHeader>
          {selectedPatrimony && (
            <PatrimonyCard patrimony={selectedPatrimony} showCreatorEmail={isAdmin} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
