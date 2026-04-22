import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../navigation/AppNavigator";

type WelcomeNavProp = NativeStackNavigationProp<RootStackParamList, "Welcome">;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavProp>();

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleThai}>ยินดีต้อนรับสู่</Text>
        <Text style={styles.titleEng}>SafePath</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.outlineButtonText}>เข้าสู่ระบบ</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filledButton}
          onPress={() => navigation.navigate("Signup1")}
        >
          <Text style={styles.filledButtonText}>ลงทะเบียน</Text>
          <Text style={styles.arrowFilled}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 120,
  },
  titleThai: {
    fontSize: 40,
    fontWeight: "700",
    marginTop: 140,
    marginBottom: 8,
  },
  titleEng: {
    fontSize: 50,
    fontWeight: "800",
  },
  buttonContainer: {
    gap: 16,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: "#0D9488",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  outlineButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0D9488",
  },
  filledButton: {
    backgroundColor: "#0D9488",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filledButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  arrow: {
    fontSize: 22,
    color: "#0D9488",
  },
  arrowFilled: {
    fontSize: 22,
    color: "#FFFFFF",
  },
});
