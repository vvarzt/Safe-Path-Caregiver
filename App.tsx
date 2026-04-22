import { SignupProvider } from "./src/context/SignupContext";
import "./src/firebase";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SignupProvider>
      <AppNavigator />
    </SignupProvider>
  );
}
