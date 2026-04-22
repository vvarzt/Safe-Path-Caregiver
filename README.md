# SafePath App - React Native Expo Version

แอปบริการช่วยเหลือฉุกเฉิน และจัดการข้อมูลผู้ใช้งาน (React Native Expo + Firebase)

---

## 📁 โครงสร้างโปรเจค

```
safepath/
├── App.tsx                          # Entry point
├── package.json                     # Dependencies
├── README.md                        # คู่มือการใช้งาน
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx         # React Navigation setup
│   ├── screens/
│   │   ├── Welcome.tsx              # หน้า Welcome
│   │   ├── Login.tsx                # หน้า Login
│   │   ├── Signup1.tsx              # ลงทะเบียน 1
│   │   ├── Signup2.tsx              # ลงทะเบียน 2
│   │   ├── Signup3.tsx              # ลงทะเบียน 3
│   │   ├── SignupSuccess.tsx        # สมัครสำเร็จ
│   │   ├── Homepage.tsx             # หน้าหลัก
│   │   ├── Profile.tsx              # โปรไฟล์
│   │   ├── History.tsx              # ประวัติ
│   │   ├── Document.tsx             # เอกสาร
│   │   ├── Money.tsx                # การเงิน
│   ├── context/
│   │   └── SignupContext.tsx        # เก็บข้อมูลระหว่างสมัคร
│   ├── data/
│   │   └── thailand.json            # ข้อมูลจังหวัด/ที่อยู่
```

---

## 🚀 การติดตั้ง (Installation)

### 1. Clone โปรเจค

```bash
git clone <your-repo-url>
cd safepath
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ติดตั้ง Dependencies เพิ่มเติม (กรณีมีปัญหา หรือใช้แยก)

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Icons
npx expo install @expo/vector-icons

# Image Picker
npx expo install expo-image-picker

# Date/Time Picker
npx expo install @react-native-community/datetimepicker

# Async Storage
npx expo install @react-native-async-storage/async-storage

# Firebase (ถ้ายังไม่มี)
npm install firebase
```

---

## 🔥 Firebase Setup (สำคัญมาก)

### 1. ไปที่ Firebase Console

* สร้าง Project
* เปิดใช้งาน Authentication (Email/Password)

### 2. สร้างไฟล์ config

สร้างไฟล์:

```
src/config/firebase.ts
```

ใส่ค่า:

```ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

export const app = initializeApp(firebaseConfig);
```

---

## ▶️ การรันโปรเจค

```bash
npx expo start
```

หรือ

```bash
npm start
```

---

## 📱 Features

* ✅ หน้า Welcome และ Login
* ✅ ระบบสมัครสมาชิก (3 ขั้นตอน)
* ✅ หน้า Homepage
* ✅ หน้าโปรไฟล์ผู้ใช้งาน
* ✅ ประวัติการใช้งาน
* ✅ ระบบจัดการเอกสาร
* ✅ ระบบการเงิน
* ✅ ใช้ Firebase Authentication
* ✅ ใช้ React Navigation

---

## 🧠 Technologies Used

* Expo (React Native)
* TypeScript
* Firebase (Authentication)
* React Navigation
* Async Storage

---

## 📝 Notes

* ใช้ Firebase สำหรับระบบ Login/Register
* ใช้ Context (`SignupContext`) สำหรับเก็บข้อมูลระหว่างสมัคร
* ใช้ `react-native` components เช่น `View`, `Text`, `TextInput`
* ใช้ `@react-navigation/native` สำหรับจัดการหน้าจอ
* ใช้ `expo-image-picker` สำหรับเลือกรูปภาพ
* ใช้ `@react-native-community/datetimepicker` สำหรับเลือกวันเวลา

---

## ⚠️ Important Notes (อ่านก่อนทำต่อ)

* ต้องตั้งค่า Firebase ก่อนใช้งาน Login/Register
* หาก Navigation error ให้ติดตั้ง dependencies ใหม่
* หากรันไม่ได้ ให้ลอง:

```bash
npx expo start -c
```

---

## 🔄 แนวทางการพัฒนาต่อ

* 🔲 เพิ่มระบบ SOS (แจ้งเหตุฉุกเฉิน)
* 🔲 เชื่อม Firestore สำหรับเก็บข้อมูลจริง
* 🔲 เพิ่ม Notification
* 🔲 เพิ่ม Maps และ Location

---

## 👥 สำหรับคนที่จะพัฒนาต่อ

แนะนำลำดับการทำ:

1. Setup Firebase ให้เรียบร้อย
2. เชื่อม Login/Register กับ Firebase
3. ทำระบบเก็บข้อมูล (Firestore)
4. เพิ่ม Feature ใหม่ เช่น SOS / Notification

---
