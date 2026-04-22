import { Redirect } from "expo-router";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { COLORS, FONTS, SPACING } from "../src/constants";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.brand}>Third Wheel</Text>
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/tabs/discover" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  brand: {
    fontSize: FONTS.hero,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -1,
  },
});
