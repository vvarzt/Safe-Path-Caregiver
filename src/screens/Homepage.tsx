import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { onSnapshot } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import AppHeader from "../components/AppHeader";
import { db } from "../firebase";
import FaceScanModal from "../components/FaceScanModal";

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
  const [waitingComplete, setWaitingComplete] = useState(false);
  const [showJobDone, setShowJobDone] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [activeJob, setActiveJob] = useState<any>(null);
  const { data, setData } = useSignup();
  const [showSuccess, setShowSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [showFaceScan, setShowFaceScan] = useState(false);
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
  const [jobList, setJobList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const handleAcceptJob = async (jobId: string) => {
    try {
      const userId = data?.uid;
      if (!userId) return;

      let caregiverName = `${data?.firstName || ""} ${data?.lastName || ""}`.trim();

      if (!caregiverName) {
        const q = query(collection(db, "caregiver"), where("uid", "==", userId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const c = snap.docs[0].data();
          caregiverName = `${c.firstName || ""} ${c.lastName || ""}`.trim();
        }
      }

      const acceptedAt = new Date().toISOString();

      await updateDoc(doc(db, "bookings", jobId), {
        status: "accepted",
        caregiverId: userId,
        caregiverName,
        acceptedAt,
      });

      await updateDoc(doc(db, "caregivers", userId), {
        statusWork: "working",
      });

      // ✅ ดึงข้อมูลมา set activeJob ทันที ไม่ต้องรอ login ใหม่
      const bookingSnap = await getDoc(doc(db, "bookings", jobId));
      if (bookingSnap.exists()) {
        const jobData = bookingSnap.data();

        let fullName = "ไม่พบชื่อ";
        let phone = "-";

        if (jobData.userId) {
          const userSnap = await getDoc(doc(db, "users", jobData.userId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            fullName = u.fullname || u.fullName || u.name || "ไม่พบชื่อ";
            phone = u.phone || "-";
          }
        }

        setActiveJob({
          id: jobId,
          fullName,
          phone,
          dateBooking: jobData.dateBooking || "-",
          timeBooking: jobData.timeBooking || "-",
          passengerType: jobData.passengerType || "-",
          equipment: jobData.equipment || [],
          fare: jobData.fare || 0,
          distance: jobData.distance || 0,
          paymentMethod: jobData.paymentMethod || "-",
          status: "accepted",
          acceptedAt,
          fromAddress: jobData.fromLocation?.address || "-",
          toAddress: jobData.toLocation?.address || "-",
          fromLat: jobData.fromLocation?.lat || null,
          fromLng: jobData.fromLocation?.lng || null,
          toLat: jobData.toLocation?.lat || null,
          toLng: jobData.toLocation?.lng || null,
        });

        setIsStarted(false);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

    } catch (error) {
      console.log("❌ ACCEPT ERROR:", error);
    }
  };
  // ✅ Real-time listener สำหรับ caregiver statusWork
  useEffect(() => {
    if (!data?.uid) return;

    const caregiverRef = doc(db, "caregivers", data.uid);

    const unsubscribe = onSnapshot(caregiverRef, async (snap) => {
      if (!snap.exists()) return;

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
          passengerType: jobData.passengerType || "-",
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
        });
      }
    });

    return () => unsubscribe();
  }, [data?.uid, waitingComplete]); // 👈 เพิ่ม waitingComplete ใน deps

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "bookings"), async (snapshot) => {
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
              passengerType: d.passengerType || "-",
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
        const pendingOnly = bookings.filter((job) => job.status === "pending");

        setJobList(pendingOnly);
      } catch (err) {
        console.log("❌ SNAPSHOT ERROR:", err);
      } finally {
        setLoading(false);
      }
    });

    // ✅ สำคัญมาก (cleanup กัน memory leak)
    return () => unsubscribe();
  }, []);

  // ✅ คอย booking เปลี่ยนเป็น completed → แก้ statusWork เป็น idle
  useEffect(() => {
    if (!activeJob?.id || !waitingComplete) return;

    const bookingRef = doc(db, "bookings", activeJob.id);

    const unsubscribe = onSnapshot(bookingRef, async (snap) => {
      if (!snap.exists()) return;

      const d = snap.data();
      console.log("📦 booking status:", d.status);

      if (d.status === "completed") {
        // ✅ อัปเดต caregiver เป็น idle
        await updateDoc(doc(db, "caregivers", data.uid), {
          statusWork: "idle",
        });

        setWaitingComplete(false);
        setShowJobDone(true); // 🎉 แจ้งเตือน
        console.log("✅ งานเสร็จสิ้น → idle");
      }
    });

    return () => unsubscribe();
  }, [activeJob?.id, waitingComplete]);

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
            passengerType: d.passengerType || "-",
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

  const passengerTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      elderly: "ผู้สูงอายุ",
      disabled: "ผู้พิการ",
      patient: "ผู้ป่วย",
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
                {passengerTypeLabel(activeJob.passengerType)}
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
                style={[styles.acceptButton, { backgroundColor: "#3B82F6", marginTop: 10 }]}
                onPress={() => setShowFaceScan(true)} // 👈 เปิด modal แทน
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
                // Logic เดิม
                await updateDoc(doc(db, "bookings", activeJob.id), {
                  status: "in_progress",
                  startedAt: new Date().toISOString(),
                });
                setIsStarted(true);
                setActiveJob((prev: any) => ({ ...prev, status: "in_progress" }));
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
                style={[styles.acceptButton, { backgroundColor: "#EF4444", marginTop: 10 }]}
                onPress={async () => {
                  try {
                    // 1. แก้ statusWork เป็น "wait" ก่อน
                    await updateDoc(doc(db, "caregivers", data.uid), {
                      statusWork: "wait",
                    });

                    // 2. เริ่มรอ booking เป็น completed
                    setWaitingComplete(true);

                    console.log("⏳ รอ booking completed...");
                  } catch (err) {
                    console.log("❌ END JOB ERROR:", err);
                  }
                }}
              >
                <Text style={styles.acceptButtonText}>
                  {waitingComplete ? "⏳ รอยืนยันจากระบบ..." : "สิ้นสุดงาน"}
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
                  {passengerTypeLabel(job.passengerType)}
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