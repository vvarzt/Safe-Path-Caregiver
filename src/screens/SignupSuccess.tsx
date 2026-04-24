import React, { useEffect } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Ionicons } from "@expo/vector-icons";

type NavProp = NativeStackNavigationProp<RootStackParamList, "SignupSuccess">;

export default function SignupSuccessScreen() {
  const navigation = useNavigation<NavProp>();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const unsub = onSnapshot(doc(db, "caregivers", user.uid), (snap) => {
        console.log("DOC EXISTS:", snap.exists());

        if (!snap.exists()) {
          console.log("❌ ไม่มี document นี้");
          return;
        }

        const data = snap.data();
        console.log("🔥 FULL DATA:", data);

        if (data.isApproved === true) {
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          });
        }
      });

      return () => unsub();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <View style={styles.container}>

      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>สร้างบัญชี</Text>
      </View>

      {/* ===== CONTENT ===== */}
      <View style={styles.content}>
        <Ionicons name="hourglass-outline" size={40} color="#43B7A5" />

        <Text style={styles.title}>
          รอตรวจสอบเอกสาร
        </Text>

        <Text style={styles.subtitle}>
          ระบบกำลังตรวจสอบข้อมูลของคุณ{"\n"}
          ใช้เวลาประมาณ 1-2 วัน
        </Text>
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
