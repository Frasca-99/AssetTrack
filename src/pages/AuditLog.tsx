import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  acao: "INSERT" | "UPDATE" | "DELETE";
  entidade: string;
  entidade_id: string;
  data_hora: string;
  detalhes: Record<string, any> | null;
  usuario: { full_name: string; email: string } | null;
}

type PeriodoFilter = "24h" | "7d" | "30d" | "all";
type AcaoFilter = "all" | "INSERT" | "UPDATE" | "DELETE";

const PAGE_SIZE = 50;

const AuditLog = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFilter>("7d");
  const [acao, setAcao] = useState<AcaoFilter>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: role } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!role) { navigate("/app"); return; }
      await fetchLogs();
      setLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    setPage(0);
    fetchLogs(0);
  }, [periodo, acao]);

  const fetchLogs = async (pageOverride?: number) => {
    const currentPage = pageOverride ?? page;
    try {
      let query = supabase
        .from("logs_auditoria")
        .select("id, acao, entidade, entidade_id, data_hora, detalhes, usuario:profiles!usuario_id(full_name, email)", { count: "exact" })
        .order("data_hora", { ascending: false })
        .range(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE - 1);

      if (acao !== "all") query = query.eq("acao", acao);

      if (periodo !== "all") {
        const now = new Date();
        const hours = periodo === "24h" ? 24 : periodo === "7d" ? 168 : 720;
        now.setHours(now.getHours() - hours);
        query = query.gte("data_hora", now.toISOString());
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setLogs((data || []).map((l: any) => ({
        id: l.id,
        acao: l.acao,
        entidade: l.entidade,
        entidade_id: l.entidade_id,
        data_hora: l.data_hora,
        detalhes: l.detalhes,
        usuario: l.usuario ?? null,
      })));
      setTotal(count ?? 0);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao carregar logs.");
    }
  };

  const handlePageChange = async (newPage: number) => {
    setPage(newPage);
    await fetchLogs(newPage);
  };

  const acaoBadge = (a: string) => {
    if (a === "INSERT") return <Badge className="text-[10px] px-1.5 py-0 bg-green-500/15 text-green-600 border-green-500/25">Criado</Badge>;
    if (a === "UPDATE") return <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500/15 text-yellow-600 border-yellow-500/25">Editado</Badge>;
    if (a === "DELETE") return <Badge className="text-[10px] px-1.5 py-0 bg-destructive/15 text-destructive border-destructive/25">Deletado</Badge>;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" asChild>
              <Link to="/app"><ChevronLeft className="w-4 h-4" />Voltar</Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold">Log de Auditoria</h1>
              <p className="text-xs text-muted-foreground">{total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={acao} onValueChange={(v) => setAcao(v as AcaoFilter)}>
            <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="INSERT">Criado</SelectItem>
              <SelectItem value="UPDATE">Editado</SelectItem>
              <SelectItem value="DELETE">Deletado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFilter)}>
            <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="divide-y">
            {logs.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                Nenhum registro encontrado para os filtros selecionados.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-border flex-shrink-0 mt-1.5 sm:mt-0" />
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">
                        {new Date(log.data_hora).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {new Date(log.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {acaoBadge(log.acao)}
                      <span className="text-sm font-medium capitalize">{log.entidade}</span>
                      {log.detalhes?.number && (
                        <span className="text-xs text-muted-foreground font-mono">#{log.detalhes.number}</span>
                      )}
                    </div>
                    {log.detalhes && (
                      <div className="text-xs text-muted-foreground space-x-3">
                        {log.detalhes.model && <span>Modelo: {log.detalhes.model}</span>}
                        {log.detalhes.status && <span>Status: {log.detalhes.status}</span>}
                        {log.detalhes.status_anterior && (
                          <span>{log.detalhes.status_anterior} → {log.detalhes.status_novo}</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/70">
                      Por: {log.usuario?.full_name || log.usuario?.email || "Desconhecido"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8" disabled={page === 0} onClick={() => handlePageChange(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages - 1} onClick={() => handlePageChange(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuditLog;
