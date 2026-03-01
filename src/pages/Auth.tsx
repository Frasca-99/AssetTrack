import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, KeyRound } from "lucide-react";

const emailSchema    = z.string().trim().email("Email inválido").max(255, "Email muito longo");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(100, "Senha muito longa");
const nameSchema     = z.string().trim().min(1, "Nome é obrigatório").max(200, "Nome muito longo");
const companySchema  = z.string().trim().min(2, "Nome da empresa é obrigatório").max(200, "Nome muito longo");
const inviteSchema   = z.string().trim().min(6, "Código de convite inválido").max(12);

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading]       = useState(false);
  const [isLogin, setIsLogin]       = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [signupMode, setSignupMode] = useState<"create" | "join">("join");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/app");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/app");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd       = new FormData(e.currentTarget);
      const email    = emailSchema.parse(fd.get("email"));
      const password = passwordSchema.parse(fd.get("password"));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast({ title: "Erro ao fazer login", description: error.message, variant: "destructive" });
      else toast({ title: "Login realizado com sucesso!" });
    } catch (err) {
      if (err instanceof z.ZodError)
        toast({ title: "Erro de validação", description: err.issues[0].message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd       = new FormData(e.currentTarget);
      const email    = emailSchema.parse(fd.get("email"));
      const password = passwordSchema.parse(fd.get("password"));
      const fullName = nameSchema.parse(fd.get("fullName"));

      if (signupMode === "join") {
        // ── Entrar em empresa existente via código ──
        const code = inviteSchema.parse(fd.get("inviteCode"));

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/app`, data: { full_name: fullName } },
        });
        if (signUpErr) throw signUpErr;

        if (!signUpData.session) {
          // Email já cadastrado ou confirmação pendente — não tenta entrar na empresa
          throw new Error("Este email já está cadastrado. Faça login normalmente.");
        }

        const { error: rpcErr } = await supabase.rpc("entrar_empresa", { _code: code });
        if (rpcErr) throw rpcErr;

        toast({ title: "Conta criada!", description: "Você entrou na empresa. Faça login." });
        setIsLogin(true);

      } else {
        // ── Criar nova empresa ──
        const companyName = companySchema.parse(fd.get("companyName"));
        const companyCnpj = (fd.get("companyCnpj") as string)?.trim() || null;

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/app`, data: { full_name: fullName } },
        });
        if (signUpErr) throw signUpErr;

        if (!signUpData.session) {
          // Email já cadastrado ou confirmação pendente — não cria empresa
          throw new Error("Este email já está cadastrado. Faça login normalmente.");
        }

        const { error: rpcErr } = await supabase.rpc("criar_empresa", { _nome: companyName, _cnpj: companyCnpj });
        if (rpcErr) throw rpcErr;

        toast({ title: "Empresa criada!", description: "Você é o administrador. Faça login." });
        setIsLogin(true);
      }
    } catch (err) {
      if (err instanceof z.ZodError)
        toast({ title: "Erro de validação", description: err.issues[0].message, variant: "destructive" });
      else
        toast({ title: "Erro ao criar conta", description: (err as any)?.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) toast({ title: "Erro ao entrar como visitante", description: error.message, variant: "destructive" });
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd    = new FormData(e.currentTarget);
      const email = emailSchema.parse(fd.get("email"));
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) toast({ title: "Erro ao enviar email", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir sua senha." });
        setIsResetPassword(false);
      }
    } catch (err) {
      if (err instanceof z.ZodError)
        toast({ title: "Erro de validação", description: err.issues[0].message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AssetTrack</CardTitle>
          <CardDescription>Gestão fácil e eficiente</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full mb-4" onClick={handleGuestLogin} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar sem conta
          </Button>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-2">ou entre com sua conta</span>
            </div>
          </div>

          {isResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" name="email" type="email" placeholder="seu@email.com" required disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Email de Recuperação
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsResetPassword(false)}>
                Voltar ao Login
              </Button>
            </form>
          ) : (
            <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              {/* ── LOGIN ── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" name="email" type="email" placeholder="seu@email.com" required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input id="login-password" name="password" type="password" placeholder="••••••••" required disabled={loading} minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  <Button type="button" variant="link" className="w-full" onClick={() => setIsResetPassword(true)}>
                    Esqueceu a senha?
                  </Button>
                </form>
              </TabsContent>

              {/* ── SIGNUP ── */}
              <TabsContent value="signup">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button type="button" onClick={() => setSignupMode("join")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${signupMode === "join" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border"}`}>
                    <KeyRound className="w-3 h-3" /> Código de convite
                  </button>
                  <button type="button" onClick={() => setSignupMode("create")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${signupMode === "create" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-border"}`}>
                    <Building2 className="w-3 h-3" /> Nova empresa
                  </button>
                </div>

                <form onSubmit={handleSignup} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input id="signup-name" name="fullName" type="text" placeholder="Seu nome" required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="seu@email.com" required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input id="signup-password" name="password" type="password" placeholder="••••••••" required disabled={loading} minLength={6} />
                  </div>

                  {signupMode === "join" ? (
                    <div className="space-y-2">
                      <Label htmlFor="signup-invite">Código de Convite</Label>
                      <Input id="signup-invite" name="inviteCode" type="text" placeholder="Ex: AB12CD34"
                        required disabled={loading} className="uppercase tracking-widest font-mono" />
                      <p className="text-[11px] text-muted-foreground">Solicite o código ao administrador da sua empresa.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-company">Nome da Empresa</Label>
                        <Input id="signup-company" name="companyName" type="text" placeholder="Nome da organização" required disabled={loading} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-cnpj">CNPJ <span className="text-muted-foreground text-[10px]">(opcional)</span></Label>
                        <Input id="signup-cnpj" name="companyCnpj" type="text" placeholder="00.000.000/0001-00" disabled={loading} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Você será o administrador da empresa criada.</p>
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {signupMode === "join" ? "Entrar na Empresa" : "Criar Empresa e Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
