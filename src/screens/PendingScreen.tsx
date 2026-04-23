// import React, { useEffect } from "react";
// import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
// import { doc, onSnapshot } from "firebase/firestore";
// import { db, auth } from "../firebase";
// import { useNavigation } from "@react-navigation/native";

// export default function PendingScreen() {
//   const navigation = useNavigation();

//   useEffect(() => {
//     const uid = auth.currentUser?.uid;

//     if (!uid) return;

//     // 🔥 ฟัง realtime
//     const unsub = onSnapshot(doc(db, "caregivers", uid), (snap) => {
//       const data = snap.data();

//       console.log("waiting approve...", data);

//       if (data?.isApproved === true) {
//         console.log("APPROVED!");

//         // ✅ ไปหน้า Home อัตโนมัติ
//         navigation.reset({
//           index: 0,
//           routes: [{ name: "MainTabs" }],
//         });
//       }
//     });

//     return () => unsub();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <ActivityIndicator size="large" color="#43B7A5" />

//       <Text style={styles.title}>
//         รอการอนุมัติจากแอดมิน
//       </Text>

//       <Text style={styles.subtitle}>
//         ระบบกำลังตรวจสอบข้อมูลของคุณ{"\n"}
//         กรุณารอสักครู่ (ประมาณ 1-2 วัน)
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#F3F4F6",
//     padding: 20,
//   },

//   title: {
//     fontSize: 20,
//     fontWeight: "600",
//     marginTop: 20,
//   },

//   subtitle: {
//     fontSize: 14,
//     color: "#6B7280",
//     textAlign: "center",
//     marginTop: 10,
//   },
// });