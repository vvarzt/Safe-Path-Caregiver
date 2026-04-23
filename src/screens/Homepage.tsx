import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import AppHeader from "../components/AppHeader";
import FaceScanModal from "../components/FaceScanModal";
import { auth, db } from "../firebase";
import { RootStackParamList } from "../navigation/AppNavigator";
import { runTransaction } from "firebase/firestore";

import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSignup } from "../context/SignupContext";

export default function Homepage() {
  const navigation = useNavigation<NavProp>();
  type NavProp = NativeStackNavigationProp<RootStackParamList>;
  const [waitingComplete, setWaitingComplete] = useState(false);
  const [showJobDone, setShowJobDone] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [activeJob, setActiveJob] = useState<any>(null);
  const { data, setData } = useSignup();
  const [showSuccess, setShowSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [caregiver_Gender, setcaregiver_Gender] = useState<string | null>(null);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const isWaitingApprove = activeJob?.update_cus === "wait_cus";





  const closePopup = () => {
    setShowSuccess(false);
  };
  const handleNavigate = async () => {
    try {
      const lat = activeJob?.fromLat;
      const lng = activeJob?.fromLng;

      if (lat == null || lng == null) {
        console.log("❌ ไม่มีพิกัดปลายทาง");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});

      const origin = `${location.coords.latitude},${location.coords.longitude}`;
      const destination = `${lat},${lng}`;

      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

      Linking.openURL(url);
    } catch (err) {
      console.log("❌ NAV ERROR:", err);
    }
  };
  const handleCall = () => {
    if (!activeJob?.phone) return;

    Linking.openURL(`tel:${activeJob.phone}`);
  };
  const formatDateTime = (iso: string) => {
    if (!iso) return "-";

    return new Date(iso).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartJob = () => {
    Alert.alert(
      "เริ่มงาน",
      "ยืนยันการเริ่มงาน?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ยืนยัน",
          onPress: () => {
            setShowFaceScan(true); // 👉 เปิดสแกนหน้า
          },
        },
      ]
    );
  };

  const handleUpdateCus = async () => {
  if (!activeJob?.id) return;

  const current = activeJob.update_cus;

  let nextStatus = null;
  let confirmText = "";

  if (!current) {
    nextStatus = "received";
    confirmText = "ยืนยันรับลูกค้าแล้ว?";
  } else if (current === "received") {
    nextStatus = "destination";
    confirmText = "ถึงปลายทางแล้วใช่ไหม?";
  } else if (current === "destination") {
    nextStatus = "back";
    confirmText = "กำลังกลับต้นทาง?";
  } else if (current === "back") {
    confirmText = "ต้องการจบงานใช่ไหม?";
  }

  Alert.alert("ยืนยัน", confirmText, [
    { text: "ยกเลิก", style: "cancel" },
    {
      text: "ยืนยัน",
      onPress: async () => {
        try {
          // 🔥 FINAL STEP
          if (current === "back") {
            await updateDoc(doc(db, "bookings", activeJob.id), {
              update_cus: "wait_cus",
            });

            await updateDoc(doc(db, "caregivers", data.uid), {
              statusWork: "wait",
            });

            setWaitingComplete(true);
            return;
          }

          await updateDoc(doc(db, "bookings", activeJob.id), {
            update_cus: nextStatus,
          });

          setActiveJob((prev: any) => ({
            ...prev,
            update_cus: nextStatus,
          }));

          Alert.alert("สำเร็จ", "อัปเดตเรียบร้อย");
        } catch (err) {
          console.log(err);
        }
      },
    },
  ]);
};

  const getUpdateCusLabel = () => {
    if (!activeJob?.update_cus) return "รับลูกค้าแล้ว";
    if (activeJob.update_cus === "received") return "ถึงปลายทางแล้ว";
    if (activeJob.update_cus === "destination") return "กลับต้นทาง";
    if (activeJob.update_cus === "back") return "เสร็จสิ้น";
    if (activeJob.update_cus === "wait_cus") return "รอการอนุมัติ";
    return "ดำเนินการ";
  };
  const isFinalStep = activeJob?.update_cus === "back";
  const [jobList, setJobList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const handleAcceptJob = async (jobId: string) => {
    Alert.alert(
      "ยืนยันรับงาน",
      "คุณต้องการรับงานนี้ใช่หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ยืนยัน",
          onPress: async () => {
            try {
              const userId = data?.uid;
              if (!userId) return;

              const acceptedAt = new Date().toISOString();

              await updateDoc(doc(db, "bookings", jobId), {
                status: "accepted",
                caregiverId: userId,
                acceptedAt,
              });

              await updateDoc(doc(db, "caregivers", userId), {
                statusWork: "working",
              });

              setShowSuccess(true);

            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!data?.uid) return;

    const fetchGender = async () => {
      try {
        const snap = await getDoc(doc(db, "caregivers", data.uid));

        if (snap.exists()) {
          const c = snap.data();
          console.log("👤 caregiver gender:", c.gender);

          setcaregiver_Gender(c.gender);
        } else {
          console.log("❌ ไม่เจอ caregiver");
        }
      } catch (err) {
        console.log("❌ fetch gender error:", err);
      }
    };

    fetchGender();
  }, [data?.uid]);

  // ✅ Real-time listener สำหรับ caregiver statusWork
  useEffect(() => {
    if (!data?.uid) return;

    const caregiverRef = doc(db, "caregivers", data.uid);

    const unsubscribe = onSnapshot(caregiverRef, async (snap) => {

      // ✅ 🔥 เพิ่มตรงนี้
      if (!snap.exists()) {
        console.log("❌ caregiver ถูกลบแล้ว");

        Alert.alert(
          "บัญชีถูกลบ",
          "บัญชีของคุณถูกลบโดยผู้ดูแลระบบ",
          [
            {
              text: "ตกลง",
              onPress: async () => {
                try {
                  await auth.signOut(); // logout firebase
                } catch (e) {
                  console.log("logout error:", e);
                }

                // 🔥 reset context
                setData({} as any);

                // 🔥 กลับหน้า welcome
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Welcome" }],
                });
              },
            },
          ]
        );

        return;
      }
      const c = snap.data();
      console.log("🔥 caregiver status:", c.statusWork);

      if (c.statusWork === "idle" || c.statusWork === "") {
        // ✅ idle → เช็คว่าเพิ่ง wait อยู่ไหม (งานเสร็จ)
        if (waitingComplete) {
          setWaitingComplete(false);
          setShowJobDone(true); // 🎉 แจ้งเตือนงานเสร็จ
        }
        setActiveJob(null);
        setIsStarted(false);
        console.log("✅ กลับโหมดหางาน");
        return;
      }

      // ✅ working หรือ wait → โหลดงานที่รับไว้แสดงเหมือนกัน
      if (c.statusWork === "working" || c.statusWork === "wait") {
        const q = query(
          collection(db, "bookings"),
          where("caregiverId", "==", data.uid),
          where("status", "in", ["accepted", "in_progress"])
        );

        const snap2 = await getDocs(q);
        if (snap2.empty) {
          setActiveJob(null);
          setIsStarted(false);
          return;
        }

        const jobSnap = snap2.docs[0];
        const jobData = jobSnap.data();

        let fullName = "ไม่พบชื่อ";
        let phone = "-";

        if (jobData.userId) {
          try {
            const userSnap = await getDoc(doc(db, "users", jobData.userId));
            if (userSnap.exists()) {
              const u = userSnap.data();
              fullName = u.fullname || u.fullName || u.name || "ไม่พบชื่อ";
              phone = u.phone || "-";
            }
          } catch (e) { }
        }

        setIsStarted(jobData.status === "in_progress");

        // ✅ ถ้า wait อยู่ → set waitingComplete ด้วย (กรณี login มาใหม่ขณะ wait)
        if (c.statusWork === "wait") {
          setWaitingComplete(true);
        }

        setActiveJob({
          id: jobSnap.id,
          fullName,
          phone,
          dateBooking: jobData.dateBooking || "-",
          timeBooking: jobData.timeBooking || "-",
          caregiver_Gender: jobData.gender_Care || "-",
          equipment: jobData.equipment || [],
          fare: jobData.fare || 0,
          distance: jobData.distance || 0,
          paymentMethod: jobData.paymentMethod || "-",
          status: jobData.status || "-",
          acceptedAt: jobData.acceptedAt || "-",
          fromAddress: jobData.fromLocation?.address || "-",
          toAddress: jobData.toLocation?.address || "-",
          fromLat: jobData.fromLocation?.lat || null,
          fromLng: jobData.fromLocation?.lng || null,
          toLat: jobData.toLocation?.lat || null,
          toLng: jobData.toLocation?.lng || null,
          update_cus: jobData.update_cus || null,
        });
      }
    });

    return () => unsubscribe();
  }, [data?.uid, waitingComplete]); // 👈 เพิ่ม waitingComplete ใน deps

  useEffect(() => {
    console.log("📊 gender:", data?.gender); // 👈 เพิ่มบรรทัดนี้

    if (!caregiver_Gender) {
      console.log("❌ gender ยังไม่มี");
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "bookings"),
        where("status", "==", "pending"),
        where("gender_Care", "in", [
          "disabled",
          caregiver_Gender,
        ])


      ),
      async (snapshot) => {
        console.log("📦 snapshot size:", snapshot.size); // 👈 เพิ่ม
        console.log("📊 caregiver_Gender:", caregiver_Gender);
        snapshot.forEach(doc => {
          console.log("📄 job data:", doc.data()); // 👈 เพิ่ม
        });

        try {
          console.log("🔥 Realtime update:", snapshot.size);

          const bookings = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const d = docSnap.data();

              let fullName = "ไม่พบชื่อ";
              let phone = "-";

              if (d.userId) {
                try {
                  const userSnap = await getDoc(doc(db, "users", d.userId));
                  if (userSnap.exists()) {
                    const u = userSnap.data();
                    fullName = u.fullname || u.fullName || u.name || "ไม่พบชื่อ";
                    phone = u.phone || "-";
                  }
                } catch (e) {
                  console.log("❌ USER ERROR:", e);
                }
              }

              return {
                id: docSnap.id,
                fullName,
                phone,
                dateBooking: d.dateBooking || "-",
                timeBooking: d.timeBooking || "-",
                caregiver_Gender: d.gender_Care || "-",
                equipment: d.equipment || [],

                // ✅ ใช้ location ใหม่
                fromAddress: d.fromLocation?.address || "-",
                toAddress: d.toLocation?.address || "-",

                fromLat: d.fromLocation?.lat || null,
                fromLng: d.fromLocation?.lng || null,
                toLat: d.toLocation?.lat || null,
                toLng: d.toLocation?.lng || null,

                fare: d.fare ?? 0,
                status: d.status || "pending",
                paymentMethod: d.paymentMethod || "-",
              };
            })
          );

          // ✅ filter pending เท่านั้น
          console.log("✅ bookings ที่ได้:", bookings); // 👈 เพิ่ม
          console.log("🎯 query gender:", caregiver_Gender);
          setJobList(bookings);
        } catch (err) {
          console.log("❌ SNAPSHOT ERROR:", err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.log("❌ SNAPSHOT ERROR:", error); // 👈 เพิ่มตรงนี้
      });

    // ✅ สำคัญมาก (cleanup กัน memory leak)
    return () => unsubscribe();
  }, [caregiver_Gender]); // ✅ แก้ตรงนี้

  // ✅ คอย booking เปลี่ยนเป็น completed → แก้ statusWork เป็น idle
  useEffect(() => {
    if (!activeJob?.id) return;

    const bookingRef = doc(db, "bookings", activeJob.id);

    const unsubscribe = onSnapshot(bookingRef, async (snap) => {
      if (!snap.exists()) return;

      const d = snap.data();
      console.log("📦 booking status:", d.status);

      // ❌ กรณีโดนยกเลิก
      if (d.status === "cancelled") {
        console.log("❌ งานถูกยกเลิก");

        Alert.alert("งานถูกยกเลิก", "ลูกค้าได้ยกเลิกงานนี้แล้ว");

        // reset state
        setActiveJob(null);
        setIsStarted(false);
        setWaitingComplete(false);

        // 🔥 กลับไปโหมดหางาน
        await updateDoc(doc(db, "caregivers", data.uid), {
          statusWork: "idle",
        });

        return;
      }

      // ✅ กรณีงานเสร็จ (เหมือนเดิม)
      if (d.status === "completed") {
        try {
          await updateDoc(doc(db, "bookings", activeJob.id), {
            completedAt: new Date().toISOString(),
          });

          await updateDoc(doc(db, "caregivers", data.uid), {
            statusWork: "idle",
          });

          setWaitingComplete(false);
          setShowJobDone(true);

          console.log("✅ งานเสร็จ");
        } catch (err) {
          console.log("❌ COMPLETE ERROR:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [activeJob?.id]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log("🔥 เริ่ม fetchBookings...");

      const snapshot = await getDocs(collection(db, "bookings"));
      console.log("📦 จำนวน docs ใน bookings:", snapshot.size);

      if (snapshot.empty) {
        console.log("❌ ไม่มีข้อมูลใน collection bookings เลย");
        setJobList([]);
        return;
      }

      const bookings = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const d = docSnap.data();

          let fullName = "ไม่พบชื่อ";
          let phone = "-";

          if (d.userId) {
            try {
              const userSnap = await getDoc(doc(db, "users", d.userId));
              if (userSnap.exists()) {
                const u = userSnap.data();
                fullName = u.fullname || u.fullName || u.name || "ไม่พบชื่อ";
                phone = u.phone || "-";
              }
            } catch (e) {
              console.log("❌ USER ERROR:", e);
            }
          }

          return {
            id: docSnap.id,
            fullName,
            phone,
            dateBooking: d.dateBooking || "-",
            timeBooking: d.timeBooking || "-",
            caregiver_Gender: d.caregiver_Gender || "-",
            equipment: d.equipment || [],

            // ✅ ใช้ location ใหม่
            fromAddress: d.fromLocation?.address || "-",
            toAddress: d.toLocation?.address || "-",

            fromLat: d.fromLocation?.lat || null,
            fromLng: d.fromLocation?.lng || null,
            toLat: d.toLocation?.lat || null,
            toLng: d.toLocation?.lng || null,

            fare: d.fare ?? 0,
            status: d.status || "pending",
            paymentMethod: d.paymentMethod || "-",
          };
        })
      );
      const pendingOnly = bookings.filter((job) => job.status === "pending");
      setJobList(pendingOnly);


      console.log("✅ bookings ทั้งหมด:", JSON.stringify(bookings));
    } catch (error) {
      console.log("❌ FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProfile = () => {
    Animated.timing(slideAnim, {
      toValue: open ? -300 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setOpen(!open));
  };

  const gender_CareTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      male: "ชาย",
      disabled: "ไม่ระบุ",
      female: "หญิง",
    };
    return map[type] || type;
  };

  const equipmentLabel = (eq: string) => {
    const map: Record<string, string> = {
      wheelchair: "รถเข็น",
      stretcher: "เปล",
      oxygen: "ออกซิเจน",
      cane: "ไม้เท้า",
    };
    return map[eq] || eq;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "#F59E0B",
      confirmed: "#3B82F6",
      cancelled: "#EF4444",
      completed: "#10B981",
    };
    return map[status] || "#6B7280";
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "รอดำเนินการ",
      accepted: "รับงานแล้ว",   // 👈 เพิ่มอันนี้
      confirmed: "ยืนยันแล้ว",
      cancelled: "ยกเลิก",
      completed: "เสร็จสิ้น",
      in_progress: "กำลังเดินทาง",
    };

    return map[status] || status;
  };
  console.log("🧠 activeJob:", activeJob);
  console.log("📋 jobList:", jobList.length);
  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {!activeJob && (
          <Text style={styles.sectionTitle}>งานทั้งหมด</Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#43B7A5" style={{ marginTop: 40 }} />
        ) : activeJob ? (
          // 🔴 โหมดมีงานกำลังทำ (แสดงงานเดียว)
          <View style={styles.card}>

            <Text style={styles.sectionTitle}>🚑 งานที่กำลังทำอยู่</Text>

            {/* STATUS + TIME */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {statusLabel(activeJob.status)}
              </Text>

              <Text style={{ fontSize: 11, color: "#6B7280" }}>
                รับงาน: {formatDateTime(activeJob.acceptedAt)}
              </Text>
            </View>

            {/* USER */}
            <View style={styles.rowItem}>
              <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
              <View>
                <Text style={styles.mainText}>{activeJob.fullName}</Text>
                <Text style={styles.subText}>{activeJob.phone}</Text>
              </View>
            </View>

            {/* TIME */}
            <View style={styles.row}>
              <View style={styles.infoBox}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.subText}>{activeJob.dateBooking}</Text>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.subText}>{activeJob.timeBooking}</Text>
              </View>
            </View>

            {/* TYPE */}
            <View style={styles.rowItem}>
              <Ionicons name="accessibility-outline" size={18} color="#6B7280" />
              <Text style={styles.mainText}>
                {gender_CareTypeLabel(activeJob.caregiver_Gender)}
              </Text>
            </View>

            {/* EQUIPMENT */}
            {activeJob.equipment?.length > 0 && (
              <View style={styles.tagRow}>
                {activeJob.equipment.map((eq: string, i: number) => (
                  <View key={i} style={styles.tag}>
                    <Ionicons name="construct-outline" size={12} color="#059669" />
                    <Text style={styles.tagText}>{equipmentLabel(eq)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* LOCATION */}
            <View style={styles.locationBox}>
              <View style={styles.locationRow}>
                <Ionicons name="radio-button-on" size={14} color="#10B981" />
                <Text style={styles.locationText}>
                  {activeJob.fromAddress}
                </Text>
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#EF4444" />
                <Text style={styles.locationText}>
                  {activeJob.toAddress}
                </Text>
              </View>
            </View>

            {/* EXTRA INFO */}
            <View style={styles.row}>
              <View style={styles.infoBox}>
                <Ionicons name="map-outline" size={16} color="#6B7280" />
                <Text style={styles.subText}>
                  {activeJob.distance} km
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="card-outline" size={16} color="#6B7280" />
                <Text style={styles.subText}>
                  {activeJob.paymentMethod}
                </Text>
              </View>
            </View>

            {/* PRICE */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>ค่าบริการ</Text>
              <Text style={styles.priceValue}>฿{activeJob.fare}</Text>
            </View>

            {/* BUTTON CONTROL */}

            {/* 🔵 ปุ่ม "เริ่มงาน" (ใช้ตอนยังไม่เริ่มงาน) */}
            {activeJob?.status === "accepted" && (
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  {
                    backgroundColor: isFinalStep ? "#EF4444" : "#3B82F6", // 🔥 เปลี่ยนตรงนี้
                    marginTop: 10,
                  },
                ]}
                onPress={handleStartJob}
              >
                <Text style={styles.acceptButtonText}>เริ่มงาน</Text>
              </TouchableOpacity>
            )}

            {/* เพิ่ม Modal */}
            <FaceScanModal
              visible={showFaceScan}
              onCancel={() => setShowFaceScan(false)}
              onSuccess={async () => {
                setShowFaceScan(false);

                await updateDoc(doc(db, "bookings", activeJob.id), {
                  status: "in_progress",
                  startedAt: new Date().toISOString(),
                });

                setIsStarted(true);
                setActiveJob((prev: any) => ({
                  ...prev,
                  status: "in_progress",
                }));

                Alert.alert("สำเร็จ", "เริ่มงานแล้ว");
              }}
            />
            {/* 🧭 NAV + CALL */}
            {isStarted && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>

                {/* NAVIGATE */}
                <TouchableOpacity
                  onPress={handleNavigate}
                  style={{
                    flex: 1,
                    backgroundColor: "#3B82F6",
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    นำทาง
                  </Text>
                </TouchableOpacity>

                {/* CALL */}
                <TouchableOpacity
                  onPress={handleCall}
                  style={{
                    flex: 1,
                    backgroundColor: "#10B981",
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    โทร
                  </Text>
                </TouchableOpacity>

              </View>
            )}

            {/* 🟡 ปุ่ม "จบงาน" (เก็บไว้ก่อน ยังไม่ใช้) */}
            {/*
{/* 🔴 ปุ่มสิ้นสุดงาน */}
            {isStarted && (
              <TouchableOpacity
                disabled={isWaitingApprove}
                style={[
                  styles.acceptButton,
                  {
                    backgroundColor: isWaitingApprove ? "#9CA3AF" : "#F59E0B",
                    marginTop: 10
                  }
                ]}
                onPress={handleUpdateCus}
              >
                <Text style={styles.acceptButtonText}>
                  {waitingComplete ? "⏳ รอยืนยันจากระบบ..." : getUpdateCusLabel()}
                </Text>
              </TouchableOpacity>
            )}

          </View>
        ) : jobList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>ไม่มีรายการจอง</Text>
          </View>
        ) : (
          // 🔵 โหมดปกติ (ลิสงานทั้งหมด)
          jobList.map((job, index) => (
            <View key={job.id} style={styles.card}>
              {/* HEADER */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>รายการที่ {index + 1}</Text>

                <View style={[styles.badge, { backgroundColor: statusColor(job.status) }]}>
                  <Text style={styles.badgeText}>{statusLabel(job.status)}</Text>
                </View>
              </View>

              {/* USER */}
              <View style={styles.rowItem}>
                <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                <View>
                  <Text style={styles.mainText}>{job.fullName}</Text>
                  <Text style={styles.subText}>{job.phone}</Text>
                </View>
              </View>

              {/* DATE + TIME */}
              <View style={styles.row}>
                <View style={styles.infoBox}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.subText}>{job.dateBooking}</Text>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.subText}>{job.timeBooking}</Text>
                </View>
              </View>

              {/* TYPE */}
              <View style={styles.rowItem}>
                <Ionicons name="accessibility-outline" size={18} color="#6B7280" />
                <Text style={styles.mainText}>
                  {gender_CareTypeLabel(job.caregiver_Gender)}
                </Text>
              </View>

              {/* EQUIPMENT */}
              {job.equipment.length > 0 && (
                <View style={styles.tagRow}>
                  {job.equipment.map((eq: string, i: number) => (
                    <View key={i} style={styles.tag}>
                      <Ionicons name="construct-outline" size={12} color="#059669" />
                      <Text style={styles.tagText}>{equipmentLabel(eq)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* LOCATION */}
              <View style={styles.locationBox}>
                <View style={styles.locationRow}>
                  <Ionicons name="radio-button-on" size={14} color="#10B981" />
                  <Text style={styles.locationText}>{job.fromAddress}</Text>
                </View>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#EF4444" />
                  <Text style={styles.locationText}>{job.toAddress}</Text>
                </View>
              </View>

              {/* PRICE */}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>ค่าบริการ</Text>
                <Text style={styles.priceValue}>฿{job.fare.toLocaleString()}</Text>
              </View>

              {/* BUTTON */}
              {!activeJob && job.status === "pending" && (
                <View style={{ marginTop: 10 }}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptJob(job.id)}
                  >
                    <Text style={styles.acceptButtonText}>รับงาน</Text>
                  </TouchableOpacity>
                </View>
              )}
              {showUpdateSuccess && (
                <View style={styles.popupOverlay}>
                  <View style={styles.popupBox}>

                    <Ionicons name="checkmark-circle" size={60} color="#3B82F6" />

                    <Text style={styles.popupTitle}>อัปเดตสถานะแล้ว</Text>
                    <Text style={styles.popupText}>สถานะถูกบันทึกเรียบร้อย</Text>

                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
      {showSuccess && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>

            <Ionicons name="checkmark-circle" size={60} color="#10B981" />

            <Text style={styles.popupTitle}>รับงานสำเร็จ</Text>
            <Text style={styles.popupText}>คุณได้รับงานเรียบร้อยแล้ว</Text>

            <TouchableOpacity
              style={styles.popupButton}
              onPress={closePopup}
            >
              <Text style={styles.popupButtonText}>ตกลง</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
      {/* 🎉 Popup งานเสร็จสิ้น */}
      {showJobDone && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>

            <Ionicons name="checkmark-circle" size={60} color="#3B82F6" />

            <Text style={styles.popupTitle}>งานเสร็จสิ้น!</Text>
            <Text style={styles.popupText}>ขอบคุณที่ให้บริการ พร้อมรับงานใหม่แล้ว</Text>

            <TouchableOpacity
              style={[styles.popupButton, { backgroundColor: "#3B82F6" }]}
              onPress={() => {
                setShowJobDone(false);
                setActiveJob(null);
                setIsStarted(false);
              }}
            >
              <Text style={styles.popupButtonText}>ตกลง</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}
      {/* OVERLAY */}
      {open && (
        <TouchableOpacity style={styles.overlay} onPress={toggleProfile} activeOpacity={1} />
      )}

      {/* PROFILE PANEL */}
      <Animated.View style={[styles.profilePanel, { transform: [{ translateX: slideAnim }] }]}>
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
          <Text style={styles.menuItem}>เวอร์ชั่น</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.logout}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" },

  emptyBox: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#9CA3AF", fontSize: 14 },

  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },


  jobTitle: { fontWeight: "700", fontSize: 15, color: "#111827" },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginBottom: 12 },

  section: { marginBottom: 10 },
  sectionLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  valueText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  subValue: { fontSize: 13, color: "#6B7280", marginTop: 2 },



  infoLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 3 },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#374151" },




  locationLine: { width: 2, height: 16, backgroundColor: "#D1D5DB", marginLeft: 6, marginVertical: 2 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#10B981", marginTop: 3 },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#EF4444", marginTop: 3 },
  locationLabel: { fontSize: 11, color: "#9CA3AF" },
  locationValue: { fontSize: 13, color: "#374151", fontWeight: "500" },

  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    padding: 12,
  },
  fareLabel: { fontSize: 13, color: "#059669", fontWeight: "600" },
  fareValue: { fontSize: 18, fontWeight: "700", color: "#059669" },

  overlay: {
    position: "absolute", width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  profilePanel: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: 280,
    backgroundColor: "#fff",
  },

  profileHeader: {
    backgroundColor: "#43B7A5", padding: 20,
    alignItems: "center", paddingTop: 85,
  },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  profileName: { color: "#fff", fontWeight: "600" },
  profileRole: { color: "#D1FAE5", fontSize: 12 },

  menu: { padding: 20 },
  menuItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  logout: { color: "#43B7A5", textAlign: "center", marginTop: 20, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  mainText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  subText: {
    fontSize: 12,
    color: "#6B7280",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  infoBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
  },

  infoText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },

  tag: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  tagText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },

  locationBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  line: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },

  locationText: {
    fontSize: 12,
    color: "#374151",
    flex: 1,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  priceLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  acceptButton: {
    backgroundColor: "#10B981",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  popupOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  popupBox: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },

  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },

  popupText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },

  popupButton: {
    marginTop: 15,
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  popupButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});