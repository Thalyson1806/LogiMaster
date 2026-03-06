import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

interface Props {
  navigation: any;
  route: any;
}

export default function ScannerScreen({ navigation, route }: Props) {
  const { onScan } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [showManual, setShowManual] = useState(false);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Carregando câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          Precisamos de acesso à câmera para escanear códigos de barras
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Permitir Câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManual(true)}
        >
          <Text style={styles.manualButtonText}>Digitar código manualmente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (onScan) {
      onScan(data);
    }
    navigation.goBack();
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert("Atenção", "Digite o código do produto");
      return;
    }

    if (onScan) {
      onScan(manualCode.trim());
    }
    navigation.goBack();
  };

  if (showManual) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digitar Código</Text>
        </View>

        <View style={styles.manualContainer}>
          <Text style={styles.manualLabel}>Código do Produto (Referência)</Text>
          <TextInput
            style={styles.manualInput}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="Ex: PROD001"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            autoFocus
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
            <Text style={styles.submitButtonText}>Conferir Produto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setShowManual(false)}
          >
            <Text style={styles.switchButtonText}>Usar Scanner</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "code128", "code39", "qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.overlayBackButton}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={styles.overlayTitle}>Escanear Código</Text>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanText}>Aponte para o código de barras</Text>
          </View>

          <View style={styles.overlayFooter}>
            <TouchableOpacity
              style={styles.manualScanButton}
              onPress={() => setShowManual(true)}
            >
              <Text style={styles.manualScanButtonText}>Digitar código manualmente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e3a8a",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#475569",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  manualButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  manualButtonText: {
    color: "#1e3a8a",
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlayHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  overlayBackButton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  overlayTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 280,
    height: 180,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#60a5fa",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
  },
  overlayFooter: {
    padding: 20,
    paddingBottom: 40,
  },
  manualScanButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  manualScanButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  header: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    color: "#93c5fd",
    fontSize: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  manualContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontFamily: "monospace",
    color: "#1e293b",
  },
  submitButton: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  switchButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  switchButtonText: {
    color: "#1e3a8a",
    fontSize: 14,
  },
});
