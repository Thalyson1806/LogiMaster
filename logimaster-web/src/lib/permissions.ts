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

type PermissionMap = Record<Role, Partial<Record<Resource, Action[]>>>;

const PERMISSIONS: PermissionMap = {
  Administrator: {
    usuarios:     ["view", "create", "edit", "delete"],
    clientes:     ["view", "create", "edit", "delete"],
    produtos:     ["view", "create", "edit", "delete"],
    embalagens:   ["view", "create", "edit", "delete"],
    solicitacoes: ["view", "create", "edit", "delete"],
    romaneios:    ["view", "create", "edit", "delete"],
    expedicao:    ["view", "create", "edit", "delete"],
    faturamento:  ["view", "create", "edit", "delete"],
    estoque:      ["view", "create", "edit", "delete"],
    edi:          ["view", "create", "edit", "delete"],
    warehouse:    ["view", "create", "edit", "delete"],
    mapa:         ["view"],
  },
  LogisticsAnalyst: {
    usuarios:     [],
    clientes:     ["view", "edit"],
    produtos:     ["view", "edit"],
    embalagens:   ["view"],
    solicitacoes: ["view", "create", "edit", "delete"],
    romaneios:    ["view", "create", "edit", "delete"],
    expedicao:    ["view", "create", "edit"],
    faturamento:  ["view", "create", "edit"],
    estoque:      ["view"],
    edi:          ["view", "create", "edit"],
    warehouse:    ["view", "edit"],
    mapa:         ["view"],
  },
  Shipping: {
    usuarios:     [],
    clientes:     ["view"],
    produtos:     ["view"],
    embalagens:   ["view"],
    solicitacoes: ["view", "create"],
    romaneios:    ["view", "create", "edit"],
    expedicao:    ["view", "create", "edit"],
    faturamento:  ["view"],
    estoque:      ["view"],
    edi:          ["view"],
    warehouse:    ["view"],
    mapa:         ["view"],
  },
  Invoicing: {
    usuarios:     [],
    clientes:     ["view"],
    produtos:     ["view"],
    embalagens:   ["view"],
    solicitacoes: ["view"],
    romaneios:    ["view"],
    expedicao:    ["view"],
    faturamento:  ["view", "create", "edit", "delete"],
    estoque:      ["view"],
    edi:          ["view"],
    warehouse:    ["view"],
    mapa:         ["view"],
  },
  Viewer: {
    usuarios:     [],
    clientes:     ["view"],
    produtos:     ["view"],
    embalagens:   ["view"],
    solicitacoes: ["view"],
    romaneios:    ["view"],
    expedicao:    ["view"],
    faturamento:  ["view"],
    estoque:      ["view"],
    edi:          ["view"],
    warehouse:    ["view"],
    mapa:         ["view"],
  },
  Driver: {
    usuarios:     [],
    clientes:     [],
    produtos:     [],
    embalagens:   [],
    solicitacoes: [],
    romaneios:    ["view"],
    expedicao:    [],
    faturamento:  [],
    estoque:      [],
    edi:          [],
    warehouse:    [],
    mapa:         ["view"],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}
