import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ConferenceScreen from "./src/screens/ConferenceScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import DeliveryListScreen from "./src/screens/DeliveryListScreen";
import SignatureScreen from "./src/screens/SignatureScreen";
import InventoryScreen from "./src/screens/InventoryScreen";
import RecebimentoScreen from "./src/screens/RecebimentoScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<"Login" | "Home" | "DeliveryList">("Login");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) { setInitialRoute("Login"); return; }
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      setInitialRoute(user?.role === "Driver" ? "DeliveryList" : "Home");
    } catch {
      setInitialRoute("Login");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DeliveryList" component={DeliveryListScreen} />
        <Stack.Screen name="Recebimento" component={RecebimentoScreen} />
        <Stack.Screen name="Inventory" component={InventoryScreen} />
        <Stack.Screen name="Conference" component={ConferenceScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="Signature" component={SignatureScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
