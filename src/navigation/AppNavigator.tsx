import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/Login";
import Signup1Screen from "../screens/Signup1";
import Signup2Screen from "../screens/Signup2";
import Signup3Screen from "../screens/Signup3";
import SignupSuccess from "../screens/SignupSuccess";
import WelcomeScreen from "../screens/Welcome";

import MainTabs from "./MainTabs"; // ⭐ import tab
import Profilescreen from "../screens/ProfileScreen";
// import PendingScreen from "../screens/PendingScreen";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup1: undefined;
  Signup2: undefined;
  Signup3: undefined;
  SignupSuccess: undefined;
  MainTabs: undefined;
  PendingScreen: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup1" component={Signup1Screen} />
        <Stack.Screen name="Signup2" component={Signup2Screen} />
        <Stack.Screen name="Signup3" component={Signup3Screen} />
        <Stack.Screen name="SignupSuccess" component={SignupSuccess} />
        <Stack.Screen name="Profile" component={Profilescreen} />
        {/* <Stack.Screen name="PendingScreen" component={PendingScreen} /> */}

        {/* 🔥 หลัง login เข้า tab */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}