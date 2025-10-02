import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Package, Upload, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Patrimony, PatrimonyStatus, PatrimonyLocation } from "@/types/patrimony";
import { toast } from "sonner";

const STORAGE_KEY = "patrimonies";
const MIGRATION_KEY = "patrimonies_migrated_to_cloud";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
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

  // Authentication check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        // Check if user is admin
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if user has admin role
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      console.error("Erro ao verificar role:", error);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Função de migração do localStorage para o banco
  const migrateLocalStorageToCloud = async () => {
    if (!user) return;
    
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
    if (alreadyMigrated === "true") return;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      localStorage.setItem(MIGRATION_KEY, "true");
      return;
    }

    try {
      setIsMigrating(true);
      const localPatrimonies = JSON.parse(localData);
      
      if (localPatrimonies.length === 0) {
        localStorage.setItem(MIGRATION_KEY, "true");
        setIsMigrating(false);
        return;
      }

      // Converter dados do formato local para o formato do banco
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

      const { error } = await supabase
        .from('patrimonies')
        .insert(dataToInsert);

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

  // Carregar patrimônios do banco
  const loadPatrimonies = async () => {
    try {
      const { data, error } = await supabase
        .from('patrimonies')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) throw error;

      // Converter do formato do banco para o formato da aplicação
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
        userId: p.user_id,
      }));

      setPatrimonies(formattedData);
    } catch (error) {
      console.error("Erro ao carregar patrimônios:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados e migrar se necessário
  useEffect(() => {
    if (!user) return;
    
    const init = async () => {
      await migrateLocalStorageToCloud();
      await loadPatrimonies();
    };
    init();
  }, [user]);

  // Realtime subscription para sincronização automática
  useEffect(() => {
    const channel = supabase
      .channel('patrimonies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patrimonies'
        },
        () => {
          loadPatrimonies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddPatrimony = async (data: {
    number: string;
    model: string;
    registeredBy: string;
    observations: string;
    status: PatrimonyStatus;
    location: PatrimonyLocation;
    customLocation?: string;
  }) => {
    if (!user) return;
    
    try {
      if (editingPatrimony) {
        // Atualizar patrimônio existente
        const { error } = await supabase
          .from('patrimonies')
          .update({
            number: data.number,
            model: data.model,
            registered_by: data.registeredBy,
            observations: data.observations,
            status: data.status,
            location: data.location,
            custom_location: data.customLocation || null,
          })
          .eq('id', editingPatrimony.id);

        if (error) throw error;
        toast.success("Patrimônio atualizado com sucesso!");
        setEditingPatrimony(null);
      } else {
        // Adicionar novo patrimônio
        const { error } = await supabase
          .from('patrimonies')
          .insert({
            number: data.number,
            model: data.model,
            registered_by: data.registeredBy,
            observations: data.observations,
            status: data.status,
            location: data.location,
            custom_location: data.customLocation || null,
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
      const { error } = await supabase
        .from('patrimonies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success("Patrimônio deletado com sucesso!");
      await loadPatrimonies();
    } catch (error) {
      console.error("Erro ao deletar patrimônio:", error);
      toast.error("Erro ao deletar patrimônio.");
    }
  };

  const handleDeleteSelected = async () => {
    if (!user) return;
    
    // Verificar se usuário não-admin está tentando deletar patrimônios de outros
    if (!isAdmin) {
      const selectedPatrimonies = patrimonies.filter(p => selectedIds.has(p.id));
      const hasOthersPatrimonies = selectedPatrimonies.some(p => p.userId !== user.id);
      
      if (hasOthersPatrimonies) {
        toast.error("Você não tem permissão para deletar patrimônios de outros usuários");
        return;
      }
    }
    
    try {
      const { error } = await supabase
        .from('patrimonies')
        .delete()
        .in('id', Array.from(selectedIds));

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
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredPatrimonies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPatrimonies.map(p => p.id)));
    }
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingPatrimony(null);
    }
  };

  const filteredPatrimonies = patrimonies.filter((p) =>
    p.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || isMigrating) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background w-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3 animate-pulse">
            {isMigrating ? <Upload className="h-5 w-5 text-muted-foreground" /> : <Package className="h-5 w-5 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            {isMigrating ? "Migrando dados para a nuvem..." : "Carregando patrimônios..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background w-full">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">AssetTrack</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Sistema de controle de manutenção</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-9"
              >
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
              placeholder="Buscar por número de patrimônio..."
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
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs sm:text-sm w-full sm:w-auto"
                    >
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
          {selectedPatrimony && <PatrimonyCard patrimony={selectedPatrimony} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;