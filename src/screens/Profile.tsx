import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function Profile() {
  const navigation = useNavigation<NavProp>();

  const handleLogout = () => {
    navigation.replace("Login"); // 🔥 ออกจากระบบ → ไป Login
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>ศิริลักษณ์</Text>
          <Text style={styles.role}>Caregiver</Text>
        </View>

        {/* MENU */}
        <View style={styles.menu}>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>การตั้งค่า</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuText}>ศูนย์ช่วยเหลือ</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuText}>เวอร์ชั่น</Text>
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },

  header: {
    backgroundColor: "#43B7A5",
    alignItems: "center",
    padding: 20,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
  },

  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  role: {
    color: "#D1FAE5",
    fontSize: 12,
  },

  menu: {
    padding: 20,
  },

  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  menuText: {
    fontSize: 14,
  },

  logout: {
    color: "#43B7A5",
    textAlign: "center",
    padding: 20,
    fontWeight: "600",
  },
});
