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

export default function RecebimentoScreen({ navigation }: any) {
  const [items, setItems] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
      const res = await getAPI<{ items: Product[] }>("/stock?type=RawMaterial");
      setItems(res.items);
      setFiltered(res.items);
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  }

  function openModal(item: Product) {
    setSelected(item);
    setQuantity("");
    setNotes("");
    setModalVisible(true);
  }

  async function handleSave() {
    if (!selected || !quantity || Number(quantity) <= 0) {
      Alert.alert("Atenção", "Informe a quantidade");
      return;
    }
    setSaving(true);
    try {
      await postAPI("/stock/movement", {
        productId: selected.productId,
        type: "Entry",
        quantity: Number(quantity),
        notes: notes || `Recebimento - ${new Date().toLocaleDateString("pt-BR")}`,
      });
      Alert.alert("Sucesso", `Recebimento de ${quantity} un registrado!`);
      setModalVisible(false);
      await loadStock();
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setSaving(false);
    }
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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)}>
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Recebimento</Text>
            <Text style={styles.subtitle}>Matéria Prima</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar referência ou descrição..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nenhuma matéria prima cadastrada.</Text>
          <Text style={styles.emptyHint}>Cadastre produtos com tipo "Matéria Prima" no sistema.</Text>
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
                <View style={[styles.stockBadge, { backgroundColor: item.currentStock > 0 ? "#dcfce7" : "#fee2e2" }]}>
                  <Text style={[styles.stockText, { color: item.currentStock > 0 ? "#16a34a" : "#dc2626" }]}>
                    {item.currentStock.toLocaleString("pt-BR")} un
                  </Text>
                </View>
              </View>
              <Text style={styles.desc} numberOfLines={1}>{item.productDescription}</Text>
              <Text style={styles.tapHint}>Toque para registrar recebimento</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Registrar Recebimento</Text>
              <View style={styles.productInfo}>
                <Text style={styles.productRef}>{selected?.productReference}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>{selected?.productDescription}</Text>
                <Text style={styles.stockCurrent}>
                  Estoque atual:{" "}
                  <Text style={{ color: (selected?.currentStock ?? 0) > 0 ? "#16a34a" : "#dc2626", fontWeight: "700" }}>
                    {selected?.currentStock.toLocaleString("pt-BR")} un
                  </Text>
                </Text>
              </View>

              <Text style={styles.label}>Quantidade Recebida</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                autoFocus
              />

              <Text style={styles.label}>Observação (opcional)</Text>
              <TextInput
                style={styles.input}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: NF 12345, Fornecedor XYZ"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Registrando..." : "Confirmar Recebimento"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentScreen="Recebimento"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  header: { backgroundColor: "#15803d", padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "#bbf7d0", marginTop: 2 },
  backButton: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  backText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  searchContainer: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  searchInput: { backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#1e293b" },
  list: { padding: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 8, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, borderLeftWidth: 4, borderLeftColor: "#15803d" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  ref: { fontSize: 15, fontWeight: "700", color: "#15803d" },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stockText: { fontSize: 13, fontWeight: "700" },
  desc: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  tapHint: { fontSize: 11, color: "#94a3b8" },
  emptyText: { fontSize: 16, color: "#94a3b8", textAlign: "center", marginBottom: 8 },
  emptyHint: { fontSize: 13, color: "#cbd5e1", textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#15803d", marginBottom: 12 },
  productInfo: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 14, marginBottom: 16 },
  productRef: { fontSize: 16, fontWeight: "700", color: "#15803d" },
  productDesc: { fontSize: 13, color: "#64748b", marginTop: 2 },
  stockCurrent: { fontSize: 14, color: "#374151", marginTop: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1e293b", marginBottom: 14 },
  saveBtn: { backgroundColor: "#15803d", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { marginTop: 12, alignItems: "center", paddingVertical: 12 },
  cancelText: { color: "#94a3b8", fontSize: 14 },
});
