import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { deliveryService } from "../services/deliveryService";
import { PackingListSummary } from "../types";
import Sidebar from "../components/Sidebar";

export default function DeliveryListScreen({ navigation }: any) {
  const [deliveries, setDeliveries] = useState<PackingListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadUserName();
    loadDeliveries();
  }, []);

  async function loadUserName() {
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.name || user.email || "Motorista");
    }
  }

  async function loadDeliveries() {
    try {
      const data = await deliveryService.getForDelivery();
      setDeliveries(data);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível carregar as entregas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDeliveries();
  }, []);

  function getStatusColor(status: string) {
    if (status === "Dispatched") return "#f59e0b";
    if (status === "Invoiced") return "#3b82f6";
    if (status === "Delivered") return "#10b981";
    return "#6b7280";
  }

  function renderItem({ item }: { item: PackingListSummary }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Signature", {
            packingListId: item.id,
            driverName: userName,
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.code}>{item.code}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.statusName}</Text>
          </View>
        </View>
        <Text style={styles.customer}>{item.customerName}</Text>
        {item.invoiceNumber && (
          <Text style={styles.detail}>NF: {item.invoiceNumber}</Text>
        )}
        <Text style={styles.detail}>
          {item.totalItems} itens · R${" "}
          {item.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
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
          <View style={{ alignItems: "center" }}>
            <Text style={styles.title}>Minhas Entregas</Text>
            <Text style={styles.subtitle}>{userName}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nenhuma entrega pendente</Text>
          </View>
        }
        contentContainerStyle={deliveries.length === 0 ? styles.centerFlex : undefined}
      />

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentScreen="DeliveryList"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#1e3a8a", padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#93c5fd", marginTop: 2 },
  card: {
    backgroundColor: "#fff", margin: 12, marginBottom: 0, borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  code: { fontSize: 15, fontWeight: "bold", color: "#1e3a8a" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  customer: { fontSize: 16, color: "#1f2937", marginBottom: 4 },
  detail: { fontSize: 13, color: "#6b7280" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerFlex: { flex: 1 },
  emptyText: { fontSize: 16, color: "#9ca3af" },
});
