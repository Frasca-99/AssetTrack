import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Patrimony, PatrimonyStatus, PatrimonyLocation, PatrimonyProblem } from "@/types/patrimony";
import { Lightbulb } from "lucide-react";
import { z } from "zod";

interface PatrimonyFormProps {
  onSubmit: (data: {
    number: string;
    model: string;
    registeredBy: string;
    observations: string;
    status: PatrimonyStatus;
    location: PatrimonyLocation;
    customLocation?: string;
    problem?: PatrimonyProblem;
  }) => void;
  existingNumbers: string[];
  initialData?: Patrimony;
}

// Validation schema using Zod
const patrimonySchema = z.object({
  number: z.string()
    .trim()
    .min(1, "Número do patrimônio é obrigatório")
    .max(50, "Número deve ter no máximo 50 caracteres"),
  model: z.string()
    .trim()
    .min(1, "Modelo é obrigatório")
    .max(200, "Modelo deve ter no máximo 200 caracteres"),
  registeredBy: z.string()
    .trim()
    .min(1, "Nome de quem registrou é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  observations: z.string()
    .trim()
    .min(1, "Observações são obrigatórias")
    .max(2000, "Observações devem ter no máximo 2000 caracteres"),
  customLocation: z.string()
    .trim()
    .max(200, "Localização deve ter no máximo 200 caracteres")
    .optional(),
});

const problemSolutions: Record<PatrimonyProblem, string[]> = {
  "Lentidão": [
    "Verifique o uso de memória RAM e CPU no gerenciador de tarefas",
    "Limpe arquivos temporários e cache do sistema",
    "Desative programas de inicialização desnecessários",
    "Execute uma verificação de vírus e malware",
    "Considere adicionar mais memória RAM ou atualizar o HD para SSD"
  ],
  "Máquina não liga": [
    "Verifique se o cabo de energia está conectado corretamente",
    "Teste a tomada com outro dispositivo",
    "Pressione e segure o botão de energia por 30 segundos (descarga estática)",
    "Verifique se há LEDs acesos na placa-mãe",
    "Teste com outra fonte de energia se possível",
    "Se for notebook, remova a bateria e tente ligar apenas com o carregador"
  ],
  "Outro problema": [
    "Descreva detalhadamente o problema nas observações",
    "Anote mensagens de erro específicas",
    "Verifique se o problema é de hardware ou software",
    "Consulte a documentação do fabricante"
  ]
};

export function PatrimonyForm({ onSubmit, existingNumbers, initialData }: PatrimonyFormProps) {
  const [number, setNumber] = useState("");
  const [model, setModel] = useState("");
  const [registeredBy, setRegisteredBy] = useState("");
  const [observations, setObservations] = useState("");
  const [status, setStatus] = useState<PatrimonyStatus>("Em manutenção");
  const [location, setLocation] = useState<PatrimonyLocation>("Quartinho");
  const [customLocation, setCustomLocation] = useState("");
  const [problem, setProblem] = useState<PatrimonyProblem | "">("");
  const [error, setError] = useState("");

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      setNumber(initialData.number);
      setModel(initialData.model);
      setRegisteredBy(initialData.registeredBy);
      setObservations(initialData.observations);
      setStatus(initialData.status);
      setLocation(initialData.location);
      setCustomLocation(initialData.customLocation || "");
      setProblem(initialData.problem || "");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Validate input data using Zod schema
      const validatedData = patrimonySchema.parse({
        number,
        model,
        registeredBy,
        observations,
        customLocation: location === "Outro" ? customLocation : undefined,
      });

      // Additional business logic validations
      if (location === "Outro" && !customLocation.trim()) {
        setError("Por favor, especifique o local");
        return;
      }

      // Check if number already exists (only for new patrimonies)
      if (!initialData && existingNumbers.includes(validatedData.number)) {
        setError("Este número de patrimônio já existe");
        return;
      }

      onSubmit({
        number: validatedData.number,
        model: validatedData.model,
        registeredBy: validatedData.registeredBy,
        observations: validatedData.observations,
        status,
        location,
        customLocation: location === "Outro" ? validatedData.customLocation : undefined,
        problem: problem || undefined,
      });

      // Reset form if not editing
      if (!initialData) {
        setNumber("");
        setModel("");
        setRegisteredBy("");
        setObservations("");
        setStatus("Em manutenção");
        setLocation("Quartinho");
        setCustomLocation("");
        setProblem("");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        setError("Erro ao validar os dados. Por favor, verifique os campos.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="number" className="text-xs">Número do Patrimônio*</Label>
        <Input
          id="number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Ex: 001234"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="model" className="text-xs">Modelo*</Label>
        <Input
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Ex: Dell Latitude 5420"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="registeredBy" className="text-xs">Cadastrado por*</Label>
        <Input
          id="registeredBy"
          value={registeredBy}
          onChange={(e) => setRegisteredBy(e.target.value)}
          placeholder="Seu nome"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observations" className="text-xs">Observações*</Label>
        <Textarea
          id="observations"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Descreva o que foi feito na manutenção..."
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs">Status*</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as PatrimonyStatus)}>
            <SelectTrigger id="status" className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Em manutenção" className="text-sm">Em manutenção</SelectItem>
              <SelectItem value="Finalizada" className="text-sm">Finalizada</SelectItem>
              <SelectItem value="Entregue" className="text-sm">Entregue</SelectItem>
              <SelectItem value="Perda total" className="text-sm">Perda total</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="problem" className="text-xs">Problema</Label>
          <Select value={problem} onValueChange={(value) => setProblem(value as PatrimonyProblem | "")}>
            <SelectTrigger id="problem" className="h-9 text-sm">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lentidão" className="text-sm">Lentidão</SelectItem>
              <SelectItem value="Máquina não liga" className="text-sm">Máquina não liga</SelectItem>
              <SelectItem value="Outro problema" className="text-sm">Outro problema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {problem && problemSolutions[problem as PatrimonyProblem] && (
        <Alert className="border-primary/20 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs space-y-2">
            <p className="font-medium text-foreground">Dicas para resolver "{problem}":</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {problemSolutions[problem as PatrimonyProblem].map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-xs">Localização da máquina*</Label>
        <Select value={location} onValueChange={(value) => setLocation(value as PatrimonyLocation)}>
          <SelectTrigger id="location" className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Quartinho" className="text-sm">Quartinho</SelectItem>
            <SelectItem value="Manutenção" className="text-sm">Manutenção</SelectItem>
            <SelectItem value="Outro" className="text-sm">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {location === "Outro" && (
        <div className="space-y-1.5">
          <Label htmlFor="customLocation" className="text-xs">Especificar Local*</Label>
          <Input
            id="customLocation"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Digite o local"
            className="h-9 text-sm"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full h-9 text-sm">
        {initialData ? "Atualizar" : "Cadastrar"}
      </Button>
    </form>
  );
}
