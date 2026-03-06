import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { packingListService } from "../services/packingListService";
import { PackingListSummary } from "../types";
import Sidebar from "../components/Sidebar";

export default function HomeScreen({ navigation }: any) {
  const [packingLists, setPackingLists] = useState<PackingListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const lists = await packingListService.getAll();
      setPackingLists(lists);
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    AsyncStorage.getItem("user").then((data) => {
      if (data) setUserName(JSON.parse(data).name ?? "");
    });
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => loadData());
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "#64748b";
      case "InSeparation": return "#3b82f6";
      case "AwaitingConference": return "#6366f1";
      case "InConference": return "#8b5cf6";
      case "AwaitingInvoicing": return "#f59e0b";
      default: return "#64748b";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending": return "Pendente";
      case "InSeparation": return "Separando";
      case "AwaitingConference": return "Aguard. Conferência";
      case "InConference": return "Conferindo";
      case "AwaitingInvoicing": return "Aguard. Faturamento";
      default: return status;
    }
  };

  const counts = {
    pending: packingLists.filter((p) => p.status === "Pending").length,
    separating: packingLists.filter((p) => p.status === "InSeparation").length,
    conference: packingLists.filter(
      (p) => p.status === "AwaitingConference" || p.status === "InConference"
    ).length,
  };

  const renderItem = ({ item }: { item: PackingListSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Conference", { packingListId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{item.code}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text style={styles.customerCode}>{item.customerCode}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Itens</Text>
          <Text style={styles.infoValue}>{item.totalItems}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Quantidade</Text>
          <Text style={styles.infoValue}>{item.totalQuantity}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centeredLight}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarOpen(true)}>
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Metalúrgica Formigari</Text>
            <Text style={styles.subtitle}>Expedição</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        {userName ? <Text style={styles.welcomeText}>Olá, {userName}</Text> : null}
      </View>

      <View style={styles.content}>
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: "#f1f5f9" }]}>
            <Text style={[styles.summaryValue, { color: "#475569" }]}>{counts.pending}</Text>
            <Text style={styles.summaryLabel}>Pendentes</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#dbeafe" }]}>
            <Text style={[styles.summaryValue, { color: "#1e40af" }]}>{counts.separating}</Text>
            <Text style={styles.summaryLabel}>Separando</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#e0e7ff" }]}>
            <Text style={[styles.summaryValue, { color: "#4338ca" }]}>{counts.conference}</Text>
            <Text style={styles.summaryLabel}>Conferência</Text>
          </View>
        </View>

        {packingLists.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nenhum romaneio pendente</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
              <Text style={styles.refreshButtonText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={packingLists}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1e40af"]} />
            }
          />
        )}
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentScreen="Home"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#1e3a8a", padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  menuButton: { width: 44, alignItems: "flex-start" },
  headerTitles: { alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "#93c5fd", marginTop: 2 },
  welcomeText: { fontSize: 14, color: "#bfdbfe", marginTop: 12 },
  content: { flex: 1 },
  summaryContainer: { flexDirection: "row", padding: 16, gap: 8 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  summaryValue: { fontSize: 24, fontWeight: "bold" },
  summaryLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  codeContainer: { backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  code: { fontSize: 13, fontWeight: "700", color: "#1e3a8a", fontVariant: ["tabular-nums"] },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  customerName: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  customerCode: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  cardFooter: { flexDirection: "row", gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  infoItem: { alignItems: "center" },
  infoLabel: { fontSize: 11, color: "#9ca3af" },
  infoValue: { fontSize: 16, fontWeight: "700", color: "#374151" },
  centeredLight: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#94a3b8", marginBottom: 16 },
  refreshButton: { backgroundColor: "#1e3a8a", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  refreshButtonText: { color: "#fff", fontWeight: "600" },
});
