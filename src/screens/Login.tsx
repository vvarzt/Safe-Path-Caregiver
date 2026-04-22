import { useNavigation } from "@react-navigation/native";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSignup } from "../context/SignupContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useRef } from "react"; import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

import { RootStackParamList } from "../navigation/AppNavigator";

// 🔥 Firebase
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/* navigation type */
type LoginNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const { setData } = useSignup();
  /* ================= LOGIN ================= */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("กรอกข้อมูลไม่ครบ");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("อีเมลไม่ถูกต้อง");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = userCredential.user.uid;

      const docRef = doc(db, "caregivers", uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        Alert.alert("ไม่พบบัญชี");
        return;
      }

      const userData = docSnap.data();

      if (userData.status !== "caregiver") {
        Alert.alert("บัญชีไม่ใช่ caregiver");
        return;
      }

      // ✅ context session
      const session = {
        uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        status: userData.status,
        isApproved: userData.isApproved,
      };

      setData(session);

      // ✅ persist session
      await AsyncStorage.setItem("session", JSON.stringify(session));

      navigation.replace("MainTabs");

    } catch (error) {
      console.log(error);
      Alert.alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>เข้าสู่ระบบ</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>เข้าสู่ระบบบัญชีของคุณ</Text>
          <Text style={styles.subtitle}>ยินดีต้อนรับกลับ</Text>

          <Text style={styles.label}>อีเมล</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={styles.label}>รหัสผ่าน</Text>
          <View style={styles.passwordBox}>
            <TextInput
              ref={passwordRef}
              style={{ flex: 1 }}
              placeholder="กรอกรหัสผ่าน"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {/* Remember */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRemember(!remember)}
            >
              <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                {remember && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>จดจำรหัสผ่าน</Text>
            </TouchableOpacity>

            <Text style={styles.forgot}>ลืมรหัสผ่าน</Text>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            ยังไม่มีบัญชี ?{" "}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("Signup1")}
            >
              ลงทะเบียน
            </Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

/* ===== STYLE ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },

  header: {
    backgroundColor: "#43B7A5",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
  },

  back: { fontSize: 22, marginRight: 12 },
  headerTitle: { fontSize: 25, fontWeight: "600" },

  content: { padding: 24 },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 25,
  },

  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 12,
  },

  label: { marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
  },

  passwordBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
  },



  show: { fontSize: 18 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  checkboxRow: { flexDirection: "row", alignItems: "center" },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#43B7A5",
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxChecked: { backgroundColor: "#43B7A5" },

  checkmark: { color: "#FFF", fontSize: 12 },

  rememberText: { color: "#374151" },

  forgot: { color: "#43B7A5" },

  loginButton: {
    backgroundColor: "#43B7A5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },

  loginText: { color: "#FFF", fontWeight: "600" },

  footer: { textAlign: "center", color: "#6B7280" },

  link: { color: "#43B7A5", fontWeight: "600" },
});