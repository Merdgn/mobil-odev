// src/screens/SettingsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TextInput,
} from "react-native";
import { useThemeContext } from "../context/ThemeContext";
import { useSettingsContext } from "../context/SettingsContext";
import { useHistoryContext } from "../context/HistoryContext";

export default function SettingsScreen() {
  const { isDark } = useThemeContext();
  const {
    vibrationEnabled,
    dailyGoalMinutes,
    setVibrationEnabled,
    setDailyGoalMinutes,
  } = useSettingsContext();
  const { history } = useHistoryContext();

  const [goalInput, setGoalInput] = useState(String(dailyGoalMinutes));

  // Bugünkü toplam odaklanma süresi (saniye)
  const todaySeconds = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    let total = 0;
    history.forEach((item) => {
      const dayKey = item.date.slice(0, 10);
      if (dayKey === todayKey) {
        const focusTime =
          item.elapsedSeconds || (item.completed ? item.duration : 0);
        total += focusTime;
      }
    });
    return total;
  }, [history]);

  const goalSeconds = dailyGoalMinutes * 60;
  const progressRatio =
    goalSeconds > 0 ? Math.min(todaySeconds / goalSeconds, 1) : 0;

  const palette = isDark
    ? {
        screenBg: "#050816",
        cardBg: "#050a17",
        mainText: "#f9fafb",
        secondaryText: "#cbd5f5",
        accent: "#22c55e",
        barBg: "#1f2937",
        barFill: "#22c55e",
      }
    : {
        screenBg: "#f3f4ff",
        cardBg: "#ffffff",
        mainText: "#111827",
        secondaryText: "#4b5563",
        accent: "#16a34a",
        barBg: "#e5e7eb",
        barFill: "#16a34a",
      };

  const formatMinutes = (seconds: number) => {
    if (seconds <= 0) return "0 dk";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (s === 0) return `${m} dk`;
    return `${m} dk ${s} sn`;
  };

  const handleGoalChange = (text: string) => {
    setGoalInput(text);
    const num = parseInt(text, 10);
    if (!Number.isNaN(num)) {
      setDailyGoalMinutes(num);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.screenBg }]}>
      <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
        <Text style={[styles.title, { color: palette.mainText }]}>
          Ayarlar
        </Text>
        <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
          Uygulamanın davranışını kendine göre özelleştir ✨
        </Text>

        {/* Titreşim ayarı */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: palette.mainText }]}>
              Titreşim
            </Text>
            <Text style={[styles.helper, { color: palette.secondaryText }]}>
              Seans bittiğinde ve dikkat dağıldığında titreşim gönder.
            </Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
          />
        </View>

        {/* Günlük hedef */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: palette.mainText }]}>
              Günlük Hedef
            </Text>
            <Text style={[styles.helper, { color: palette.secondaryText }]}>
              Günde toplam odaklanmak istediğin süre (dakika).
            </Text>
          </View>
          <TextInput
            value={goalInput}
            onChangeText={handleGoalChange}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                color: palette.mainText,
                borderColor: isDark ? "#4b5563" : "#d1d5db",
              },
            ]}
          />
          <Text style={{ marginLeft: 4, color: palette.secondaryText }}>dk</Text>
        </View>
      </View>

      {/* Günlük hedef ilerleme barı */}
      <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
        <Text style={[styles.label, { color: palette.mainText }]}>
          Günlük Hedef İlerlemesi
        </Text>
        <Text style={[styles.helper, { color: palette.secondaryText }]}>
          Bugün: {formatMinutes(todaySeconds)} / Hedef:{" "}
          {dailyGoalMinutes} dk
        </Text>

        <View
          style={[
            styles.progressBar,
            { backgroundColor: palette.barBg },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: palette.barFill,
                width: `${progressRatio * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  label: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  helper: { fontSize: 12 },
  input: {
    width: 70,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "center",
    fontSize: 14,
  },
  progressBar: {
    height: 16,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
