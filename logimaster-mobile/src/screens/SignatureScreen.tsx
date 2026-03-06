import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import SignatureCanvas from "react-native-signature-canvas";
import * as Location from "expo-location";
import { deliveryService } from "../services/deliveryService";
import { BASE_URL } from "../services/api";
import { PackingList } from "../types";

export default function SignatureScreen({ route, navigation }: any) {
  const { packingListId, driverName } = route.params;
  const signatureRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    loadPackingList();
    startLocationTracking();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function loadPackingList() {
    try {
      const data = await deliveryService.getById(packingListId);
      setPackingList(data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar o romaneio.");
    } finally {
      setLoading(false);
    }
  }

  async function startLocationTracking() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    // Envia imediatamente e depois a cada 20 segundos
    sendLocation();
    intervalRef.current = setInterval(sendLocation, 20000);
  }

  async function sendLocation() {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await deliveryService.updateLocation(packingListId, {
        driverName,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      // silencioso — não interrompe o fluxo
    }
  }

  async function handleConfirm() {
    if (!hasSignature) {
      Alert.alert("Atenção", "Por favor, colete a assinatura do cliente.");
      return;
    }
    signatureRef.current?.readSignature();
  }

  async function handleSignature(signature: string) {
    try {
      setDelivering(true);

      let latitude: number | undefined;
      let longitude: number | undefined;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }

      const base64 = signature.replace(/^data:image\/\w+;base64,/, "");

      await deliveryService.deliver(packingListId, {
        driverName,
        signatureBase64: base64,
        latitude,
        longitude,
      });

      if (intervalRef.current) clearInterval(intervalRef.current);

      Alert.alert("Entregue!", "Entrega confirmada com sucesso.", [
        { text: "OK", onPress: () => navigation.navigate("DeliveryList") },
      ]);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível confirmar a entrega.");
    } finally {
      setDelivering(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.code}>{packingList?.code}</Text>
        <Text style={styles.customer}>{packingList?.customerName}</Text>
        {packingList?.invoiceNumber && (
          <Text style={styles.invoice}>NF: {packingList.invoiceNumber}</Text>
        )}
      </View>
      {packingList?.hasInvoicePdf && (
  <TouchableOpacity
    style={styles.viewNfBtn}
    onPress={() =>
      Linking.openURL(`${BASE_URL}/api/packinglists/${packingListId}/invoice-pdf`)
    }
  >
    <Text style={styles.viewNfBtnText}>📄 Ver Nota Fiscal</Text>
  </TouchableOpacity>
)}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Itens da Entrega</Text>
        {packingList?.items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemRef}>{item.reference}</Text>
            <Text style={styles.itemDesc} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={styles.itemQty}>Qtd: {item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assinatura do Recebedor</Text>
        <Text style={styles.signatureHint}>
          Peça ao cliente para assinar abaixo:
        </Text>
        <View style={styles.signatureBox}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={() => setHasSignature(false)}
            onBegin={() => setHasSignature(true)}
            descriptionText=""
            clearText="Limpar"
            confirmText="Confirmar"
            webStyle={`
              .m-signature-pad { box-shadow: none; border: none; }
              .m-signature-pad--body { border: none; }
              .m-signature-pad--footer { display: none; }
              body { margin: 0; background: #f8fafc; }
            `}
          />
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => {
            signatureRef.current?.clearSignature();
            setHasSignature(false);
          }}
        >
          <Text style={styles.clearBtnText}>Limpar Assinatura</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, (!hasSignature || delivering) && styles.confirmBtnDisabled]}
        onPress={handleConfirm}
        disabled={!hasSignature || delivering}
      >
        {delivering ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmBtnText}>Confirmar Entrega</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: "#1e3a8a", padding: 20, paddingTop: 50 },
  code: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  customer: { fontSize: 16, color: "#bfdbfe", marginTop: 2 },
  invoice: { fontSize: 13, color: "#93c5fd", marginTop: 4 },
  section: { backgroundColor: "#fff", margin: 12, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1f2937", marginBottom: 10 },
  item: {
    flexDirection: "row", alignItems: "center", paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 8,
  },
  itemRef: { fontSize: 12, fontWeight: "600", color: "#1e3a8a", width: 80 },
  itemDesc: { flex: 1, fontSize: 12, color: "#374151" },
  itemQty: { fontSize: 12, color: "#6b7280" },
  signatureHint: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  signatureBox: {
    height: 200, borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 8, overflow: "hidden", backgroundColor: "#f8fafc",
  },
  clearBtn: { marginTop: 8, alignSelf: "flex-end" },
  clearBtnText: { fontSize: 13, color: "#ef4444" },
  confirmBtn: {
    backgroundColor: "#1e3a8a", margin: 12, padding: 16,
    borderRadius: 12, alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: "#94a3b8" },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  viewNfBtn: {
  backgroundColor: "#1d4ed8",
  margin: 12,
  marginTop: 0,
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
},
viewNfBtnText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "600",
},

});
