import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const SIDEBAR_WIDTH = 280;

// AppModule bitmask bits (mirrors AppModule.cs)
const BITS = {
  RomaneiosView: 1 << 0,
  EstoqueView: 1 << 20,
};

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  permBit?: number;       // required permission bit (undefined = always visible)
  driverOnly?: boolean;   // only visible to Driver role
};

const MENU: MenuItem[] = [
  {
    key: "Home",
    label: "Romaneios",
    icon: "document-text-outline",
    permBit: BITS.RomaneiosView,
  },
  {
    key: "DeliveryList",
    label: "Minhas Entregas",
    icon: "car-outline",
    driverOnly: true,
  },
  {
    key: "Recebimento",
    label: "Recebimento MP",
    icon: "arrow-down-circle-outline",
    permBit: BITS.EstoqueView,
  },
  {
    key: "Inventory",
    label: "Inventário",
    icon: "cube-outline",
    permBit: BITS.EstoqueView,
  },
];

const ROLE_LABELS: Record<string, string> = {
  Administrator: "Administrador",
  Shipping: "Expedição",
  LogisticsAnalyst: "Analista Log.",
  Driver: "Motorista",
  Invoicing: "Faturamento",
  Viewer: "Visualizador",
};

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  currentScreen: string;
};

export default function Sidebar({ visible, onClose, navigation, currentScreen }: Props) {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("user").then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  if (!rendered) return null;

  const isAdmin = user?.role === "Administrator";
  const isDriver = user?.role === "Driver";
  const permBits: number = user?.permissions ?? 0;

  const visibleMenu = MENU.filter((item) => {
    if (item.driverOnly) return isDriver;
    if (isAdmin) return true;
    if (item.permBit === undefined) return true;
    return (permBits & item.permBit) !== 0;
  });

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  async function handleLogout() {
    onClose();
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setTimeout(() => navigation.replace("Login"), 220);
  }

  function handleNavigate(key: string) {
    onClose();
    if (key !== currentScreen) {
      setTimeout(() => navigation.replace(key), 220);
    }
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Overlay escuro */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: bgOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Painel lateral */}
      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        {/* Logo / Header */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>LM</Text>
          </View>
          <Text style={styles.company}>Sua Empresa</Text>
          <Text style={styles.module}>Expedição · Logística</Text>
        </View>

        {/* Info do usuário */}
        {user && (
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </Text>
              </View>
              {user.employeeId ? (
                <Text style={styles.re}>RE {user.employeeId}</Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Menu */}
        <ScrollView
          style={styles.menu}
          showsVerticalScrollIndicator={false}
        >
          {visibleMenu.map((item) => {
            const isActive = currentScreen === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => handleNavigate(item.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? "#fff" : "#93c5fd"}
                />
                <Text
                  style={[styles.menuLabel, isActive && styles.menuLabelActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#f87171" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#0f172a",
  },
  header: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  logoPlaceholder: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: "#1e3a8a",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  logoPlaceholderText: { fontSize: 26, fontWeight: "bold", color: "#60a5fa" },
  company: { fontSize: 15, fontWeight: "bold", color: "#f1f5f9", textAlign: "center" },
  module: { fontSize: 11, color: "#475569", marginTop: 3 },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 14,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#1e3a8a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  avatarText: { fontSize: 17, fontWeight: "bold", color: "#fff" },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  roleBadge: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  roleText: { fontSize: 11, color: "#93c5fd", fontWeight: "600" },
  re: { fontSize: 11, color: "#475569", marginTop: 4 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 16,
    marginVertical: 6,
  },
  menu: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 3,
  },
  menuItemActive: { backgroundColor: "#1e3a8a" },
  menuLabel: { fontSize: 15, color: "#93c5fd", fontWeight: "500" },
  menuLabelActive: { color: "#fff", fontWeight: "700" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  logoutText: { fontSize: 15, color: "#f87171", fontWeight: "600" },
  version: {
    textAlign: "center",
    fontSize: 11,
    color: "#1e293b",
    marginBottom: 24,
  },
});
