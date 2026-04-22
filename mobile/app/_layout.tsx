import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/contexts/AuthContext";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../src/constants";
import { initializeOpenTelemetry } from "../src/services/otel";

export default function RootLayout() {
  useEffect(() => {
    initializeOpenTelemetry();
  }, []);

  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
            headerShadowVisible: false,
          }}
        >
          {/* Tabs has its own headers — hide the Stack header to avoid double */}
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
