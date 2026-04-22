import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

// ✅ type navigation
type NavProp = NativeStackNavigationProp<RootStackParamList, "SignupSuccess">;

export default function SignupSuccessScreen() {
  const navigation = useNavigation<NavProp>();

  const handleNext = () => {
    // 🔥 ใช้ replace จะย้อนกลับไป Signup ไม่ได้ (แนะนำ)
    navigation.replace("MainTabs");
  };

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>สร้างบัญชี</Text>
      </View>

      {/* ===== CONTENT ===== */}
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>

        <Text style={styles.title}>รอตรวจสอบเอกสาร{"\n"}ประมาณ 1-2 วัน</Text>

        <Text style={styles.subtitle}>
          เมื่อการตรวจสอบเสร็จสิ้น จะแจ้งให้ทราบทางแอป
        </Text>
      </View>

      {/* ===== BUTTON ===== */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>ถัดไป</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===== STYLE ===== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    backgroundColor: "#43B7A5",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  back: {
    fontSize: 22,
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  icon: {
    fontSize: 80,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  footer: {
    padding: 20,
  },

  button: {
    backgroundColor: "#43B7A5",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
