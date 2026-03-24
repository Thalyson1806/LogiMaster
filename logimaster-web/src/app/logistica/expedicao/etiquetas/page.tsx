"use client";

import { useEffect, useState } from "react";
import { Product, Customer, PendingLabelItem } from "@/lib/types";
import { productService, customerService, customerProductService, labelService } from "@/lib/services";
import { Printer, Tag, Search, X, ClipboardList, SlidersHorizontal, CheckCircle2, Package } from "lucide-react";
import JsBarcode from "jsbarcode";

// ── Barcode helper ──────────────────────────────────────────────────────────
function makeBarcodeUrl(value: string, height = 40): string {
  if (!value || typeof document === "undefined") return "";
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value, {
      format: "CODE128",
      displayValue: false,
      width: 1.5,
      height,
      margin: 3,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

// ── Label component ───────────────────────────────────────────────────────────
interface LabelProps {
  re: string;
  nome: string;
  turno: string;
  lote: string;
  quantidade: string;
  reference: string;
  description: string;
  customerName: string;
  customerAddress: string;
  productBarcodeUrl: string;
  qtyBarcodeUrl: string;
}

function Label(p: LabelProps) {
  const now = new Date();
  const dt = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getFullYear()).slice(2)} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const hdr: React.CSSProperties = {
    backgroundColor: "#0d1b6e",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "6pt",
    padding: "1px 4px",
    whiteSpace: "nowrap",
    display: "inline-block",
  };

  const cell: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={{
      width: "100mm", height: "80mm", border: "1.5px solid #000",
      fontFamily: "Arial, Helvetica, sans-serif", fontSize: "7pt",
      overflow: "hidden", backgroundColor: "#fff",
      display: "flex", flexDirection: "column", boxSizing: "border-box",
      pageBreakAfter: "always", breakAfter: "page",
    }}>
      {/* ROW 1: Logo | CLIENTE/Ref | dados | TURNO/LOTE */}
      <div style={{ display: "flex", borderBottom: "1px solid #000", height: "19mm", flexShrink: 0 }}>
        <div style={{ width: "22mm", borderRight: "1px solid #000", ...cell, padding: "1mm" }}>
          <img src="/logo.png" alt="Logo" style={{ maxWidth: "20mm", maxHeight: "16mm", objectFit: "contain" }} />
        </div>
        <div style={{ width: "16mm", borderRight: "1px solid #000", ...cell, flexDirection: "column", gap: "2mm" }}>
          <span style={hdr}>CLIENTE</span>
          <span style={{ fontSize: "6pt" }}>Referência</span>
        </div>
        <div style={{ flex: 1, borderRight: "1px solid #000", display: "flex", flexDirection: "column", justifyContent: "center", padding: "1mm 2mm", gap: "1mm" }}>
          <span style={{ fontWeight: "bold", fontSize: "9pt", color: "#0d1b6e" }}>{p.customerName || "—"}</span>
          <span style={{ fontSize: "8pt" }}>{p.reference || "—"}</span>
        </div>
        <div style={{ width: "22mm", ...cell, flexDirection: "column", padding: "1mm", gap: "1mm" }}>
          <span style={{ ...hdr, width: "100%", textAlign: "center" }}>{p.turno}</span>
          <span style={{ fontSize: "6pt" }}>LOTE</span>
          <span style={{ fontSize: "13pt", fontWeight: "bold" }}>{p.lote || "—"}</span>
        </div>
      </div>

      {/* ROW 2: RE | NOME */}
      <div style={{ display: "flex", borderBottom: "1px solid #000", height: "10mm", flexShrink: 0, alignItems: "center" }}>
        <div style={{ width: "30mm", borderRight: "1px solid #000", display: "flex", alignItems: "center", gap: "2mm", padding: "0 2mm", height: "100%" }}>
          <span style={{ ...hdr, fontSize: "8pt", padding: "2px 5px" }}>RE</span>
          <span style={{ fontSize: "13pt", fontWeight: "bold" }}>{p.re || "—"}</span>
        </div>
        <div style={{ width: "14mm", borderRight: "1px solid #000", height: "100%", ...cell }}>
          <span style={hdr}>NOME</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 2mm", height: "100%" }}>
          <span style={{ fontSize: "8pt", fontWeight: "bold" }}>{(p.nome || "—").toUpperCase()}</span>
        </div>
      </div>

      {/* ROW 3: DESCRIÇÃO+QUANTIDADE | CÓDIGO DE BARRAS */}
      <div style={{ display: "flex", flex: 1, borderBottom: "1px solid #000", minHeight: 0 }}>
        <div style={{ width: "57%", borderRight: "1px solid #000", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #000", flexShrink: 0 }}>
            <div style={{ flex: 1, ...cell, padding: "0.5mm", borderRight: "1px solid #000" }}>
              <span style={hdr}>DESCRIÇÃO</span>
            </div>
            <div style={{ flex: 1, ...cell, padding: "0.5mm" }}>
              <span style={{ fontSize: "6pt", fontWeight: "bold" }}>QUANTIDADE</span>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "1mm", gap: "1mm" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5mm", maxWidth: "32mm", overflow: "hidden" }}>
              <span style={{ fontSize: "6pt", color: "#222", fontWeight: "bold", textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
                {p.description || "—"}
              </span>
              {p.qtyBarcodeUrl
                ? <img src={p.qtyBarcodeUrl} alt="barcode qty" style={{ maxWidth: "28mm", height: "10mm", objectFit: "contain" }} />
                : <div style={{ width: "28mm", height: "10mm", background: "#eee" }} />}
            </div>
            <span style={{ fontSize: "20pt", fontWeight: "bold" }}>{p.quantidade || "0"}</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ ...cell, padding: "0.5mm", borderBottom: "1px solid #000", flexShrink: 0 }}>
            <span style={hdr}>CÓDIGO DE BARRAS</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1mm", gap: "0.5mm" }}>
            {p.productBarcodeUrl
              ? <img src={p.productBarcodeUrl} alt="barcode" style={{ maxWidth: "38mm", height: "12mm", objectFit: "contain" }} />
              : <div style={{ width: "38mm", height: "12mm", background: "#eee" }} />}
            <span style={{ fontSize: "6pt", wordBreak: "break-all", textAlign: "center" }}>{p.reference}</span>
          </div>
        </div>
      </div>

      {/* ROW 4: ENDEREÇO */}
      <div style={{ display: "flex", alignItems: "center", height: "10mm", padding: "0 2mm", gap: "2mm", flexShrink: 0 }}>
        <span style={{ ...hdr, flexShrink: 0 }}>ENDEREÇO</span>
        <span style={{ flex: 1, fontSize: "7pt", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.customerAddress || "—"}</span>
        <span style={{ fontSize: "6pt", color: "#333", whiteSpace: "nowrap", flexShrink: 0 }}>{dt}</span>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
type Tab = "pendentes" | "manual";

export default function EtiquetasPage() {
  const [tab, setTab] = useState<Tab>("pendentes");

  // ── Estado pendentes ──
  const [pending, setPending] = useState<PendingLabelItem[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [selectedPending, setSelectedPending] = useState<PendingLabelItem | null>(null);
  const [pendingTurno, setPendingTurno] = useState("1° TURNO");
  const [pendingCopies, setPendingCopies] = useState(1);
  const [printing, setPrinting] = useState(false);

  // ── Estado manual ──
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingManual, setLoadingManual] = useState(false);
  const [manualLoaded, setManualLoaded] = useState(false);
  const [re, setRe] = useState("");
  const [nome, setNome] = useState("");
  const [turno, setTurno] = useState("1° TURNO");
  const [lote, setLote] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [copies, setCopies] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [linkedProductIds, setLinkedProductIds] = useState<Set<number> | null>(null);
  const [showProdDD, setShowProdDD] = useState(false);
  const [showCustDD, setShowCustDD] = useState(false);

  // ── Barcodes (compartilhados) ──
  const [qtyBarcodeUrl, setQtyBarcodeUrl] = useState("");
  const [productBarcodeUrl, setProductBarcodeUrl] = useState("");

  // Carregar pendentes ao montar
  useEffect(() => {
    loadPending();
    try {
      const s = localStorage.getItem("logimaster_user");
      if (s) {
        const u = JSON.parse(s);
        if (u.employeeId) setRe(u.employeeId);
        if (u.name) setNome(u.name);
      }
    } catch {}
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-dd='prod']")) setShowProdDD(false);
      if (!t.closest("[data-dd='cust']")) setShowCustDD(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Barcodes — aba pendentes
  useEffect(() => {
    if (tab === "pendentes" && selectedPending) {
      setProductBarcodeUrl(makeBarcodeUrl(selectedPending.reference, 45));
      setQtyBarcodeUrl(makeBarcodeUrl(String(selectedPending.quantity), 40));
    }
  }, [selectedPending, tab]);

  // Barcodes — aba manual
  useEffect(() => {
    if (tab === "manual") {
      setQtyBarcodeUrl(quantidade ? makeBarcodeUrl(quantidade, 40) : "");
    }
  }, [quantidade, tab]);

  useEffect(() => {
    if (tab === "manual") {
      const val = selectedProduct?.barcode || selectedProduct?.reference || "";
      setProductBarcodeUrl(val ? makeBarcodeUrl(val, 45) : "");
    }
  }, [selectedProduct, tab]);

  async function loadPending() {
  setLoadingPending(true);
  try {
    const data = await labelService.getPending();
    setPending(data);
  } catch {
    setPending([]);
  } finally {
    setLoadingPending(false);
  }
}

  async function loadManualData() {
    if (manualLoaded) return;
    setLoadingManual(true);
    try {
      const [prodsRes, custsRes] = await Promise.allSettled([productService.getAll(), customerService.getAll()]);
      if (prodsRes.status === "fulfilled") setProducts(prodsRes.value);
      if (custsRes.status === "fulfilled") setCustomers(custsRes.value);
      setManualLoaded(true);
    } catch {}
    finally { setLoadingManual(false); }
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "manual") loadManualData();
  }

  async function handlePrint() {
    if (!selectedPending) return;
    setPrinting(true);
    window.print();
    try {
      await labelService.markPrinted(selectedPending.itemId);
      setPending(prev => prev.filter(p => p.itemId !== selectedPending.itemId));
      setSelectedPending(null);
    } catch {}
    finally { setPrinting(false); }
  }

  // Agrupar pendentes por romaneio
  const grouped = pending.reduce<Record<string, { code: string; customerName: string; items: PendingLabelItem[] }>>((acc, item) => {
    if (!acc[item.packingListCode]) {
      acc[item.packingListCode] = { code: item.packingListCode, customerName: item.customerName, items: [] };
    }
    acc[item.packingListCode].items.push(item);
    return acc;
  }, {});

  // Props da etiqueta atual para prévia e impressão
  const labelProps: LabelProps = tab === "pendentes" && selectedPending
    ? {
        re: selectedPending.operatorEmployeeId || "",
        nome: selectedPending.operatorName,
        turno: pendingTurno,
        lote: selectedPending.batch || "",
        quantidade: String(selectedPending.quantity),
        reference: selectedPending.reference,
        description: selectedPending.description,
        customerName: selectedPending.customerName,
        customerAddress: [selectedPending.customerAddress, selectedPending.customerCity, selectedPending.customerState].filter(Boolean).join(" - "),
        productBarcodeUrl,
        qtyBarcodeUrl,
      }
    : {
        re, nome, turno, lote, quantidade,
        reference: selectedProduct?.reference || "",
        description: selectedProduct?.description || "",
        customerName: selectedCustomer?.name || "",
        customerAddress: [selectedCustomer?.address, selectedCustomer?.city, selectedCustomer?.state].filter(Boolean).join(" - "),
        productBarcodeUrl,
        qtyBarcodeUrl,
      };

  const activeCopies = tab === "pendentes" ? pendingCopies : copies;

  const filteredProds = products
    .filter(p => {
      const matchSearch = !productSearch || p.reference.toLowerCase().includes(productSearch.toLowerCase()) || p.description.toLowerCase().includes(productSearch.toLowerCase());
      const matchCustomer = linkedProductIds === null || linkedProductIds.has(p.id);
      return matchSearch && matchCustomer;
    }).slice(0, 30);

  const filteredCusts = customers
    .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.code.toLowerCase().includes(customerSearch.toLowerCase()))
    .slice(0, 30);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #label-print-area, #label-print-area * { visibility: visible !important; }
          #label-print-area { position: fixed !important; left: 0 !important; top: 0 !important; width: 100mm !important; }
          @page { size: 100mm 80mm; margin: 0; }
        }
      `}</style>

      {/* Área de impressão */}
      <div id="label-print-area" style={{ position: "absolute", left: "-9999px", top: 0, display: "flex", flexDirection: "column" }}>
        {Array.from({ length: Math.max(1, activeCopies) }).map((_, i) => (
          <Label key={i} {...labelProps} />
        ))}
      </div>

      <div className="flex gap-6 min-h-full">
        {/* Painel esquerdo */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-4">

          {/* Cabeçalho + abas */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Etiquetas</h1>
                <p className="text-sm text-slate-500">100 × 80 mm</p>
              </div>
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleTabChange("pendentes")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === "pendentes" ? "bg-white shadow text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
              >
                <ClipboardList className="w-4 h-4" />
                Pendentes
                {pending.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>
                )}
              </button>
              <button
                onClick={() => handleTabChange("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === "manual" ? "bg-white shadow text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Manual
              </button>
            </div>
          </div>

          {/* ── ABA PENDENTES ── */}
          {tab === "pendentes" && (
            <div className="flex flex-col gap-3 flex-1">
              {loadingPending ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Carregando...</div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                  <p className="text-slate-500 font-medium">Nenhuma etiqueta pendente</p>
                  <p className="text-xs text-slate-400">As etiquetas aparecem após a conferência dos romaneios</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {Object.values(grouped).map(group => (
                    <div key={group.code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                        <p className="text-xs font-bold text-slate-700">{group.code}</p>
                        <p className="text-xs text-slate-500 truncate">{group.customerName}</p>
                      </div>
                      {group.items.map(item => (
                        <button
                          key={item.itemId}
                          onClick={() => { setSelectedPending(item); setPendingCopies(1); }}
                          className={`w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-colors ${selectedPending?.itemId === item.itemId ? "bg-blue-50 border-l-2 border-l-blue-500" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-700">{item.reference}</span>
                            <span className="text-sm font-bold text-slate-700">{item.quantity.toLocaleString("pt-BR")} un</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                          {item.batch && (
                            <p className="text-xs text-slate-400 mt-0.5">Lote: <span className="font-semibold">{item.batch}</span></p>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Painel de impressão do item selecionado */}
              {selectedPending && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 mt-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Item selecionado</p>
                    <button onClick={() => setSelectedPending(null)} className="p-1 hover:bg-blue-100 rounded">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{selectedPending.reference}</p>
                      <p className="text-xs text-slate-500 truncate">{selectedPending.description}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Turno</label>
                    <select value={pendingTurno} onChange={e => setPendingTurno(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option>1° TURNO</option>
                      <option>2° TURNO</option>
                      <option>3° TURNO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nº de Cópias</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPendingCopies(c => Math.max(1, c - 1))}
                        className="w-8 h-8 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 font-bold flex items-center justify-center bg-white">−</button>
                      <span className="w-10 text-center font-semibold text-slate-800">{pendingCopies}</span>
                      <button onClick={() => setPendingCopies(c => Math.min(20, c + 1))}
                        className="w-8 h-8 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 font-bold flex items-center justify-center bg-white">+</button>
                    </div>
                  </div>

                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-60"
                  >
                    <Printer className="w-4 h-4" />
                    {printing ? "Registrando..." : `Imprimir${pendingCopies > 1 ? ` (${pendingCopies} cópias)` : ""}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ABA MANUAL ── */}
          {tab === "manual" && (
            <div className="space-y-4">
              {loadingManual && (
                <div className="text-center text-sm text-slate-400 py-4">Carregando...</div>
              )}

              {/* Operador */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Operador</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">RE / Chapa</label>
                    <input type="text" value={re} onChange={e => setRe(e.target.value)} placeholder="Ex: 139"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Turno</label>
                    <select value={turno} onChange={e => setTurno(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>1° TURNO</option>
                      <option>2° TURNO</option>
                      <option>3° TURNO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do operador"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Cliente */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cliente</p>
                <div className="relative" data-dd="cust">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text"
                    value={selectedCustomer ? selectedCustomer.name : customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setLinkedProductIds(null); setSelectedProduct(null); setShowCustDD(true); }}
                    onFocus={() => setShowCustDD(true)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-9 pr-8 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {selectedCustomer && (
                    <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setLinkedProductIds(null); setSelectedProduct(null); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                  {showCustDD && !selectedCustomer && filteredCusts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                      {filteredCusts.map(c => (
                        <button key={c.id} onClick={() => {
                          setSelectedCustomer(c); setCustomerSearch(""); setShowCustDD(false);
                          setSelectedProduct(null); setProductSearch("");
                          customerProductService.getByCustomer(c.id)
                            .then(links => { setLinkedProductIds(new Set(links.map(l => l.productId))); setShowProdDD(true); })
                            .catch(() => { setLinkedProductIds(null); setShowProdDD(true); });
                        }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0">
                          <div className="font-medium text-slate-800">{c.name}</div>
                          <div className="text-xs text-slate-500 truncate">{c.code} — {c.address}, {c.city}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Produto */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Produto</p>
                  {selectedCustomer && linkedProductIds !== null && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {linkedProductIds.size} ref.
                    </span>
                  )}
                </div>
                <div className="relative" data-dd="prod">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text"
                    value={selectedProduct ? `${selectedProduct.reference} — ${selectedProduct.description}` : productSearch}
                    onChange={e => { setProductSearch(e.target.value); setSelectedProduct(null); setShowProdDD(true); }}
                    onFocus={() => setShowProdDD(true)}
                    placeholder={selectedCustomer ? "Filtrado por cliente..." : "Buscar referência..."}
                    className="w-full pl-9 pr-8 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {selectedProduct && (
                    <button onClick={() => { setSelectedProduct(null); setProductSearch(""); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                  {showProdDD && !selectedProduct && filteredProds.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                      {filteredProds.map(pr => (
                        <button key={pr.id} onClick={() => { setSelectedProduct(pr); setProductSearch(""); setShowProdDD(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0">
                          <div className="font-mono text-xs text-blue-700 font-medium">{pr.reference}</div>
                          <div className="text-xs text-slate-500 truncate">{pr.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lote / Quantidade / Cópias */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dados da Etiqueta</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Lote</label>
                    <input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="Ex: 15145"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Quantidade</label>
                    <input type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Ex: 150"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nº de Cópias</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCopies(c => Math.max(1, c - 1))}
                      className="w-8 h-8 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 font-bold flex items-center justify-center">−</button>
                    <span className="w-10 text-center font-semibold text-slate-800">{copies}</span>
                    <button onClick={() => setCopies(c => Math.min(20, c + 1))}
                      className="w-8 h-8 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 font-bold flex items-center justify-center">+</button>
                  </div>
                </div>
              </div>

              <button onClick={() => window.print()}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium">
                <Printer className="w-5 h-5" />
                Imprimir{copies > 1 ? ` (${copies} cópias)` : " Etiqueta"}
              </button>
            </div>
          )}
        </div>

        {/* Prévia */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-600">Prévia</h2>
            <span className="text-xs text-slate-400">100 × 80 mm</span>
          </div>
          <div className="flex-1 bg-slate-200 rounded-xl flex items-start justify-center p-8 overflow-auto">
            {tab === "pendentes" && !selectedPending ? (
              <div className="flex flex-col items-center justify-center gap-3 text-center h-full">
                <ClipboardList className="w-16 h-16 text-slate-400" />
                <p className="text-slate-500 font-medium">Selecione um item pendente</p>
                <p className="text-xs text-slate-400">A prévia da etiqueta aparecerá aqui</p>
              </div>
            ) : (
              <div style={{ transform: "scale(1.35)", transformOrigin: "top center" }}>
                <Label {...labelProps} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
