import "react-native-gesture-handler";
import * as React from "react";
import { Text, TouchableOpacity } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TimerScreen from "./src/screens/TimerScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

import { HistoryProvider } from "./src/context/HistoryContext";
import { ThemeProvider, useThemeContext } from "./src/context/ThemeContext";
import { SettingsProvider } from "./src/context/SettingsContext";

const Tab = createBottomTabNavigator();

function ThemeToggleButton() {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{ marginRight: 16 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={{ fontSize: 18 }}>
        {isDark ? "☀️" : "🌙"}
      </Text>
    </TouchableOpacity>
  );
}

function RootTabs() {
  const { isDark } = useThemeContext();

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: isDark ? "#4f9dff" : "#0066ff",
        tabBarInactiveTintColor: isDark ? "#9aa4c6" : "#777",
        tabBarStyle: {
          backgroundColor: isDark ? "#050816" : "#ffffff",
          borderTopColor: isDark ? "#141829" : "#ddd",
        },
        headerStyle: {
          backgroundColor: isDark ? "#050816" : "#ffffff",
        },
        headerTintColor: isDark ? "#f2f4ff" : "#111",
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      <Tab.Screen name="Zamanlayıcı" component={TimerScreen} />
      <Tab.Screen name="Raporlar" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <HistoryProvider>
          <NavigationContainer theme={DefaultTheme}>
            <RootTabs />
          </NavigationContainer>
        </HistoryProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
