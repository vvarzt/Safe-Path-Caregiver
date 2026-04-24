import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebase";
import { useSignup } from "../context/SignupContext";



// ─── Field Categories ───
const READONLY_FIELDS = [
  "uid",
  "email",
  "firstName",
  "lastName",
  "gender",
  "birthDate",
  "status",
  "isApproved",
  "createdAt",
];

const SENSITIVE_FIELDS = [
  "accountNumber",
  "bank",
];

const EDITABLE_FIELDS = [
  "phone",
  "address",
  "district",
  "subdistrict",
  "province",
  "zipcode",
  "contactName",
  "contactPhone",
  "relation",
];

const DOCUMENT_FIELDS = [
  { key: "idCard", label: "บัตรประชาชน" },
  { key: "certificate", label: "ใบรับรอง" },
  { key: "bookBank", label: "หน้าสมุดบัญชี" },
  { key: "house", label: "ทะเบียนบ้าน" },
];

// ─── Display helpers ───
const GENDER_MAP: Record<string, string> = {
  male: "ชาย",
  female: "หญิง",
  other: "อื่นๆ",
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "ชื่อ",
  lastName: "นามสกุล",
  email: "อีเมล",
  gender: "เพศ",
  birthDate: "วันเกิด",
  phone: "เบอร์โทรศัพท์",
  address: "ที่อยู่",
  district: "แขวง/ตำบล",
  subdistrict: "เขต/อำเภอ",
  province: "จังหวัด",
  zipcode: "รหัสไปรษณีย์",
  contactName: "ชื่อผู้ติดต่อฉุกเฉิน",
  contactPhone: "เบอร์ผู้ติดต่อฉุกเฉิน",
  relation: "ความสัมพันธ์",
  bank: "ธนาคาร",
  accountNumber: "เลขบัญชี",
};

const SECTIONS = [
  {
    title: "ข้อมูลส่วนตัว",
    icon: "person-outline",
    fields: ["firstName", "lastName", "email", "gender", "birthDate", "phone"],
  },
  {
    title: "ที่อยู่",
    icon: "home-outline",
    fields: ["address", "subdistrict", "district", "province", "zipcode"],
  },
  {
    title: "ผู้ติดต่อฉุกเฉิน",
    icon: "call-outline",
    fields: ["contactName", "contactPhone", "relation"],
  },
  {
    title: "บัญชีธนาคาร",
    icon: "card-outline",
    fields: ["bank", "accountNumber"],
  },
];

// ─── Classify field type ───
type FieldType = "readonly" | "sensitive" | "editable";

function getFieldType(key: string): FieldType {
  if (READONLY_FIELDS.includes(key)) return "readonly";
  if (EDITABLE_FIELDS.includes(key)) return "editable"; // ✅ priority สูง
  if (SENSITIVE_FIELDS.includes(key)) return "sensitive";
  return "readonly"; // กัน field แปลกหลุด
}

// ─── Mask sensitive value ───
function maskValue(key: string, value: string): string {
  if (!value || value === "-") return "-";
  if (key === "accountNumber") {
    return "*".repeat(Math.max(0, value.length - 4)) + value.slice(-4);
  }
  if (key === "bank") {
    return value; // bank แค่ชื่อ ไม่ต้อง mask
  }
  return value;
}

export default function ProfileScreen() {
  const { data } = useSignup();
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!data?.uid) return;
    fetchProfile();
  }, [data?.uid]);

  const fetchProfile = async () => {
    try {
      const snap = await getDoc(doc(db, "caregivers", data.uid));
      if (snap.exists()) setProfile(snap.data());
    } catch (e) {
      console.log("❌ fetch profile error:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (key: string, value: any): string => {
    if (value === undefined || value === null || value === "") return "-";
    if (key === "gender") return GENDER_MAP[value] || value;
    if (key === "birthDate" && value?.toDate) {
      return value.toDate().toLocaleDateString("th-TH", {
        year: "numeric", month: "long", day: "numeric",
      });
    }
    if (key === "zipcode") return value.toString();
    return value.toString();
  };

  const handleRowPress = (key: string) => {
    const type = getFieldType(key);

    if (type === "readonly") return;

    if (type === "sensitive") {
      // toggle reveal
      setRevealedFields((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }

    // ✅ editable → เปิด modal กลางจอ
    setEditField(key);
    setEditValue(profile[key]?.toString() || "");
  };

  const handleSave = async () => {
    if (!editField || !data?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "caregivers", data.uid), {
        [editField]: editValue,
      });
      setProfile((prev) => ({ ...prev, [editField]: editValue }));
      setEditField(null);
      Alert.alert("✅ บันทึกสำเร็จ");
    } catch (e) {
      Alert.alert("❌ เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้");
    } finally {
      setSaving(false);
    }
  };

  const renderRowIcon = (type: FieldType, key: string) => {
    if (type === "readonly") {
      return <Ionicons name="lock-closed-outline" size={14} color="#D1D5DB" />;
    }
    if (type === "sensitive") {
      return (
        <Ionicons
          name={revealedFields.has(key) ? "eye-off-outline" : "eye-outline"}
          size={16} color="#9CA3AF"
        />
      );
    }
    return <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />;
  };

  const renderDisplayValue = (key: string, rawValue: any): string => {
    const formatted = formatValue(key, rawValue);
    const type = getFieldType(key);
    if (type === "sensitive" && !revealedFields.has(key)) {
      return maskValue(key, formatted);
    }
    return formatted;
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#43B7A5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ─── HEADER ─── */}
      <View style={styles.header}>

        {/* 🔙 BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.replace("MainTabs")}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: profile.image || "https://i.pravatar.cc/150" }}
            style={styles.avatar}
          />
          <View style={[
            styles.approvedBadge,
            { backgroundColor: profile.isApproved ? "#10B981" : "#F59E0B" }
          ]}>
            <Ionicons name={profile.isApproved ? "checkmark" : "time"} size={12} color="#fff" />
          </View>
        </View>

        <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
        <Text style={styles.emailText}>{profile.email}</Text>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {profile.isApproved ? "✅ ได้รับการอนุมัติ" : "⏳ รอการอนุมัติ"}
          </Text>
        </View>
      </View>

      {/* ─── LEGEND ─── */}
      {/* <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Ionicons name="lock-closed-outline" size={12} color="#D1D5DB" />
          <Text style={styles.legendText}>ดูได้อย่างเดียว</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="eye-outline" size={12} color="#9CA3AF" />
          <Text style={styles.legendText}>กดเพื่อแสดง</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
          <Text style={styles.legendText}>แก้ไขได้</Text>
        </View>
      </View> */}

      {/* ─── SECTIONS ─── */}
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon as any} size={18} color="#43B7A5" />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>

          {section.fields.map((key) => {
            const type = getFieldType(key);
            const label = FIELD_LABELS[key] || key;
            const displayValue = renderDisplayValue(key, profile[key]);
            const isEmpty = displayValue === "-";

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.row,
                  type === "editable" && styles.rowEditable,
                ]}
                onPress={() => handleRowPress(key)}
                activeOpacity={type === "readonly" ? 1 : 0.65}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={[
                    styles.rowValue,
                    isEmpty && styles.rowEmpty,
                    type === "sensitive" && !revealedFields.has(key) && styles.rowMasked,
                  ]}>
                    {displayValue}
                  </Text>
                </View>
                {renderRowIcon(type, key)}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* ─── DOCUMENTS ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color="#43B7A5" />
          <Text style={styles.sectionTitle}>เอกสารประกอบ</Text>
          <Text style={styles.sectionNote}>(ติดต่อผู้ดูแลเพื่อเปลี่ยน)</Text>
        </View>
        <View style={styles.docGrid}>
          {DOCUMENT_FIELDS.map(({ key, label }) =>
            profile[key] ? (
              <View key={key} style={styles.docCard}>
                <Image source={{ uri: profile[key] }} style={styles.docImage} />
                <Text style={styles.docLabel}>{label}</Text>
              </View>
            ) : (
              <View key={key} style={styles.docCard}>
                <View style={styles.docPlaceholder}>
                  <Ionicons name="image-outline" size={28} color="#D1D5DB" />
                </View>
                <Text style={[styles.docLabel, { color: "#D1D5DB" }]}>{label}</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* ─── EDIT MODAL ─── */}
      {editField && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              แก้ไข {FIELD_LABELS[editField] || editField}
            </Text>
            <TextInput
              style={styles.input}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              placeholder={`กรอก${FIELD_LABELS[editField] || editField}`}
              placeholderTextColor="#9CA3AF"
              keyboardType={
                ["phone", "contactPhone", "zipcode"].includes(editField)
                  ? "phone-pad"
                  : "default"
              }
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setEditField(null)}
              >
                <Text style={styles.btnCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSave]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnSaveText}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#43B7A5",
    paddingTop: 60, paddingBottom: 30,
    alignItems: "center",
  },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: "#fff",
  },
  approvedBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  emailText: { color: "#D1FAE5", fontSize: 13, marginTop: 2 },
  statusPill: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 11, color: "#9CA3AF" },

  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151" },
  sectionNote: { fontSize: 11, color: "#9CA3AF", marginLeft: "auto" },

  row: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  rowEditable: { backgroundColor: "#FAFFFE" },
  rowLeft: { flex: 1, marginRight: 8 },
  rowLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  rowValue: { fontSize: 14, color: "#111827", fontWeight: "500" },
  rowEmpty: { color: "#9CA3AF", fontStyle: "italic" },
  rowMasked: { letterSpacing: 2, color: "#6B7280" },

  docGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 12, padding: 16,
  },
  docCard: { width: "45%", alignItems: "center" },
  docImage: {
    width: "100%", height: 90,
    borderRadius: 10, backgroundColor: "#F3F4F6",
  },
  docPlaceholder: {
    width: "100%", height: 90, borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#E5E7EB", borderStyle: "dashed",
  },
  docLabel: { fontSize: 11, color: "#6B7280", marginTop: 6, textAlign: "center" },

  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
  },
  modalBox: {
    width: "85%", backgroundColor: "#fff",
    borderRadius: 16, padding: 20,
  },

  backBtn: {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    padding: 8,
  },


  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 14 },
  input: {
    borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 10, padding: 12,
    fontSize: 15, color: "#111827",
    backgroundColor: "#F9FAFB", marginBottom: 16,
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  btnCancel: { backgroundColor: "#F3F4F6" },
  btnCancelText: { color: "#374151", fontWeight: "600" },
  btnSave: { backgroundColor: "#43B7A5" },
  btnSaveText: { color: "#fff", fontWeight: "600" },


});