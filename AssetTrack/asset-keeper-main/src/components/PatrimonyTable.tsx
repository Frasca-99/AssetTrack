import { Patrimony } from "@/types/patrimony";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Trash2, Pencil, Lock } from "lucide-react";

interface PatrimonyTableProps {
  patrimonies: Patrimony[];
  onViewDetails: (patrimony: Patrimony) => void;
  onEdit: (patrimony: Patrimony) => void;
  onDelete: (id: string, patrimony: Patrimony) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAdmin: boolean;
  currentUserId?: string;
}

export function PatrimonyTable({ patrimonies, onViewDetails, onEdit, onDelete, selectedIds, onToggleSelect, onToggleSelectAll, isAdmin, currentUserId }: PatrimonyTableProps) {
  const statusVariant = (status: string) => 
    status === "Perda total" 
      ? "destructive" 
      : status === "Finalizada" || status === "Entregue"
      ? "success" 
      : "warning";

  const allSelected = patrimonies.length > 0 && selectedIds.size === patrimonies.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < patrimonies.length;

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-10 sm:w-12 px-2 sm:px-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label="Selecionar todos"
                className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
              />
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[80px] sm:min-w-[100px] px-2 sm:px-4">Patrimônio</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[70px] sm:min-w-[100px] px-2 sm:px-4">Modelo</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[90px] sm:min-w-[120px] px-2 sm:px-4">Cadastrado por</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[80px] sm:min-w-[100px] px-2 sm:px-4">Data</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[80px] sm:min-w-[100px] px-2 sm:px-4">Status</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[110px] sm:min-w-[140px] px-2 sm:px-4">Localização</TableHead>
            <TableHead className="text-right text-xs font-medium text-muted-foreground whitespace-nowrap min-w-[110px] sm:min-w-[140px] px-2 sm:px-4">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patrimonies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-sm">
                Nenhum patrimônio cadastrado ainda
              </TableCell>
            </TableRow>
          ) : (
            patrimonies.map((patrimony) => (
              <TableRow 
                key={patrimony.id} 
                className={`animate-fade-in border-border/50 hover:bg-muted/30 ${
                  selectedIds.has(patrimony.id) ? 'bg-muted/50' : ''
                }`}
              >
                <TableCell className="whitespace-nowrap px-2 sm:px-4">
                  <Checkbox
                    checked={selectedIds.has(patrimony.id)}
                    onCheckedChange={() => onToggleSelect(patrimony.id)}
                    aria-label={`Selecionar patrimônio ${patrimony.number}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">#{patrimony.number}</TableCell>
                <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-2 sm:px-4">{patrimony.model}</TableCell>
                <TableCell className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">{patrimony.registeredBy}</TableCell>
                <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap px-2 sm:px-4">{new Date(patrimony.registeredAt).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="whitespace-nowrap px-2 sm:px-4">
                  <Badge variant={statusVariant(patrimony.status)} className="text-[10px] sm:text-xs font-normal px-1.5 sm:px-2">
                    {patrimony.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {patrimony.location === "Outro" && patrimony.customLocation 
                    ? patrimony.customLocation 
                    : patrimony.location}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap px-2 sm:px-4">
                  <div className="flex items-center justify-end gap-0.5 sm:gap-1 min-w-[100px] sm:min-w-[120px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(patrimony)}
                      className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3 shrink-0"
                    >
                      Ver
                    </Button>
                    {!isAdmin && patrimony.userId !== currentUserId ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(patrimony)}
                          className="h-6 sm:h-7 w-6 sm:w-7 p-0 shrink-0 relative"
                          disabled={true}
                        >
                          <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(patrimony.id, patrimony)}
                          className="h-6 sm:h-7 w-6 sm:w-7 p-0 shrink-0 relative"
                          disabled={true}
                        >
                          <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(patrimony)}
                          className="h-6 sm:h-7 w-6 sm:w-7 p-0 shrink-0"
                        >
                          <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 sm:h-7 w-6 sm:w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg font-semibold">Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Tem certeza que deseja deletar o patrimônio #{patrimony.number}? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(patrimony.id, patrimony)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
