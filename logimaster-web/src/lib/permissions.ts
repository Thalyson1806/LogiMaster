// Deve corresponder exatamente ao enum UserRole do backend
export type Role =
  | "Administrator"
  | "LogisticsAnalyst"
  | "Shipping"
  | "Invoicing"
  | "Viewer"
  | "Driver";

export type Action = "view" | "create" | "edit" | "delete";

export type Resource =
  | "usuarios"
  | "clientes"
  | "produtos"
  | "embalagens"
  | "solicitacoes"
  | "romaneios"
  | "expedicao"
  | "faturamento"
  | "estoque"
  | "edi"
  | "warehouse"
  | "mapa";

// Espelha AppModule.cs — bit de "visualizar" de cada módulo
const RESOURCE_VIEW_BIT: Partial<Record<Resource, number>> = {
  romaneios:    1 << 0,   // Romaneios
  expedicao:    1 << 0,   // usa o mesmo módulo de Romaneios
  edi:          1 << 4,   // Edi
  faturamento:  1 << 8,   // Faturamento
  solicitacoes: 1 << 8,   // Solicitações = Faturamento
  clientes:     1 << 12,  // Clientes
  produtos:     1 << 16,  // Produtos
  embalagens:   1 << 16,  // Embalagens usa módulo de Produtos
  estoque:      1 << 20,  // Estoque
  warehouse:    1 << 20,  // Armazém usa módulo de Estoque
  mapa:         1 << 24,  // Mapa
  // usuarios não tem bit — acesso apenas por role Administrator
};

/**
 * Verifica se o bitmask de permissões contém o bit de visualização do recurso.
 * Administrator sempre retorna true.
 */
export function canBit(role: Role, permBits: number, resource: Resource): boolean {
  if (role === "Administrator") return true;
  if (resource === "usuarios") return false;
  const bit = RESOURCE_VIEW_BIT[resource];
  if (bit === undefined) return false;
  return (permBits & bit) !== 0;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function can(_role: Role, _resource: Resource, _action: Action): boolean {
  return false;
}
