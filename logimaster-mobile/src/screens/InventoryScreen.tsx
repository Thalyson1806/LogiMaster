import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAPI, postAPI } from "../services/api";
import Sidebar from "../components/Sidebar";

type Product = {
  productId: number;
  productReference: string;
  productDescription: string;
  productType: string;
  currentStock: number;
};

type Movement = {
  id: number;
  type: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  createdByUserName?: string;
};

const MOVE_TYPES = [
  { key: "Entry",      label: "Entrada",   color: "#16a34a" },
  { key: "Exit",       label: "Saída",     color: "#dc2626" },
  { key: "Adjustment", label: "Ajuste",    color: "#d97706" },
];

export default function InventoryScreen({ navigation }: any) {
  const [items, setItems] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal de movimento
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [moveType, setMoveType] = useState<"Entry" | "Exit" | "Adjustment">("Entry");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Histórico
  const [history, setHistory] = useState<Movement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => { loadStock(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(items.filter(
      i => i.productReference.toLowerCase().includes(q) ||
           i.productDescription.toLowerCase().includes(q)
    ));
  }, [search, items]);

  async function loadStock() {
    try {
      const res = await getAPI<{ items: Product[] }>("/stock");
      setItems(res.items);
      setFiltered(res.items);
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openModal(item: Product) {
    setSelected(item);
    setMoveType("Entry");
    setQuantity("");
    setNotes("");
    setModalVisible(true);
    setLoadingHistory(true);
    try {
      const res = await getAPI<Movement[]>(`/stock/product/${item.productId}`);
      setHistory(res.slice(0, 10));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleSave() {
    if (!selected || !quantity || Number(quantity) <= 0) {
      Alert.alert("Atenção", "Informe uma quantidade válida");
      return;
    }
    setSaving(true);
    try {
      await postAPI("/stock/movement", {
        productId: selected.productId,
        type: moveType,
        quantity: Number(quantity),
        notes: notes || undefined,
      });
      const label = MOVE_TYPES.find(t => t.key === moveType)?.label ?? moveType;
      Alert.alert("Sucesso", `${label} de ${quantity} un registrada!`);
      setModalVisible(false);
      await loadStock();
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setSaving(false);
    }
  }

  function getMoveLabel(type: string) {
    return MOVE_TYPES.find(t => t.key === type)?.label ?? type;
  }

  function getMoveColor(type: string) {
    return MOVE_TYPES.find(t => t.key === type)?.color ?? "#64748b";
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)}>
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Inventário</Text>
            <Text style={styles.subtitle}>Todos os produtos</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar referência ou descrição..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista */}
      {filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.productId.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
              <View style={styles.cardRow}>
                <Text style={styles.ref}>{item.productReference}</Text>
                <View style={[styles.stockBadge, { backgroundColor: item.currentStock > 0 ? "#dbeafe" : "#fee2e2" }]}>
                  <Text style={[styles.stockText, { color: item.currentStock > 0 ? "#1e40af" : "#dc2626" }]}>
                    {item.currentStock.toLocaleString("pt-BR")} un
                  </Text>
                </View>
              </View>
              <Text style={styles.desc} numberOfLines={1}>{item.productDescription}</Text>
              <Text style={styles.typeTag}>
                {item.productType === "RawMaterial" ? "Matéria Prima" : "Produto Acabado"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentScreen="Inventory"
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Registrar Movimento</Text>

              {/* Info produto */}
              <View style={styles.productInfo}>
                <Text style={styles.productRef}>{selected?.productReference}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>{selected?.productDescription}</Text>
                <Text style={styles.stockCurrent}>
                  Estoque:{" "}
                  <Text style={{ color: (selected?.currentStock ?? 0) > 0 ? "#1e40af" : "#dc2626", fontWeight: "700" }}>
                    {selected?.currentStock.toLocaleString("pt-BR")} un
                  </Text>
                </Text>
              </View>

              {/* Tipo de movimento */}
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeRow}>
                {MOVE_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeBtn, moveType === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                    onPress={() => setMoveType(t.key as any)}
                  >
                    <Text style={[styles.typeBtnText, moveType === t.key && { color: "#fff" }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quantidade */}
              <Text style={styles.label}>Quantidade</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                autoFocus
              />

              {/* Observação */}
              <Text style={styles.label}>Observação (opcional)</Text>
              <TextInput
                style={styles.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: Inventário mensal, Perda, etc."
                placeholderTextColor="#94a3b8"
              />

              {/* Botões */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: MOVE_TYPES.find(t => t.key === moveType)?.color }, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Registrando..." : `Confirmar ${getMoveLabel(moveType)}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              {/* Histórico */}
              <Text style={[styles.label, { marginTop: 20 }]}>Últimas movimentações</Text>
              {loadingHistory ? (
                <ActivityIndicator color="#1e40af" style={{ marginVertical: 12 }} />
              ) : history.length === 0 ? (
                <Text style={styles.historyEmpty}>Nenhuma movimentação registrada.</Text>
              ) : (
                history.map(m => (
                  <View key={m.id} style={styles.historyItem}>
                    <View style={styles.historyRow}>
                      <View style={[styles.moveBadge, { backgroundColor: getMoveColor(m.type) + "22" }]}>
                        <Text style={[styles.moveBadgeText, { color: getMoveColor(m.type) }]}>
                          {getMoveLabel(m.type)}
                        </Text>
                      </View>
                      <Text style={[styles.historyQty, { color: m.quantity >= 0 ? "#16a34a" : "#dc2626" }]}>
                        {m.quantity >= 0 ? "+" : ""}{m.quantity.toLocaleString("pt-BR")}
                      </Text>
                    </View>
                    {m.notes ? <Text style={styles.historyNote}>{m.notes}</Text> : null}
                    <Text style={styles.historyDate}>
                      {new Date(m.createdAt).toLocaleString("pt-BR")}
                      {m.createdByUserName ? ` — ${m.createdByUserName}` : ""}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  header: { backgroundColor: "#1e3a8a", padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "#93c5fd", marginTop: 2 },
  backButton: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  backText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  searchContainer: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  searchInput: { backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#1e293b" },
  list: { padding: 12 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8,
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
    borderLeftWidth: 4, borderLeftColor: "#1e3a8a",
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ref: { fontSize: 15, fontWeight: "700", color: "#1e3a8a" },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockText: { fontSize: 13, fontWeight: "700" },
  desc: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  typeTag: { fontSize: 11, color: "#94a3b8" },
  emptyText: { fontSize: 16, color: "#94a3b8", textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1e3a8a", marginBottom: 12 },
  productInfo: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 14, marginBottom: 16 },
  productRef: { fontSize: 16, fontWeight: "700", color: "#1e3a8a" },
  productDesc: { fontSize: 13, color: "#64748b", marginTop: 2 },
  stockCurrent: { fontSize: 14, color: "#374151", marginTop: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
  typeBtnText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  input: { backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1e293b", marginBottom: 14 },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { marginTop: 12, alignItems: "center", paddingVertical: 12 },
  cancelText: { color: "#94a3b8", fontSize: 14 },
  historyEmpty: { fontSize: 13, color: "#94a3b8", textAlign: "center", marginVertical: 8 },
  historyItem: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10, marginTop: 10 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  moveBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  moveBadgeText: { fontSize: 12, fontWeight: "700" },
  historyQty: { fontSize: 16, fontWeight: "700" },
  historyNote: { fontSize: 12, color: "#64748b", marginTop: 2 },
  historyDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
});
