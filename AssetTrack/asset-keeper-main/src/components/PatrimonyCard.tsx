import { Patrimony } from "@/types/patrimony";
import { Badge } from "@/components/ui/badge";

interface PatrimonyCardProps {
  patrimony: Patrimony;
}

export function PatrimonyCard({ patrimony }: PatrimonyCardProps) {
  const statusVariant = patrimony.status === "Perda total" 
    ? "destructive" 
    : patrimony.status === "Finalizada" || patrimony.status === "Entregue"
    ? "success" 
    : "warning";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div>
          <h3 className="text-sm font-medium mb-1">#{patrimony.number}</h3>
          <p className="text-xs text-muted-foreground">{patrimony.model}</p>
        </div>
        <Badge variant={statusVariant} className="text-xs font-normal">
          {patrimony.status}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Cadastrado por</p>
          <p className="text-sm">{patrimony.registeredBy}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Data de cadastro</p>
          <p className="text-sm">{new Date(patrimony.registeredAt).toLocaleDateString("pt-BR")}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Localização da máquina</p>
          <p className="text-sm">
            {patrimony.location === "Outro" && patrimony.customLocation 
              ? patrimony.customLocation 
              : patrimony.location}
          </p>
        </div>

        {patrimony.problem && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Problema identificado</p>
            <p className="text-sm">
              {patrimony.problem}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-2">Observações</p>
          <p className="text-sm bg-muted/50 p-3 rounded-md border border-border/50">
            {patrimony.observations}
          </p>
        </div>
      </div>
    </div>
  );
}
