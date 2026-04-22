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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!username || !email || !password || !confirm) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      router.replace("/tabs/discover");
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message);
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
        <Text style={styles.subtitle}>Create your account</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={base.input}
            placeholder="Username (alias)"
            placeholderTextColor={COLORS.textTertiary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            maxLength={50}
          />
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
          <TextInput
            style={base.input}
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.textTertiary}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          {/* Clay CTA */}
          <TouchableOpacity
            style={[clay.button, clay.primary, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={clay.buttonText}>
              {loading ? "Creating account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <Link href="/auth/login" style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={styles.linkHighlight}>Sign In</Text>
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
