import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSignup } from "../context/SignupContext";
import { RootStackParamList } from "../navigation/AppNavigator";

const thaiAddress = require("../data/thailand.json") as ThaiAddressItem[];

type ThaiAddressItem = {
  province: string;
  district: string;
  subdistrict: string;
  zipcode: string;
};

type Signup2NavProp = NativeStackNavigationProp<RootStackParamList, "Signup2">;

export default function Signup2Screen() {
  const navigation = useNavigation<Signup2NavProp>();
  const { setData } = useSignup();

  const [address, setAddress] = useState("");

  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [subdistrict, setSubdistrict] = useState<string | null>(null);
  const [zipcode, setZipcode] = useState("");

  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [subdistrictSearch, setSubdistrictSearch] = useState("");

  /* ================= FILTER ================= */

  const provinces = useMemo(() => {
    return Array.from(new Set(thaiAddress.map((i) => i.province)))
      .filter((p) => p.includes(provinceSearch))
      .slice(0, 10);
  }, [provinceSearch]);

  const districts = useMemo(() => {
    if (!province) return [];
    return Array.from(
      new Set(
        thaiAddress
          .filter((i) => i.province === province)
          .map((i) => i.district),
      ),
    )
      .filter((d) => d.includes(districtSearch))
      .slice(0, 10);
  }, [province, districtSearch]);

  const subdistricts = useMemo(() => {
    if (!province || !district) return [];
    return thaiAddress
      .filter(
        (i) =>
          i.province === province &&
          i.district === district &&
          i.subdistrict.includes(subdistrictSearch),
      )
      .slice(0, 10);
  }, [province, district, subdistrictSearch]);

  /* ================= NEXT ================= */

  const handleNext = () => {
    if (!address) return Alert.alert("แจ้งเตือน", "กรุณากรอกที่อยู่");

    if (!province || !district || !subdistrict)
      return Alert.alert("แจ้งเตือน", "กรุณาเลือกจังหวัด / อำเภอ / ตำบล");

    // 🔥 เก็บข้อมูลต่อจาก Signup1 (รวม uid ที่เราสร้างไว้แล้ว)
    setData((prev: any) => ({
      ...prev,
      address,
      province,
      district,
      subdistrict,
      zipcode,
    }));

    navigation.navigate("Signup3");
  };

  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สร้างบัญชี</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>โปรดกรอกข้อมูลเพื่อสร้างบัญชี</Text>

        {/* ADDRESS */}
        <Text style={styles.label}>ที่อยู่ปัจจุบัน</Text>
        <TextInput
          style={styles.input}
          placeholder="โปรดระบุที่อยู่ของคุณ"
          placeholderTextColor="#999"
          value={address}
          onChangeText={setAddress}
        />

        {/* PROVINCE */}
        <Text style={styles.label}>จังหวัด</Text>
        <TextInput
          style={styles.search}
          placeholder="ค้นหาจังหวัด"
          value={provinceSearch}
          onChangeText={setProvinceSearch}
        />

        {provinces.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.option, province === p && styles.optionActive]}
            onPress={() => {
              setProvince(p);
              setDistrict(null);
              setSubdistrict(null);
              setZipcode("");
              setProvinceSearch(p);
            }}
          >
            <Text>{p}</Text>
          </TouchableOpacity>
        ))}

        {/* DISTRICT */}
        {province && (
          <>
            <Text style={styles.label}>อำเภอ / เขต</Text>
            <TextInput
              style={styles.search}
              placeholder="ค้นหาอำเภอ"
              value={districtSearch}
              onChangeText={setDistrictSearch}
            />

            {districts.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.option, district === d && styles.optionActive]}
                onPress={() => {
                  setDistrict(d);
                  setSubdistrict(null);
                  setZipcode("");
                  setDistrictSearch(d);
                }}
              >
                <Text>{d}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* SUBDISTRICT */}
        {district && (
          <>
            <Text style={styles.label}>ตำบล / แขวง</Text>
            <TextInput
              style={styles.search}
              placeholder="ค้นหาตำบล"
              value={subdistrictSearch}
              onChangeText={setSubdistrictSearch}
            />

            {subdistricts.map((s) => (
              <TouchableOpacity
                key={s.subdistrict + s.zipcode}
                style={[
                  styles.option,
                  subdistrict === s.subdistrict && styles.optionActive,
                ]}
                onPress={() => {
                  setSubdistrict(s.subdistrict);
                  setZipcode(s.zipcode);
                  setSubdistrictSearch(s.subdistrict);
                }}
              >
                <Text>
                  {s.subdistrict} ({s.zipcode})
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* BUTTON */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>ถัดไป</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ================= STYLE ================= */

const styles = StyleSheet.create({
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
    fontSize: 24,
    fontWeight: "600",
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  subtitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "500",
  },

  label: {
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },

  search: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 6,
  },

  optionActive: {
    borderColor: "#43B7A5",
    backgroundColor: "#ECFDF5",
  },

  nextButton: {
    backgroundColor: "#43B7A5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },

  nextText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
