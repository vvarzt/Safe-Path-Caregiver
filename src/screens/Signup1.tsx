import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import React, { useState, useRef } from "react";
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
import { auth } from '../firebase';
import { RootStackParamList } from "../navigation/AppNavigator";
type Signup1NavProp = NativeStackNavigationProp<RootStackParamList, "Signup1">;


export default function Signup1Screen() {
  const navigation = useNavigation<Signup1NavProp>();
  const { setData } = useSignup();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");

  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [image, setImage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [ageError, setAgeError] = useState("");

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  /* ================= PHONE ================= */
  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    if (cleaned.length < 4) return cleaned;
    if (cleaned.length < 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  /* ================= IMAGE ================= */
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("แจ้งเตือน", "ต้องอนุญาตการเข้าถึงรูปภาพ");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("แจ้งเตือน", "ต้องอนุญาตการใช้กล้อง");
      return;
    }

    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleImagePick = () => {
    Alert.alert("เลือกรูป", "ต้องการทำอะไร", [
      { text: "ถ่ายรูป", onPress: takePhoto },
      { text: "เลือกรูปจากเครื่อง", onPress: pickImage },
      { text: "ยกเลิก", style: "cancel" },
    ]);
  };

  /* ================= VALIDATE ================= */
  const validate = () => {
    if (passwordError || ageError)
      return Alert.alert("แจ้งเตือน", "กรุณาแก้ไขข้อมูลให้ถูกต้อง");

    if (!image) return Alert.alert("แจ้งเตือน", "กรุณาเพิ่มรูปโปรไฟล์");
    if (!firstName || !lastName)
      return Alert.alert("แจ้งเตือน", "กรุณากรอกชื่อ-นามสกุล");
    if (!birthDate) return Alert.alert("แจ้งเตือน", "กรุณาเลือกวันเกิด");
    if (!gender) return Alert.alert("แจ้งเตือน", "กรุณาเลือกเพศ");

    if (!email || !password || !confirmPassword || !phone)
      return Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบ");

    if (phone.replace(/-/g, "").length !== 10)
      return Alert.alert("แจ้งเตือน", "เบอร์มือถือไม่ถูกต้อง");

    if (password !== confirmPassword)
      return Alert.alert("แจ้งเตือน", "รหัสผ่านไม่ตรงกัน");

    if (!accepted) return Alert.alert("แจ้งเตือน", "กรุณายอมรับเงื่อนไข");

    return true;
  };

  /* ================= NEXT ================= */
  const handleNext = async () => {
    if (!validate()) return;

    try {
      // 🔥 สร้าง user ก่อน
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 🔥 เก็บ uid ลง context
      setData((prev) => ({
        ...prev,
        uid,
        firstName,
        lastName,
        gender,
        birthDate,
        email,
        password,
        phone: phone.replace(/-/g, ""),
        image,
        role: "caregiver",
      }));

      navigation.navigate("Signup2");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", error.message);
    }
  };

  const isEnabled = accepted;

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={100}   // 👈 สำคัญ
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>        
        <View style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>สร้างบัญชี</Text>
        </View>

          <View style={styles.container}>
            <View style={styles.content}>
              <Text style={styles.subtitle}>
                โปรดกรอกข้อมูลเพื่อสร้างบัญชี
              </Text>

              {/* PROFILE */}
              <TouchableOpacity
                style={styles.avatar}
                onPress={handleImagePick}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={50} color="#9CA3AF" />
                )}
                <View style={styles.plusIcon}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* NAME */}
              <Text style={styles.label}>ชื่อจริง</Text>
              <TextInput
                style={styles.input}
                placeholder="โปรดระบุชื่อจริงของคุณ"
                placeholderTextColor="#9CA3AF"
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.label}>นามสกุล</Text>
              <TextInput
                style={styles.input}
                placeholder="โปรดระบุนามสกุลของคุณ"
                placeholderTextColor="#9CA3AF"
                value={lastName}
                onChangeText={setLastName}
              />

              {/* DATE */}
              <Text style={styles.label}>วันเกิด</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDate(true)}
              >
                <Text style={{ color: birthDate ? "#000" : "#9CA3AF" }}>
                  {birthDate
                    ? birthDate.toLocaleDateString("th-TH")
                    : "โปรดระบุวันเกิด"}
                </Text>
              </TouchableOpacity>

              {ageError !== "" && (
                <Text style={styles.errorText}>{ageError}</Text>
              )}

              {showDate && (
                <View style={styles.dateContainer}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(_, d) => d && setTempDate(d)}
                  />
                  <View style={styles.dateButtonRow}>
                    <TouchableOpacity onPress={() => setShowDate(false)}>
                      <Text>ยกเลิก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateBtnOk}
                      onPress={() => {
                        const today = new Date();
                        const age =
                          today.getFullYear() -
                          tempDate.getFullYear() -
                          (today <
                            new Date(
                              today.getFullYear(),
                              tempDate.getMonth(),
                              tempDate.getDate(),
                            )
                            ? 1
                            : 0);

                        if (age < 18) {
                          setAgeError("ต้องมีอายุ 18 ปีขึ้นไป");
                        } else {
                          setAgeError("");
                          setBirthDate(tempDate);
                        }

                        setShowDate(false);
                      }}
                    >
                      <Text style={{ color: "#fff" }}>ตกลง</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* GENDER */}
              <Text style={styles.label}>เพศ</Text>
              <View style={{ flexDirection: "row", marginBottom: 14 }}>
                {["ชาย", "หญิง", "อื่นๆ"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={{ flexDirection: "row", marginRight: 15 }}
                  >
                    <View style={styles.radio}>
                      {gender === g && <View style={styles.radioActive} />}
                    </View>
                    <Text>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* EMAIL */}
              <Text style={styles.label}>อีเมล</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              {/* PASSWORD */}
              <Text style={styles.label}>รหัสผ่าน</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="กรอกรหัสผ่าน"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(
                      text.length < 6 ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" : ""
                    );
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}

                />

                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {passwordError !== "" && (
                <Text style={styles.errorText}>{passwordError}</Text>
              )}

              {/* CONFIRM */}
              <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="ยืนยันรหัสผ่าน"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />

                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* PHONE */}
              <Text style={styles.label}>เบอร์มือถือ</Text>
              <TextInput
                style={styles.input}
                placeholder="โปรดระบุหมายเลขมือถือ"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => setPhone(formatPhone(t))}
                returnKeyType="done"
                onSubmitEditing={handleNext}
              />

              {/* CHECKBOX */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAccepted(!accepted)}
              >
                <View
                  style={[
                    styles.checkbox,
                    accepted && styles.checkboxChecked,
                  ]}
                >
                  {accepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text>ฉันยอมรับเงื่อนไขบริการ และความเป็นส่วนตัว</Text>
              </TouchableOpacity>

              {/* BUTTON */}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: isEnabled ? "#43B7A5" : "#ccc" },
                ]}
                onPress={handleNext}
              >
                <Text style={styles.nextText}>ถัดไป</Text>
              </TouchableOpacity>
            </View>
          </View>
      </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
}

/* ================= STYLE ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#43B7A5",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  back: {
    fontSize: 22,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "600",
  },

  subtitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },

  content: { padding: 24 },

  label: { marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },

  passwordInput: {
    flex: 1,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#43B7A5",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  radioActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#43B7A5",
  },

  errorText: {
    color: "red",
    marginBottom: 10,
  },

  avatar: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },

  plusIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#43B7A5",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#43B7A5",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: "#43B7A5",
  },

  checkmark: {
    color: "#fff",
    fontSize: 12,
  },

  dateContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 14,
  },

  dateButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
  },

  dateBtnOk: {
    backgroundColor: "#43B7A5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  nextButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  nextText: {
    color: "#fff",
    fontWeight: "600",
  },
});
