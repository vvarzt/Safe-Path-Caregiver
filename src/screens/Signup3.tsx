import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from "react";
import { uploadImage } from "../services/uploadImage";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSignup } from "../context/SignupContext";
import { auth, db } from '../firebase';
import { RootStackParamList } from "../navigation/AppNavigator";


type NavProp = NativeStackNavigationProp<RootStackParamList, "Signup3">;

export default function Signup3Screen() {
  const navigation = useNavigation<NavProp>();
  const { data, setData } = useSignup();
  const [loading, setLoading] = useState(false);

  const [idCard, setIdCard] = useState<string | null>(null);
  const [house, setHouse] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<string | null>(null);

  const [bank, setBank] = useState("");
  const [showBank, setShowBank] = useState(false);

  const [accountNumber, setAccountNumber] = useState("");
  const [bookBank, setBookBank] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [relation, setRelation] = useState("");
  const [showRelation, setShowRelation] = useState(false);

  const [contactPhone, setContactPhone] = useState("");

  /* ================= VALIDATE ================= */
  const validate = () => {
    if (!idCard || !house || !certificate || !bookBank) {
      Alert.alert("กรุณาอัปโหลดเอกสารให้ครบ");
      return false;
    }

    if (!bank) {
      Alert.alert("กรุณาเลือกธนาคาร");
      return false;
    }

    if (!accountNumber) {
      Alert.alert("กรุณากรอกเลขบัญชี");
      return false;
    }

    if (!contactName || !relation || !contactPhone) {
      Alert.alert("กรุณากรอกข้อมูลติดต่อให้ครบ");
      return false;
    }

    if (contactPhone.replace(/-/g, "").length !== 10) {
      Alert.alert("เบอร์โทรไม่ถูกต้อง");
      return false;
    }

    return true;
  };

  /* ================= NEXT ================= */
  const handleNext = async () => {
    if (!validate()) return;

    try {
      setLoading(true); // 🔥 เริ่มโหลด

      const uid = data.uid;

      const [
        profileUrl,
        idCardUrl,
        houseUrl,
        certUrl,
        bookUrl,
      ] = await Promise.all([
        data.image
          ? uploadImage(data.image, `caregivers/${uid}/profile.jpg`)
          : Promise.resolve(null),

        uploadImage(idCard!, `caregivers/${uid}/idCard.jpg`),
        uploadImage(house!, `caregivers/${uid}/house.jpg`),
        uploadImage(certificate!, `caregivers/${uid}/certificate.jpg`),
        uploadImage(bookBank!, `caregivers/${uid}/bookBank.jpg`),
      ]);

      const userData = {
        uid: data.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate,

        image: profileUrl,
        idCard: idCardUrl,
        house: houseUrl,
        certificate: certUrl,
        bookBank: bookUrl,

        address: data.address,
        province: data.province,
        district: data.district,
        subdistrict: data.subdistrict,
        zipcode: data.zipcode,

        bank,
        accountNumber,

        contactName,
        relation,
        contactPhone: contactPhone.replace(/-/g, ""),

        status: "caregiver",
        isApproved: false,
        createdAt: new Date(),
      };

      await setDoc(doc(db, "caregivers", uid), userData);

      Alert.alert("สำเร็จ", "สมัครเรียบร้อย 🎉");
      navigation.navigate("SignupSuccess");

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Upload ไม่สำเร็จ");
    } finally {
      setLoading(false); // 🔥 จบโหลด (สำคัญมาก!)
    }
  };

  /* ================= IMAGE ================= */
  const pickImage = async (setFn: any) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("ต้องอนุญาตการเข้าถึงรูปภาพ");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setFn(result.assets[0].uri);
    }
  };

  const takePhoto = async (setFn: any) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("ต้องอนุญาตการใช้กล้อง");
      return;
    }

    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      setFn(result.assets[0].uri);
    }
  };

  const handleUpload = (setFn: any) => {
    Alert.alert("อัปโหลดรูป", "ต้องการทำอะไร", [
      { text: "ถ่ายรูป", onPress: () => takePhoto(setFn) },
      { text: "เลือกรูปจากเครื่อง", onPress: () => pickImage(setFn) },
      { text: "ยกเลิก", style: "cancel" },
    ]);
  };

  /* ================= PHONE ================= */
  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  const banks = ["กสิกรไทย", "ไทยพาณิชย์", "กรุงไทย", "กรุงเทพ", "ttb"];
  const relations = ["บิดา/มารดา", "บุตร/ธิดา", "สามี/ภรรยา", "แฟน", "ญาติ"];

  const UploadBox = (title: string, value: string | null, setFn: any) => (
    <>
      <Text style={styles.label}>{title}</Text>
      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() => handleUpload(setFn)}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.uploadImage} />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={24} color="#999" />
            <Text style={{ color: "#999" }}>Upload photo(s)</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
  console.log("Auth UID:", auth.currentUser?.uid);
  console.log("Data UID:", data.uid);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>สร้างบัญชี</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.subtitle}>โปรดอัปโหลดเอกสารเพิ่มเติม</Text>

            {UploadBox("อัปโหลดสำเนาบัตรประชาชน", idCard, setIdCard)}
            {UploadBox("อัปโหลดสำเนาทะเบียนบ้าน", house, setHouse)}
            {UploadBox("อัปโหลดประวัติอาชญากรรม", certificate, setCertificate)}

            <Text style={styles.label}>ธนาคาร</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowBank(!showBank)}
            >
              <Text style={{ color: bank ? "#000" : "#999" }}>
                {bank || "โปรดเลือกธนาคาร"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>

            {showBank &&
              banks.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={styles.option}
                  onPress={() => {
                    setBank(b);
                    setShowBank(false);
                  }}
                >
                  <Text>{b}</Text>
                </TouchableOpacity>
              ))}

            <Text style={styles.label}>เลขบัญชี</Text>
            <TextInput
              style={styles.input}
              placeholder="โปรดระบุเลขบัญชีของคุณ"
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={(t) => setAccountNumber(t.replace(/\D/g, ""))}
            />

            {UploadBox("อัปโหลดสมุดบัญชี", bookBank, setBookBank)}

            <Text style={styles.label}>ข้อมูลผู้ติดต่อฉุกเฉิน</Text>

            <TextInput
              style={styles.input}
              placeholder="ชื่อ - นามสกุล"
              value={contactName}
              onChangeText={setContactName}
            />

            {/* 🔥 DROPDOWN ความสัมพันธ์ */}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowRelation(!showRelation)}
            >
              <Text style={{ color: relation ? "#000" : "#999" }}>
                {relation || "เลือกความสัมพันธ์"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>

            {showRelation &&
              relations.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={styles.option}
                  onPress={() => {
                    setRelation(r);
                    setShowRelation(false);
                  }}
                >
                  <Text>{r}</Text>
                </TouchableOpacity>
              ))}

            <TextInput
              style={styles.input}
              placeholder="เบอร์ติดต่อ"
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={(t) => setContactPhone(formatPhone(t))}
            />

            <TouchableOpacity
              style={[styles.nextButton, loading && { opacity: 0.6 }]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.nextText}>
                {loading ? "กำลังลงทะเบียน..." : "สมัคร"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* ===== STYLE ===== */
const styles = StyleSheet.create({
  header: {
    backgroundColor: "#43B7A5",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  back: { fontSize: 22, marginRight: 12 },
  headerTitle: { fontSize: 25, fontWeight: "600" },
  content: { padding: 24 },
  subtitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  label: { marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  uploadImage: { width: "100%", height: "100%" },
  dropdown: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 6,
  },
  nextButton: {
    backgroundColor: "#43B7A5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  nextText: { color: "#fff", fontWeight: "600" },
});
