import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import {
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSignup } from "../context/SignupContext";

export default function Money() {
  const { data } = useSignup();
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState("wallet");

  // ===== PROFILE SLIDE =====
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

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

  // ===== DATA =====
  const [orders] = useState<any[]>([]);
  const [reviews] = useState<any[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [amount, setAmount] = useState("");

  // ===== DATE =====
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const now = new Date();
    const first = now.getDate() - now.getDay();
    const start = new Date(now.setDate(first));
    return date >= start;
  };

  const isThisMonth = (date: Date) => {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  // ===== CALCULATE =====
  const todayOrders = orders.filter((o) => isToday(o.date)).length;
  const totalOrders = orders.length;

  const avgScore =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
      : 0;

  const totalIncome = orders.reduce((sum, o) => sum + o.price, 0);
  const totalWithdraw = withdrawHistory.reduce((sum, w) => sum + w.amount, 0);
  const balance = totalIncome - totalWithdraw;

  const weeklyIncome = orders
    .filter((o) => isThisWeek(o.date))
    .reduce((sum, o) => sum + o.price, 0);

  const monthlyIncome = orders
    .filter((o) => isThisMonth(o.date))
    .reduce((sum, o) => sum + o.price, 0);

  const todayIncome = orders
    .filter((o) => isToday(o.date))
    .reduce((sum, o) => sum + o.price, 0);

  // ===== WITHDRAW =====
  const handleWithdraw = (all = false) => {
    const withdrawAmount = all ? balance : Number(amount);

    if (withdrawAmount < 100) {
      alert("ขั้นต่ำ 100 บาท");
      return;
    }

    if (withdrawAmount > balance) {
      alert("เงินไม่พอ");
      return;
    }

    const newWithdraw = {
      amount: withdrawAmount,
      date: new Date(),
    };

    setWithdrawHistory([newWithdraw, ...withdrawHistory]);
    setAmount("");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <AppHeader />

      {/* MAIN */}
      <FlatList
        data={withdrawHistory}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            <View style={styles.wallet}>
              <Text style={styles.walletTitle}>ยอดเงินคงเหลือ</Text>
              <Text style={styles.walletBalance}>฿{balance}</Text>

              <View style={styles.walletRow}>
                <Text style={{ color: "#fff" }}>
                  รายได้ทั้งหมด ฿{totalIncome}
                </Text>
                <Text style={{ color: "#fff" }}>ถอนแล้ว ฿{totalWithdraw}</Text>
              </View>
            </View>

            <View style={styles.incomeRow}>
              <Box label="รายได้สัปดาห์นี้" value={weeklyIncome} />
              <Box label="รายได้เดือนนี้" value={monthlyIncome} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>บัญชีรับเงิน</Text>

              <View style={styles.bankRow}>
                <Ionicons name="business" size={20} color="#43B7A5" />
                <View>
                  <Text>{data.bank || "ยังไม่ได้เพิ่ม"}</Text>
                  <Text style={{ color: "#6B7280" }}>
                    {data.accountNumber || "-"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{ marginLeft: "auto" }}
                  onPress={() => navigation.navigate("Signup3")}
                >
                  <Text style={{ color: "#2563EB" }}>เปลี่ยน</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ถอนเงิน</Text>

              <TextInput
                placeholder="จำนวนเงิน"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
              />

              <View style={styles.quickRow}>
                {[100, 500, 1000, 2000].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.quickBtn}
                    onPress={() => setAmount(String(num))}
                  >
                    <Text>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => handleWithdraw()}
              >
                <Text style={{ color: "#3B82F6" }}>ถอนเงิน</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.withdrawAll}
                onPress={() => handleWithdraw(true)}
              >
                <Text style={{ color: "#fff" }}>ถอนเงินทั้งหมด</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ประวัติการถอนเงิน</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, styles.historyItem]}>
            <Text>฿{item.amount}</Text>
            <Text style={{ color: "#6B7280" }}>
              {item.date.toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={{ color: "#9CA3AF" }}>ยังไม่มีรายการถอน</Text>
          </View>
        }
      />

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

const Box = ({ label, value }: any) => (
  <View style={styles.smallBox}>
    <Text>{label}</Text>
    <Text style={{ fontWeight: "700" }}>฿{value}</Text>
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

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  rightSection: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },

  greeting: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  role: {
    color: "#D1FAE5",
    fontSize: 12,
  },

  balance: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  subText: {
    color: "#D1FAE5",
    fontSize: 12,
  },

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

  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  statLabel: {
    color: "#E6FFFA",
    fontSize: 12,
  },

  wallet: {
    backgroundColor: "#7BC9B7",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },

  walletTitle: { color: "#fff" },

  walletBalance: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },

  smallBox: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 16,
    borderRadius: 10,
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },

  sectionTitle: {
    fontWeight: "600",
    marginBottom: 10,
  },

  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  quickBtn: {
    backgroundColor: "#E5E7EB",
    padding: 10,
    borderRadius: 8,
    width: "22%",
    alignItems: "center",
  },

  withdrawBtn: {
    backgroundColor: "#ffffff",
    borderColor: "#3B82F6",
    borderWidth: 2,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },

  withdrawAll: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
    elevation: 5,
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

  profileName: {
    color: "#fff",
    fontWeight: "600",
  },

  profileRole: {
    color: "#D1FAE5",
    fontSize: 12,
  },

  menu: {
    padding: 20,
  },

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

  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 90,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
  },
});