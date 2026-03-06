import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { packingListService } from "../services/packingListService";
import { PackingList, PackingListItem } from "../types";

interface Props {
  navigation: any;
  route: any;
}

export default function ConferenceScreen({ navigation, route }: Props) {
  const { packingListId } = route.params;
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPackingList();
  }, []);

  async function loadPackingList() {
    try {
      setLoading(true);
      const pl = await packingListService.getById(packingListId);
      setPackingList(pl);
    } catch (error) {
      console.error("Erro:", error);
      Alert.alert("Erro", "Não foi possível carregar o romaneio");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSeparation() {
    if (!packingList) return;
    try {
      setActionLoading(true);
      const updated = await packingListService.startSeparation(packingList.id);
      setPackingList(updated);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao iniciar separação");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteSeparation() {
    if (!packingList) return;
    try {
      setActionLoading(true);
      const updated = await packingListService.completeSeparation(packingList.id);
      setPackingList(updated);
      Alert.alert("Sucesso", "Separação finalizada! Agora inicie a conferência.");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao finalizar separação");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartConference() {
    if (!packingList) return;
    try {
      setActionLoading(true);
      const updated = await packingListService.startConference(packingList.id);
      setPackingList(updated);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao iniciar conferência");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConferenceItem(itemId: number) {
    if (!packingList) return;
    try {
      const updated = await packingListService.conferenceItem(packingList.id, itemId);
      setPackingList(updated);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao conferir item");
    }
  }

  async function handleCompleteConference() {
    if (!packingList) return;

    const notConferenced = packingList.items.filter((i) => !i.isConferenced);
    if (notConferenced.length > 0) {
      Alert.alert("Atenção", `Ainda faltam ${notConferenced.length} item(s) para conferir`);
      return;
    }

    try {
      setActionLoading(true);
      await packingListService.completeConference(packingList.id);
      Alert.alert("Sucesso", "Conferência finalizada! Romaneio pronto para faturamento.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao finalizar conferência");
    } finally {
      setActionLoading(false);
    }
  }

  function handleScanItem() {
    navigation.navigate("Scanner", {
      packingListId: packingList?.id,
      onScan: (reference: string) => {
        const item = packingList?.items.find(
          (i) => i.reference.toLowerCase() === reference.toLowerCase() && !i.isConferenced
        );
        if (item) {
          handleConferenceItem(item.id);
        } else {
          Alert.alert("Atenção", "Produto não encontrado ou já conferido");
        }
      },
    });
  }

  const conferencedCount = packingList?.items.filter((i) => i.isConferenced).length || 0;
  const totalItems = packingList?.items.length || 0;
  const progress = totalItems > 0 ? (conferencedCount / totalItems) * 100 : 0;

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

  const renderItem = ({ item }: { item: PackingListItem }) => (
    <View style={[styles.itemCard, item.isConferenced && styles.itemConferenced]}>
      <View style={styles.itemHeader}>
        <View style={styles.refContainer}>
          <Text style={styles.refText}>{item.reference}</Text>
        </View>
        {packingList?.status === "InConference" && (
          item.isConferenced ? (
            <View style={styles.checkBadge}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.conferenceButton}
              onPress={() => handleConferenceItem(item.id)}
            >
              <Text style={styles.conferenceButtonText}>Conferir</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Text style={styles.itemDescription}>{item.description}</Text>

      <View style={styles.itemFooter}>
        <View style={styles.qtyBox}>
          <Text style={styles.qtyLabel}>Quantidade</Text>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
        </View>
        {item.unitsPerBox && (
          <View style={styles.qtyBox}>
            <Text style={styles.qtyLabel}>Unid/Caixa</Text>
            <Text style={styles.qtyValue}>{item.unitsPerBox}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  if (!packingList) return null;

  return (
    <View style={styles.container}>
      {/* Header Azul Escuro */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerCode}>{packingList.code}</Text>
        </View>
        <Text style={styles.headerCustomer}>{packingList.customerName}</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{getStatusLabel(packingList.status)}</Text>
        </View>

        {packingList.status === "InConference" && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {conferencedCount} de {totalItems} conferidos
            </Text>
          </View>
        )}
      </View>

      {/* Ações */}
      <View style={styles.actionBar}>
        {packingList.status === "Pending" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#2563eb" }]}
            onPress={handleStartSeparation}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>
              {actionLoading ? "Aguarde..." : "▶ Iniciar Separação"}
            </Text>
          </TouchableOpacity>
        )}

        {packingList.status === "InSeparation" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#22c55e" }]}
            onPress={handleCompleteSeparation}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>
              {actionLoading ? "Aguarde..." : "✓ Finalizar Separação"}
            </Text>
          </TouchableOpacity>
        )}

        {packingList.status === "AwaitingConference" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#1e3a8a" }]}
            onPress={handleStartConference}
            disabled={actionLoading}
          >
            <Text style={styles.actionButtonText}>
              {actionLoading ? "Aguarde..." : "▶ Iniciar Conferência"}
            </Text>
          </TouchableOpacity>
        )}

        {packingList.status === "InConference" && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#2563eb", flex: 1 }]}
              onPress={handleScanItem}
            >
              <Text style={styles.actionButtonText}>📷 Escanear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: progress >= 100 ? "#22c55e" : "#94a3b8", flex: 1 },
              ]}
              onPress={handleCompleteConference}
              disabled={actionLoading || progress < 100}
            >
              <Text style={styles.actionButtonText}>
                {actionLoading ? "Aguarde..." : "✓ Finalizar"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {packingList.status === "AwaitingInvoicing" && (
          <View style={[styles.actionButton, { backgroundColor: "#f59e0b" }]}>
            <Text style={styles.actionButtonText}>Aguardando Faturamento</Text>
          </View>
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={packingList.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    color: "#93c5fd",
    fontSize: 16,
  },
  headerCode: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  headerCustomer: {
    color: "#bfdbfe",
    fontSize: 14,
    marginTop: 8,
  },
  statusContainer: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },
  progressText: {
    color: "#bfdbfe",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  actionBar: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  actionButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  list: {
    padding: 12,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#1e3a8a",
  },
  itemConferenced: {
    borderLeftColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refContainer: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  refText: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "bold",
    color: "#1e40af",
  },
  checkBadge: {
    backgroundColor: "#22c55e",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  conferenceButton: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  conferenceButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  itemDescription: {
    fontSize: 14,
    color: "#1e293b",
  },
  itemFooter: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  qtyBox: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qtyLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
  },
});
