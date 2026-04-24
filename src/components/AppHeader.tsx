import { Ionicons } from "@expo/vector-icons";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
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
  const [avgRating, setAvgRating] = useState(0);

  // ✅ State สำหรับ stats
  const [pendingCount, setPendingCount] = useState(0);       // ออเดอร์วันนี้ (pending)
  const [completedCount, setCompletedCount] = useState(0);   // ออเดอร์ทั้งหมดที่ทำเสร็จ
  const [totalIncome, setTotalIncome] = useState(0);         // รายได้รวม 60%
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);   // ยอดถอนแล้ว
  const balance = Math.max(totalIncome - totalWithdrawn, 0);


  // เพิ่ม Listener completedCount
  // ✅ แก้ไข: ใช้ fare แทน price + คำนวณ avgRating จาก bookings จริง
  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "bookings"),
      where("caregiverId", "==", data.uid),
      where("status", "==", "completed")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setCompletedCount(snap.size);

      let income = 0;
      let totalScore = 0;
      let ratedCount = 0;

      snap.docs.forEach((d) => {
        const booking = d.data();
        // ✅ ใช้ fare (ไม่ใช่ price)
        income += (booking.fare || 0) * 0.6;

        // ✅ คำนวณ avgRating จาก score จริง
        if (booking.score) {
          totalScore += booking.score;
          ratedCount++;
        }
      });

      setTotalIncome(Math.round(income));
      setAvgRating(
        ratedCount > 0
          ? Number((totalScore / ratedCount).toFixed(1))
          : 0
      );
    });

    return () => unsubscribe();
  }, [data?.uid]);

  // ✅ Listener 2: นับงานที่ caregiver คนนี้ทำเสร็จแล้ว + คำนวณรายได้
  // ✅ Listener ถอนเงิน (ต้องมี)
  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "withdrawals"),
      where("caregiverId", "==", data.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const withdrawn = snap.docs
        .map((d) => d.data())
        .filter((w: any) => w.status === "approved") // ✅ สำคัญมาก
        .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

      setTotalWithdrawn(withdrawn);
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
  // ✅ แทน Listener 1 ทั้งหมด
  useEffect(() => {
    if (!data?.uid) return;

    let bookingUnsub: (() => void) | null = null;

    // ─── Step 1: Listen gender แบบ real-time ───
    const caregiverUnsub = onSnapshot(
      doc(db, "caregivers", data.uid),
      (caregiverSnap) => {
        if (!caregiverSnap.exists()) return;

        const gender = caregiverSnap.data().gender;
        if (!gender) return;

        // ─── Step 2: ยกเลิก booking listener เดิมก่อน ───
        if (bookingUnsub) bookingUnsub();

        // ─── Step 3: Subscribe bookings ใหม่ตาม gender ───
        const q = query(
          collection(db, "bookings"),
          where("status", "==", "pending"),
          where("gender_Care", "in", [gender, "disabled"])
        );

        bookingUnsub = onSnapshot(q, (snap) => {
          const today = new Date();
          const thaiMonthNames = [
            "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
            "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
            "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
          ];
          const day = today.getDate().toString();
          const month = thaiMonthNames[today.getMonth()];

          const todayBookings = snap.docs.filter((docSnap) => {
            const raw = docSnap.data().dateBooking || "";
            return raw.includes(day) && raw.includes(month);
          });

          setPendingCount(todayBookings.length);
        });
      }
    );

    // ─── Cleanup ทั้งคู่ ───
    return () => {
      caregiverUnsub();
      if (bookingUnsub) bookingUnsub();
    };
  }, [data?.uid]); // ✅ depend on uid เท่านั้น

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
              <Text style={styles.balance}>
                ฿{balance.toLocaleString()}
              </Text>
              <Text style={styles.subText}>ยอดเงินคงเหลือ</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox number={pendingCount.toString()} label="ออเดอร์วันนี้" />
          <StatBox number={completedCount.toString()} label="ออเดอร์ทั้งหมด" />
          <StatBox number={avgRating.toString()} label="คะแนนเฉลี่ย" />
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
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              setOpen(false);
              navigation.navigate("Profile");
            }}
          >
            <Ionicons name="person-outline" size={20} />
            <Text style={styles.menuItem}>ข้อมูลส่วนตัว</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow}>
            <Ionicons name="settings-outline" size={20} />
            <Text style={styles.menuItem}>การตั้งค่า</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow}>
            <Ionicons name="help-circle-outline" size={20} />
            <Text style={styles.menuItem}>ศูนย์ช่วยเหลือ</Text>
          </TouchableOpacity>
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

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgb(26, 139, 102)",
  },

});