import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSignup } from "../context/SignupContext";
import { db } from "../firebase";

export default function AppHeader() {
  const { data } = useSignup();
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const navigation = useNavigation<any>();

  // ✅ State สำหรับ stats
  const [pendingCount, setPendingCount] = useState(0);       // ออเดอร์วันนี้ (pending)
  const [completedCount, setCompletedCount] = useState(0);   // ออเดอร์ทั้งหมดที่ทำเสร็จ
  const [totalIncome, setTotalIncome] = useState(0);         // รายได้รวม 60%
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);   // ยอดถอนแล้ว

  // ✅ Listener 1: นับ pending bookings
  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setPendingCount(snap.size);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Listener 2: นับงานที่ caregiver คนนี้ทำเสร็จแล้ว + คำนวณรายได้
  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "bookings"),
      where("status", "==", "completed"),
      where("caregiverId", "==", data.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setCompletedCount(snap.size);

      const income = snap.docs.reduce((sum, doc) => {
        const fare = doc.data().fare || 0;
        return sum + fare * 0.6;
      }, 0);

      setTotalIncome(Math.round(income));
    });

    return () => unsubscribe();
  }, [data?.uid]);
const handleLogout = async () => {
  try {
    await signOut(auth);

    // ปิด panel
    setOpen(false);

    // 🔥 กลับหน้า login (แล้วแต่ navigator ของคุณ)
    navigation.replace("Login"); 
    // หรือ navigation.navigate("Login");

  } catch (error) {
    console.log("LOGOUT ERROR:", error);
  }
};
  // ✅ Listener 3: ประวัติถอนเงิน
  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "withdrawals"),
      where("caregiverId", "==", data.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const withdrawn = snap.docs
        .filter((d) => d.data().status === "approved")
        .reduce((sum, d) => sum + (d.data().amount || 0), 0);

      setTotalWithdrawn(withdrawn);
    });

    return () => unsubscribe();
  }, [data?.uid]);

  const toggleProfile = () => {
    Animated.timing(slideAnim, {
      toValue: open ? -300 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setOpen(!open));
  };

  return (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={toggleProfile}>
            <Image
              source={{ uri: data.image || "https://i.pravatar.cc/100" }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <View>
            <Text style={styles.greeting}>สวัสดี {data.firstName}!</Text>
            <Text style={styles.role}>Caregiver</Text>
          </View>

          <View style={styles.rightSection}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.balance}>฿{(totalIncome - totalWithdrawn).toLocaleString()}</Text>
              <Text style={styles.subText}>ยอดเงินคงเหลือ</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox number={pendingCount.toString()} label="ออเดอร์วันนี้" />
          <StatBox number={completedCount.toString()} label="ออเดอร์ทั้งหมด" />
          <StatBox number="4.5" label="คะแนนเฉลี่ย" />
        </View>
      </View>

      {/* OVERLAY */}
      {open && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleProfile}
          activeOpacity={1}
        />
      )}

      {/* PROFILE PANEL */}
      <Animated.View
        style={[styles.profilePanel, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: data.image || "https://i.pravatar.cc/100" }}
            style={styles.profileAvatar}
          />
          <Text style={styles.profileName}>{data.firstName} {data.lastName}</Text>
          <Text style={styles.profileRole}>Caregiver</Text>
        </View>

        <View style={styles.menu}>
          <Text style={styles.menuItem}>การตั้งค่า</Text>
          <Text style={styles.menuItem}>ศูนย์ช่วยเหลือ</Text>
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const StatBox = ({ number, label }: any) => (
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#43B7A5",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  rightSection: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  greeting: { color: "#fff", fontSize: 16, fontWeight: "600" },
  role: { color: "#D1FAE5", fontSize: 12 },
  balance: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subText: { color: "#D1FAE5", fontSize: 12 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  statBox: {
    backgroundColor: "#5EC4B6",
    width: "30%",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  statNumber: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#E6FFFA", fontSize: 12 },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 10,
    elevation: 10,
  },
  profilePanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
    zIndex: 20,
    elevation: 20,
  },
  profileHeader: {
    backgroundColor: "#43B7A5",
    padding: 20,
    alignItems: "center",
    paddingTop: 85,
  },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  profileName: { color: "#fff", fontWeight: "600" },
  profileRole: { color: "#D1FAE5", fontSize: 12 },
  menu: { padding: 20 },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  logout: {
    color: "#43B7A5",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },
});