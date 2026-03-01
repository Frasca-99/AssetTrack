export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  status: "ativo" | "inativo";
  invite_code: string;
  created_at: string;
}

export interface LogAuditoria {
  id: string;
  usuario_id: string | null;
  empresa_id: string;
  acao: "INSERT" | "UPDATE" | "DELETE";
  entidade: string;
  entidade_id: string | null;
  data_hora: string;
  detalhes: Record<string, unknown> | null;
  creator?: { full_name: string; email: string } | null;
}
