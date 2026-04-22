import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { COLORS, FONTS, SPACING, RADIUS } from "../../src/constants";
import { base, clay } from "../../src/styles";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/tabs/discover");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Brand */}
        <Text style={styles.brand}>Third Wheel</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={base.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={base.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Clay CTA */}
          <TouchableOpacity
            style={[clay.button, clay.primary, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={clay.buttonText}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <Link href="/auth/register" style={styles.link}>
            <Text style={styles.linkText}>
              Don't have an account?{" "}
              <Text style={styles.linkHighlight}>Sign Up</Text>
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  brand: {
    fontSize: FONTS.hero,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: -1,
    // Rich shadow on the brand name for depth
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryStrong,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  subtitle: {
    fontSize: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  form: {
    gap: SPACING.md,
  },
  link: {
    alignSelf: "center",
    marginTop: SPACING.md,
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  linkHighlight: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
