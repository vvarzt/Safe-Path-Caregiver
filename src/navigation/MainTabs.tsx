import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

import Homepage from "../screens/Homepage";
import Money from "../screens/Money";
import History from "../screens/History";
import Document from "../screens/Document";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // 🔥 ไอคอนเหมือนเดิม
        tabBarIcon: ({ color }) => {
          let iconName: any;

          if (route.name === "Homepage") iconName = "menu";
          else if (route.name === "Money") iconName = "wallet-outline";
          else if (route.name === "History") iconName = "time-outline";
          else if (route.name === "Document") iconName = "document-text-outline";

          return <Ionicons name={iconName} size={28} color={color} />;
        },

        tabBarActiveTintColor: "#43B7A5",
        tabBarInactiveTintColor: "#9CA3AF",

        // 🔥 ทำให้เหมือน style เดิมของคุณ
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarLabel: () => null, // ❌ เอาข้อความออก (เหลือแต่ icon)
      })}
    >
      <Tab.Screen name="Homepage" component={Homepage} />
      <Tab.Screen name="Money" component={Money} />
      <Tab.Screen name="History" component={History} />
      <Tab.Screen name="Document" component={Document} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    height: 75,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 15,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
});