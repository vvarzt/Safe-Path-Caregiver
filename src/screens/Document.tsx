import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import * as Print from "expo-print";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSignup } from "../context/SignupContext";

export default function Document() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data } = useSignup();

  const handleExport = async () => {
    const rows = dailyList.map(item => `
    <tr>
      <td>${item.date}</td>
      <td>${item.count}</td>
      <td>${Math.round(item.total).toLocaleString()}</td>
    </tr>
  `).join("");

    const html = `
    <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2>รายงานรายได้ Caregiver</h2>

        <p>เดือน: ${selectedMonth.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    })}</p>

        <h3>สรุป</h3>
        <p>จำนวนงาน: ${totalJobs} งาน</p>
        <p>รายได้รวม: ${Math.round(totalIncome).toLocaleString()} บาท</p>

        <h3>รายละเอียดรายวัน</h3>
        <table border="1" cellpadding="8" cellspacing="0" width="100%">
          <tr>
            <th>วันที่</th>
            <th>จำนวนงาน</th>
            <th>รายได้</th>
          </tr>
          ${rows}
        </table>
      </body>
    </html>
  `;

    await Print.printAsync({ html });
  };

  // ===== PROFILE SLIDE =====
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const filteredBookings = bookings.filter((b) => {
    if (!b.completedAt) return false;

    const date = new Date(b.completedAt);

    return (
      date.getMonth() === selectedMonth.getMonth() &&
      date.getFullYear() === selectedMonth.getFullYear()
    );
  });

  const totalJobs = filteredBookings.length;

  const totalIncome = filteredBookings.reduce((sum, b) => {
    return sum + (b.fare || 0) * 0.9;
  }, 0);

  const groupedByDate: Record<string, any[]> = {};

  filteredBookings.forEach((b) => {
    const date = new Date(b.completedAt).toLocaleDateString("th-TH");

    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }

    groupedByDate[date].push(b);
  });

  const dailyList = Object.keys(groupedByDate)
  .map((date) => {
    const items = groupedByDate[date];

    const total = items.reduce(
      (sum, b) => sum + (b.fare || 0) * 0.9,
      0
    );

    return {
      date,
      count: items.length,
      total,
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleProfile = () => {
    if (open) {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setOpen(false));
    } else {
      setOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedMonth(newDate);
  };

  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "bookings"),
      where("status", "==", "completed"),
      where("caregiverId", "==", data.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setBookings(list);
    });

    return () => unsub();
  }, [data?.uid]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <AppHeader />

      {/* CONTENT */}
      <ScrollView style={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>เอกสารรายได้</Text>

        {/* เลือกเดือน */}
        <View style={styles.card}>
          <Text style={{ marginBottom: 8 }}>เลือกเดือน</Text>
          <View style={styles.dropdown}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={18} />
            </TouchableOpacity>

            <Text>
              {selectedMonth.toLocaleDateString("th-TH", {
                month: "long",
                year: "numeric",
              })}
            </Text>

            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text>จำนวนงาน</Text>
            <Text style={styles.bigText}>{totalJobs}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text>รายได้รวม</Text>
            <Text style={styles.bigText}>
              ฿{Math.round(totalIncome).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* LIST */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>สรุปรายได้ประจำเดือน</Text>
          {dailyList.length === 0 && (
            <Text style={{ textAlign: "center", color: "#9CA3AF" }}>
              ไม่มีข้อมูลในเดือนนี้
            </Text>
          )}
          {dailyList.map((item, index) => (
            <View key={index} style={styles.row}>
              <View>
                <Text>{item.date}</Text>
                <Text style={styles.subGray}>{item.count} ออเดอร์</Text>
              </View>
              <Text style={styles.money}>
                ฿{Math.round(item.total).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* DOWNLOAD */}
        <TouchableOpacity style={styles.downloadBtn} onPress={handleExport}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={{ color: "#fff" }}>
            ดาวน์โหลดเอกสารรายได้ (PDF)
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
        style={[
          styles.profilePanel,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: data.image || "https://i.pravatar.cc/100" }}
            style={styles.profileAvatar}
          />
          <Text style={styles.profileName}>
            {data.firstName} {data.lastName}
          </Text>
          <Text style={styles.profileRole}>Caregiver</Text>
        </View>

        <View style={styles.menu}>
          <Text style={styles.menuItem}>การตั้งค่า</Text>
          <Text style={styles.menuItem}>ศูนย์ช่วยเหลือ</Text>
        </View>

        <Text style={styles.logout}>ออกจากระบบ</Text>
      </Animated.View>


    </View>
  );
}

/* COMPONENT */
const StatBox = ({ number, label }: any) => (
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

//   const isActive =
//     (icon === "menu" && activeTab === "home") ||
//     (icon === "wallet-outline" && activeTab === "wallet") ||
//     (icon === "time-outline" && activeTab === "history") ||
//     (icon === "document-text" && activeTab === "doc");

//   const color = isActive ? "#43B7A5" : "#9CA3AF";

//   return (
//     <TouchableOpacity onPress={onPress} style={styles.tabItem}>
//       <Ionicons name={icon} size={28} color={color} />
//     </TouchableOpacity>
//   );
// };

/* STYLE */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    backgroundColor: "#43B7A5",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  headerTop: { flexDirection: "row", alignItems: "center" },

  rightSection: { marginLeft: "auto", alignItems: "flex-end" },

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

  statNumber: { color: "#fff", fontWeight: "700" },

  statLabel: { color: "#E6FFFA", fontSize: 12 },

  sectionTitle: { fontWeight: "600", marginBottom: 10 },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryBox: {
    backgroundColor: "#7BC9B7",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  summaryItem: { width: "48%" },

  bigText: { fontSize: 20, fontWeight: "700" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  subGray: { color: "#6B7280" },

  money: { color: "green", fontWeight: "600" },

  downloadBtn: {
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  profilePanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
  },

  profileHeader: {
    backgroundColor: "#43B7A5",
    padding: 20,
    alignItems: "center",
    paddingTop: 85,
  },

  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },

  profileName: { color: "#fff", fontWeight: "600" },

  profileRole: { color: "#D1FAE5", fontSize: 12 },

  menu: { padding: 20 },

  menuItem: { paddingVertical: 12 },

  logout: {
    color: "#43B7A5",
    textAlign: "center",
    marginTop: 20,
    fontWeight: "600",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 90,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  tabItem: { flex: 1, alignItems: "center" },
});