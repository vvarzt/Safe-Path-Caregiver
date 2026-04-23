import { Ionicons } from "@expo/vector-icons";
import {
  collection, doc, getDocs, onSnapshot,
  query, setDoc, updateDoc, where
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import { db } from "../firebase";

import {
  Alert,
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
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [amount, setAmount] = useState("");

  // ✅ Stats จาก Firestore
  const [totalIncome, setTotalIncome] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [weeklyIncome, setWeeklyIncome] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // ✅ ประวัติถอนเงิน
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);

  // ===== DATE HELPERS =====
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  };

  const isThisMonth = (date: Date) => {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  // ✅ Listener: bookings completed ของ caregiver นี้
  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "bookings"),
      where("status", "==", "completed"),
      where("caregiverId", "==", data.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      let total = 0;
      let today = 0;
      let weekly = 0;
      let monthly = 0;

      snap.docs.forEach((d) => {
        const booking = d.data();
        const income = (booking.fare || 0) * 0.6;

        // ✅ รองรับทั้ง Timestamp และ ISO string
        const raw = booking.completedAt;
        const completedAt = raw
          ? raw?.toDate
            ? raw.toDate()       // Firestore Timestamp
            : new Date(raw)      // ISO string เช่น "2026-04-22T21:13:29.132Z"
          : null;

        total += income;
        if (completedAt) {
          if (isToday(completedAt)) today += income;
          if (isThisWeek(completedAt)) weekly += income;
          if (isThisMonth(completedAt)) monthly += income;
        }
      });

      setTotalIncome(Math.round(total));
      setTodayIncome(Math.round(today));
      setWeeklyIncome(Math.round(weekly));
      setMonthlyIncome(Math.round(monthly));
      setCompletedCount(snap.size);
    });

    return () => unsubscribe();
  }, [data?.uid]);

  // ✅ Listener: ประวัติถอนเงิน
  useEffect(() => {
    if (!data?.uid) return;

    const q = query(
      collection(db, "withdrawals"),
      where("caregiverId", "==", data.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });

      setWithdrawHistory(list);

      const withdrawn = list
        .filter((w: any) => w.status === "approved")
        .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
      setTotalWithdrawn(withdrawn);
    });

    return () => unsubscribe();
  }, [data?.uid]);

  const balance = totalIncome - totalWithdrawn;

  // ✅ กดถอนเงิน
  const handleWithdraw = async (all = false) => {
    const withdrawAmount = all ? balance : Number(amount);

    if (!withdrawAmount || withdrawAmount < 100) {
      Alert.alert("แจ้งเตือน", "ขั้นต่ำ 100 บาท");
      return;
    }
    if (withdrawAmount > balance) {
      Alert.alert("แจ้งเตือน", "ยอดเงินไม่เพียงพอ");
      return;
    }

    try {
      // ✅ 1. ดึง bookings completed ของ caregiver นี้
      const bookingsSnap = await getDocs(
        query(
          collection(db, "bookings"),
          where("status", "==", "completed"),
          where("caregiverId", "==", data.uid)
        )
      );

      const bookingIds = bookingsSnap.docs.map((d) => d.id);

      // ✅ 2. ดึง payments ที่ตรงกับ bookingIds เหล่านั้น
      const paymentSnapshots = await Promise.all(
        bookingIds.map((bookingId) =>
          getDocs(
            query(
              collection(db, "payments"),
              where("bookingId", "==", bookingId)
            )
          )
        )
      );

      // รวม bookingSummaries พร้อม paymentId
      const bookingSummaries = bookingsSnap.docs.map((d, i) => {
        const bookingData = d.data();
        const paymentDoc = paymentSnapshots[i]?.docs?.[0];
        return {
          bookingId: d.id,
          paymentId: paymentDoc?.id || null,
          paymentMethod: bookingData.paymentMethod || "-",
          fare: bookingData.fare || 0,
          income: Math.round((bookingData.fare || 0) * 0.6),
          completedAt: bookingData.completedAt || null,
          fromAddress: bookingData.fromLocation?.address || "-",
          toAddress: bookingData.toLocation?.address || "-",
        };
      });

      const paymentIds = bookingSummaries
        .map((b) => b.paymentId)
        .filter(Boolean);

      const now = new Date().toISOString();
      const withdrawId = `WD-${Date.now()}`;

      // ✅ 3. บันทึก withdrawal doc
      const ref = doc(collection(db, "withdrawals"));
      await setDoc(ref, {
        withdrawId,
        caregiverId: data.uid,
        caregiverName: `${caregiverInfo?.firstName || ""} ${caregiverInfo?.lastName || ""}`.trim(),

        // 💰 ยอดเงิน
        amount: withdrawAmount,
        totalIncomeAtRequest: totalIncome,
        balanceAtRequest: balance,

        // 🏦 บัญชีปลายทาง
        bank: caregiverInfo?.bank || "-",
        accountNumber: caregiverInfo?.accountNumber || "-",
        accountName: `${caregiverInfo?.firstName || ""} ${caregiverInfo?.lastName || ""}`.trim(),

        // 📋 งานที่เกี่ยวข้อง
        bookingIds,
        paymentIds,
        bookingSummaries,
        bookingCount: bookingIds.length,

        // 📅 วันที่
        createdAt: now,
        requestedAt: now,

        // ✅ สถานะ
        status: "pending",
        approvedAt: null,
        approvedBy: null,
        note: "",
      });

      // ✅ 4. อัปเดต balance ใน caregivers
      const currentBalance = caregiverInfo?.balance || 0;
      await updateDoc(doc(db, "caregivers", data.uid), {
        balance: currentBalance + totalIncome, // ยอดสะสมรายได้รวม
        lastWithdrawAt: now,
        lastWithdrawAmount: withdrawAmount,
      });

      setAmount("");
      Alert.alert(
        "✅ ส่งคำขอถอนเงินแล้ว",
        `฿${withdrawAmount.toLocaleString()}\nกำลังรออนุมัติจาก Admin`
      );
    } catch (err) {
      console.log("❌ WITHDRAW ERROR:", err);
      Alert.alert("ผิดพลาด", "ไม่สามารถส่งคำขอได้");
    }
  };

  const toggleProfile = () => {
    Animated.timing(slideAnim, {
      toValue: open ? -300 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setOpen(!open));
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "รอการอนุมัติ",
      approved: "อนุมัติแล้ว",
      rejected: "ถูกปฏิเสธ",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "#F59E0B",
      approved: "#10B981",
      rejected: "#EF4444",
    };
    return map[status] || "#6B7280";
  };

  const formatDate = (item: any) => {
    const raw = item.createdAt;
    if (!raw) return "-";

    // ✅ รองรับทั้ง Firestore Timestamp และ ISO string
    const date = raw?.toDate ? raw.toDate() : new Date(raw);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const [caregiverInfo, setCaregiverInfo] = useState<any>(null);
  useEffect(() => {
    if (!data?.uid) return;

    const caregiverRef = doc(db, "caregivers", data.uid);

    const unsubscribe = onSnapshot(caregiverRef, (snap) => {
      if (snap.exists()) {
        setCaregiverInfo(snap.data());
      }
    });

    return () => unsubscribe();
  }, [data?.uid]);

  return (
    <View style={styles.container}>
      <AppHeader />

      <FlatList
        data={withdrawHistory}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{
          paddingBottom: 100 // 👈 กันโดนปุ่ม/ขอบจอทับ
        }}
        ListHeaderComponent={
          <>
            {/* BALANCE CARD */}
            <View style={styles.walletCard}>
              <Text style={styles.walletTitle}>ยอดเงินคงเหลือ</Text>
              <Text style={styles.walletBalance}>
                ฿{balance.toLocaleString()}
              </Text>
              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletSub}>รายได้รวม (60%)</Text>
                  <Text style={styles.walletSubValue}>
                    ฿{totalIncome.toLocaleString()}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.walletSub}>ถอนแล้ว (อนุมัติ)</Text>
                  <Text style={styles.walletSubValue}>
                    ฿{totalWithdrawn.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* INCOME SUMMARY */}
            <View style={styles.row}>
              <IncomeBox label="วันนี้" value={todayIncome} />
              <IncomeBox label="สัปดาห์นี้" value={weeklyIncome} />
              <IncomeBox label="เดือนนี้" value={monthlyIncome} />
            </View>

            {/* STATS */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>สถิติงาน</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.statValue}>{completedCount}</Text>
                  <Text style={styles.statLabel}>งานเสร็จแล้ว</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="cash-outline" size={20} color="#3B82F6" />
                  <Text style={styles.statValue}>
                    ฿{totalIncome.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>รายได้สะสม</Text>
                </View>
              </View>
            </View>

            {/* บัญชีรับเงิน */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>บัญชีรับเงิน</Text>

              {caregiverInfo?.bank ? (
                <View style={styles.bankCard}>

                  {/* ชื่อธนาคาร */}
                  <View style={styles.bankRow}>
                    <Ionicons name="business-outline" size={20} color="#43B7A5" />
                    <View>
                      <Text style={styles.bankLabel}>ธนาคาร</Text>
                      <Text style={styles.bankName}>{caregiverInfo.bank}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* เลขบัญชี */}
                  <View style={styles.bankRow}>
                    <Ionicons name="card-outline" size={20} color="#43B7A5" />
                    <View>
                      <Text style={styles.bankLabel}>เลขบัญชี</Text>
                      <Text style={styles.bankName}>{caregiverInfo.accountNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* ชื่อเจ้าของบัญชี */}
                  <View style={styles.bankRow}>
                    <Ionicons name="person-outline" size={20} color="#43B7A5" />
                    <View>
                      <Text style={styles.bankLabel}>ชื่อบัญชี</Text>
                      <Text style={styles.bankName}>
                        {caregiverInfo.firstName} {caregiverInfo.lastName}
                      </Text>
                    </View>
                  </View>

                </View>
              ) : (
                <View style={styles.noBankBox}>
                  <Ionicons name="alert-circle-outline" size={32} color="#D1D5DB" />
                  <Text style={styles.noBankText}>ยังไม่ได้เพิ่มบัญชีรับเงิน</Text>
                </View>
              )}
            </View>

            {/* ถอนเงิน */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>ถอนเงิน</Text>

              <Text style={styles.balanceHint}>
                ยอดที่ถอนได้: ฿{balance.toLocaleString()}
              </Text>

              <TextInput
                placeholder="ระบุจำนวนเงิน (ขั้นต่ำ 100 บาท)"
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
                    <Text style={styles.quickText}>฿{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => handleWithdraw()}
              >
                <Text style={styles.withdrawBtnText}>ถอนเงิน</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.withdrawAllBtn}
                onPress={() => handleWithdraw(true)}
              >
                <Text style={styles.withdrawAllText}>
                  ถอนทั้งหมด ฿{balance.toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 8 }}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>ประวัติการถอนเงิน</Text>
              </View>

              {withdrawHistory.length === 0 && (
                <Text style={{ textAlign: "center", color: "#9CA3AF" }}>
                  ยังไม่มีรายการถอน
                </Text>
              )}
            </View>


          </>
        }
        renderItem={({ item }: any) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.historyAmount}>
                ฿{(item.amount || 0).toLocaleString()}
              </Text>
              <Text style={styles.historyDate}>{formatDate(item)}</Text>
              <Text style={styles.historyBank}>
                {item.bank} {item.accountNumber}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// ===== COMPONENTS =====
const IncomeBox = ({ label, value }: any) => (
  <View style={styles.incomeBox}>
    <Text style={styles.incomeLabel}>{label}</Text>
    <Text style={styles.incomeValue}>฿{value.toLocaleString()}</Text>
  </View>
);

// ===== STYLES =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  walletCard: {
    backgroundColor: "#43B7A5",
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  walletTitle: { color: "#D1FAE5", fontSize: 13 },
  walletBalance: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginVertical: 6,
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  walletSub: { color: "#D1FAE5", fontSize: 11 },
  walletSubValue: { color: "#fff", fontWeight: "600", fontSize: 14 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  incomeBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  incomeLabel: { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  incomeValue: { fontSize: 14, fontWeight: "700", color: "#111827" },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: { fontWeight: "700", fontSize: 15, marginBottom: 12, color: "#111827" },

  statRow: { flexDirection: "row", gap: 16 },
  statItem: { alignItems: "center", gap: 4, flex: 1, backgroundColor: "#F9FAFB", padding: 12, borderRadius: 10 },
  statValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6B7280" },

  bankRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bankName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  bankAccount: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  balanceHint: { fontSize: 12, color: "#6B7280", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  quickBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  quickText: { fontSize: 13, fontWeight: "600", color: "#374151" },

  withdrawBtn: {
    borderWidth: 2,
    borderColor: "#3B82F6",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  withdrawBtnText: { color: "#3B82F6", fontWeight: "600" },
  withdrawAllBtn: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  withdrawAllText: { color: "#fff", fontWeight: "600" },

  historyItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 10, // 👈 เพิ่ม spacing
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1, // 👈 Android shadow
  },

  historyAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  historyDate: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  historyBank: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 90,
    alignItems: "center",
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  bankCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 4,
  },
  bankLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  noBankBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  noBankText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
});