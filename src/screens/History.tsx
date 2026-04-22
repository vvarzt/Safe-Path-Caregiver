import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
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

export default function History() {
  const { data } = useSignup();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState("history");

  // 🔥 PROFILE SLIDE
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

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
      <ScrollView style={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>ประวัติการส่ง</Text>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text>รายการที่ 1</Text>
            <View style={styles.statusBadge}>
              <Text style={{ color: "#fff" }}>เสร็จสิ้น</Text>
            </View>
          </View>

          <Text style={styles.grayText}>⏱ 13:00 | 📍 1.0 km</Text>

          <View style={styles.userRow}>
            <Ionicons name="person" size={18} />
            <View>
              <Text>อติวัศว์ สารบรรณ</Text>
              <Text style={styles.grayText}>090-952-2162</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.fromBox}>
              <Text>จุดรับ</Text>
              <Text style={styles.bold}>มหาวิทยาลัยมหิดล</Text>
            </View>

            <View style={styles.toBox}>
              <Text>ปลายทาง</Text>
              <Text style={styles.bold}>ศูนย์แพทย์</Text>
            </View>
          </View>

          <View style={styles.noteBox}>
            <Text>การทำงานเป็นผล เรียบร้อย</Text>
          </View>

          <View style={styles.priceRow}>
            <Text>ค่าบริการ</Text>
            <Text style={styles.price}>฿500</Text>
          </View>
        </View>
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

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statusBadge: {
    backgroundColor: "#43B7A5",
    paddingHorizontal: 10,
    borderRadius: 10,
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

  price: { color: "green", fontWeight: "700" },

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

  tabItem: { flex: 1, alignItems: "center" },
});