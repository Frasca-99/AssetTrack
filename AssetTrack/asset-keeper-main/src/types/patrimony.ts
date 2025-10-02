export type PatrimonyStatus = "Finalizada" | "Em manutenção" | "Entregue" | "Perda total";
export type PatrimonyLocation = "Quartinho" | "Manutenção" | "Outro";
export type PatrimonyProblem = "Lentidão" | "Máquina não liga" | "Outro problema";

export interface Patrimony {
  id: string;
  number: string;
  model: string;
  registeredBy: string;
  registeredAt: Date;
  observations: string;
  status: PatrimonyStatus;
  location: PatrimonyLocation;
  customLocation?: string;
  problem?: PatrimonyProblem;
  userId: string;
}
