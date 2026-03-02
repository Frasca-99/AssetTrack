import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Building2, Upload, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface EmpresaData {
  id: string;
  nome: string;
  cnpj: string | null;
  logo_url: string | null;
}

const CompanySettings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [nomeEdit, setNomeEdit] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const uid = session.user.id;

      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("empresa_id").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
      ]);

      const eid = profileRes.data?.empresa_id ?? null;
      if (!eid) { navigate("/app"); return; }

      setEmpresaId(eid);
      setIsAdmin(!!roleRes.data);

      const { data: emp } = await supabase
        .from("empresas")
        .select("id, nome, cnpj, logo_url")
        .eq("id", eid)
        .single();

      if (emp) {
        setEmpresa(emp);
        setNomeEdit(emp.nome);
      }

      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleSaveNome = async () => {
    if (!nomeEdit.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("atualizar_empresa", { _nome: nomeEdit.trim() });
      if (error) throw error;
      setEmpresa(prev => prev ? { ...prev, nome: nomeEdit.trim() } : prev);
      toast.success("Nome atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresaId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${empresaId}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: rpcErr } = await supabase.rpc("atualizar_empresa", {
        _nome: empresa?.nome ?? nomeEdit,
        _logo_url: publicUrl,
      });
      if (rpcErr) throw rpcErr;

      setEmpresa(prev => prev ? { ...prev, logo_url: publicUrl } : prev);
      toast.success("Logo atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload.");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const { error } = await supabase.rpc("sair_empresa");
      if (error) throw error;
      toast.success("Você saiu da empresa.");
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Erro ao sair da empresa.");
    }
    setLeaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const initials = empresa?.nome
    ? empresa.nome.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5" asChild>
              <Link to="/app"><ChevronLeft className="w-4 h-4" />Voltar</Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold">Configurações da Empresa</h1>
              <p className="text-xs text-muted-foreground">{empresa?.nome}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Logo */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Logo da Empresa</h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Imagem exibida nas configurações da empresa." : "Logo atual da empresa."}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {empresa?.logo_url ? (
                <img src={empresa.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Building2 className="w-8 h-8 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/50 font-bold">{initials}</span>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? "Enviando..." : "Alterar logo"}
                </Button>
                <p className="text-[11px] text-muted-foreground">PNG, JPG ou WebP. Máximo 2MB.</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Informações da Empresa</h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Edite os dados da empresa." : "Dados da empresa."}
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Empresa</Label>
              {isAdmin ? (
                <Input
                  value={nomeEdit}
                  onChange={e => setNomeEdit(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Nome da organização"
                  disabled={saving}
                />
              ) : (
                <p className="text-sm py-2 px-3 rounded-md bg-muted/50 border">{empresa?.nome}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CNPJ</Label>
              <p className="text-sm py-2 px-3 rounded-md bg-muted/50 border text-muted-foreground">
                {empresa?.cnpj || "Não informado"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              className="h-9"
              onClick={handleSaveNome}
              disabled={saving || !nomeEdit.trim() || nomeEdit.trim() === empresa?.nome}
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          )}
        </div>

        {/* Sair da empresa */}
        <div className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-destructive">Sair da Empresa</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ao sair, você perderá acesso a todos os dados desta empresa.
              {isAdmin && " Você é administrador — certifique-se de que há outro admin antes de sair."}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-9 gap-2" disabled={leaving}>
                <LogOut className="w-3.5 h-3.5" />
                Sair da Empresa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sair de {empresa?.nome}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você perderá acesso imediatamente. Os patrimônios cadastrados por você serão mantidos.
                  {isAdmin && " Como administrador, garanta que há outro admin antes de sair."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeave}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirmar saída
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </main>
    </div>
  );
};

export default CompanySettings;
