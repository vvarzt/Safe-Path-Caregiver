import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection, // 👈 เพิ่ม
  doc // 👈 เพิ่ม
  ,
  getDoc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { useSignup } from "../context/SignupContext";
import { db } from "../firebase";

export default function History() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const { data } = useSignup();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState("history");

  // 🔥 PROFILE SLIDE
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const formatDate = (raw: any) => {
    if (!raw) return "-";
    const d = raw?.toDate ? raw.toDate() : new Date(raw);
    return d.toLocaleString("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusText = (status: string) => {
    const map: any = {
      completed: "เสร็จสิ้น",
      cancelled: "ยกเลิก",
      pending: "รอดำเนินการ",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: any = {
      completed: "#10B981",
      cancelled: "#EF4444",
      pending: "#F59E0B",
    };
    return map[status] || "#6B7280";
  };


  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "bookings"),
      where("caregiverId", "==", data.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const booking = d.data();

          // ❌ ไม่เอา cancelled
          if (booking.status === "cancelled") return null;

          let customerName = "-";
          let customerPhone = "-";

          // ✅ ดึงจาก users ด้วย uid
          if (booking.userId) {
            try {
              const userSnap = await getDoc(doc(db, "users", booking.userId));
              if (userSnap.exists()) {
                const u = userSnap.data();
                customerName = u.fullname || u.fullName || u.name || "-";
                customerPhone = u.phone || "-";
              }
            } catch (e) {
              console.log("❌ USER FETCH ERROR:", e);
            }
          }

          return {
            id: d.id,
            ...booking,
            customerName,
            customerPhone,
          };
        })
      );

      // ✅ เอา null ออก + sort
      const filtered = list
        .filter((item) => item !== null)
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

      setHistory(filtered);
    });

    return () => unsub();
  }, [data?.uid]);
  const toggleProfile = () => {
    Animated.timing(slideAnim, {
      toValue: open ? -300 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setOpen(!open));
  };


  return (
    <View style={styles.container}>
      {/* HEADER */}
      <AppHeader />

      {/* CONTENT */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>ประวัติการทำงาน</Text>
        }
        renderItem={({ item }) => {
          const income = Math.round((item.fare || 0) * 0.9);

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedJob(item);
                setShowModal(true);
              }}
            >
              <View style={styles.card}>

                {/* TOP */}
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>
                    งานดูแลผู้ป่วย
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor(item.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {statusText(item.status)}
                    </Text>
                  </View>
                </View>

                {/* DATE */}
                <Text style={styles.grayText}>
                  ⏱ {formatDate(item.createdAt)} | 📍{" "}
                  {item.distance ? `${item.distance} km` : "-"}
                </Text>

                {/* USER */}
                <View style={styles.userRow}>
                  <Ionicons name="person" size={18} />
                  <View>
                    <Text>{item.customerName || "-"}</Text>
                    <Text style={styles.grayText}>
                      {item.customerPhone || "-"}
                    </Text>
                  </View>
                </View>

                {/* LOCATION */}
                <View style={styles.locationRow}>
                  <View style={styles.fromBox}>
                    <Text style={styles.grayText}>จุดรับ</Text>
                    <Text style={styles.bold}>
                      {item.fromLocation?.address || "-"}
                    </Text>
                  </View>

                  <View style={styles.toBox}>
                    <Text style={styles.grayText}>ปลายทาง</Text>
                    <Text style={styles.bold}>
                      {item.toLocation?.address || "-"}
                    </Text>
                  </View>
                </View>

                {/* NOTE */}
                {item.note && (
                  <View style={styles.noteBox}>
                    <Text>{item.note}</Text>
                  </View>
                )}

                {/* PRICE */}
                <View style={styles.priceRow}>
                  <Text>รายได้</Text>
                  <Text style={styles.price}>
                    ฿{income.toLocaleString()}
                  </Text>
                </View>
              </View></TouchableOpacity>
          );
        }}
      />
      {showModal && selectedJob && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดงาน</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(selectedJob.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {statusText(selectedJob.status)}
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }} // 👈 เพิ่ม
            >

              {/* USER */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 ลูกค้า</Text>
                <Text>{selectedJob.customerName}</Text>
                <Text style={styles.grayText}>
                  {selectedJob.customerPhone}
                </Text>
              </View>

              {/* BOOKING */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 ข้อมูลงาน</Text>
                <Text>วันที่: {selectedJob.dateBooking}</Text>
                <Text>เวลา: {selectedJob.timeBooking}</Text>
                <Text>ระยะทาง: {selectedJob.distance} km</Text>
              </View>

              {/* LOCATION */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 เส้นทาง</Text>
                <Text style={styles.label}>จุดรับ</Text>
                <Text>{selectedJob.fromLocation?.address}</Text>

                <Text style={[styles.label, { marginTop: 8 }]}>ปลายทาง</Text>
                <Text>{selectedJob.toLocation?.address}</Text>
              </View>

              {/* DETAIL */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🧾 รายละเอียด</Text>
                <Text>ผู้ป่วย: {selectedJob.gender_Care}</Text>
                <Text>
                  อุปกรณ์: {selectedJob.equipment?.join(", ") || "-"}
                </Text>
                <Text>ชำระเงิน: {selectedJob.paymentMethod}</Text>
              </View>

              {/* TIMELINE */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏱ Timeline</Text>
                <Text>รับงาน: {formatDate(selectedJob.acceptedAt)}</Text>
                <Text>เริ่มงาน: {formatDate(selectedJob.startedAt)}</Text>
                <Text>เสร็จ: {formatDate(selectedJob.completedAt)}</Text>
              </View>

              {/* PRICE */}
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>ค่าโดยสาร</Text>
                <Text style={styles.priceValue}>
                  ฿{selectedJob.fare?.toLocaleString()}
                </Text>

                <Text style={styles.priceLabel}>รายได้ </Text>
                <Text style={styles.income}>
                  ฿{Math.round((selectedJob.fare || 0) * 0.9).toLocaleString()}
                </Text>
              </View>

            </ScrollView>

            {/* CLOSE */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>ปิด</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
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
            source={{
              uri: data.image || "https://i.pravatar.cc/100",
            }}
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
          <Text style={styles.menuItem}>เวอร์ชั่น</Text>
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

  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },

  greeting: { color: "#fff", fontWeight: "600" },
  role: { color: "#D1FAE5", fontSize: 12 },

  balance: { color: "#fff", fontSize: 22, fontWeight: "700" },
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

  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },

  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12, // 👈 เพิ่ม spacing
    elevation: 1,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  price: {
    color: "#10B981",
    fontWeight: "700",
    fontSize: 16,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },



  grayText: { color: "#6B7280", fontSize: 12 },

  userRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 10,
  },

  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  fromBox: {
    borderWidth: 1,
    borderColor: "green",
    padding: 8,
    borderRadius: 8,
    width: "48%",
  },

  toBox: {
    borderWidth: 1,
    borderColor: "red",
    padding: 8,
    borderRadius: 8,
    width: "48%",
  },

  bold: { fontWeight: "600" },

  noteBox: {
    backgroundColor: "#E5E7EB",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
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

  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  logout: {
    color: "#43B7A5",
    textAlign: "center",
    marginTop: 20,
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

  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    maxHeight: "80%",   // 👈 เพิ่มตัวนี้
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  closeButton: {
    marginTop: 15,
    backgroundColor: "#EF4444",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },



  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  section: {
    marginTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },



  label: {
    fontSize: 12,
    color: "#6B7280",
  },

  priceBox: {
    marginTop: 15,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
  },

  priceLabel: {
    fontSize: 12,
    color: "#6B7280",
  },

  priceValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  income: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },

  tabItem: { flex: 1, alignItems: "center" },
});