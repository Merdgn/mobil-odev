import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  AppState,
  Platform,
  Vibration,
  TextInput,
} from "react-native";
import { useHistoryContext } from "../context/HistoryContext";
import { useThemeContext } from "../context/ThemeContext";
import { useSettingsContext } from "../context/SettingsContext";

const DEMO_MODE = true;

const DURATIONS = {
  short: DEMO_MODE ? 15 : 15 * 60,
  pomodoro: DEMO_MODE ? 25 : 25 * 60,
  long: DEMO_MODE ? 50 : 50 * 60,
};

type SessionSummary = {
  modeLabel: string;
  category: string;
  durationSeconds: number;
  distractions: number;
  finishedAt: string;
  completed: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
};

export default function TimerScreen() {
  const { isDark, toggleTheme } = useThemeContext();

  const {
    vibrationEnabled,
    setVibrationEnabled,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    todayTotalMinutes,
    setTodayTotalMinutes,
  } = useSettingsContext();

  const sessionCategoryRef = useRef<string | null>(null);

  const [selectedMode, setSelectedMode] =
    useState<"short" | "pomodoro" | "long">("pomodoro");

  const [seconds, setSeconds] = useState<number>(DURATIONS.pomodoro);
  const [running, setRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const intervalRef = useRef<number | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const { addHistory } = useHistoryContext();

  const [distractions, setDistractions] = useState(0);

  const appState = useRef(AppState.currentState);
  const runningRef = useRef(running);
  const secondsRef = useRef(seconds);
  const distractionsRef = useRef(distractions);
  const [needToAskOnReturn, setNeedToAskOnReturn] = useState(false);
  const needToAskOnReturnRef = useRef(needToAskOnReturn);

  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Refs always current
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    distractionsRef.current = distractions;
  }, [distractions]);

  useEffect(() => {
    needToAskOnReturnRef.current = needToAskOnReturn;
  }, [needToAskOnReturn]);

  // ===== AppState (arka plan) =====
  useEffect(() => {
    if (Platform.OS === "web") return;

    const sub = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;

      if (prev === "active" && next.match(/inactive|background/)) {
        if (runningRef.current) {
          setDistractions((p) => p + 1);
          setRunning(false);
          setIsPaused(true);
          setNeedToAskOnReturn(true);

          // 🔔 Dikkat dağıldı titreşimi (ayar açıksa)
          if (vibrationEnabled && Platform.OS !== "web") {
            Vibration.vibrate(300);
          }
        }
      }

      if (
        (prev === "inactive" || prev === "background") &&
        next === "active"
      ) {
        if (needToAskOnReturnRef.current && secondsRef.current > 0) {
          Alert.alert("Dikkat Dağıldı 😟", "Devam etmek ister misin?", [
            {
              text: "Hayır",
              style: "cancel",
              onPress: () => {
                handleGiveUp();
                setNeedToAskOnReturn(false);
              },
            },
            {
              text: "Evet",
              onPress: () => {
                setRunning(true);
                setIsPaused(false);
                setNeedToAskOnReturn(false);
              },
            },
          ]);
        }
      }
    });

    return () => sub.remove();
  }, [vibrationEnabled]);

  // ===== Mod değişince reset =====
  useEffect(() => {
    stopTimerCompletely();
    setSeconds(DURATIONS[selectedMode]);
    setDistractions(0);
    setIsPaused(false);
    setNeedToAskOnReturn(false);
  }, [selectedMode]);

  // ===== Timer mekanizması =====
  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setIsPaused(false);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [running]);

  // ===== Oturum Tamamlandı =====
  const handleComplete = () => {
    const duration = DURATIONS[selectedMode];
    const modeLabel =
      selectedMode === "short"
        ? "Kısa"
        : selectedMode === "pomodoro"
        ? "Pomodoro"
        : "Uzun";

    // 🔔 Başarılı seans için titreşim
    if (vibrationEnabled && Platform.OS !== "web") {
      Vibration.vibrate(800);
    }

    const finishedAt = new Date().toISOString();
    const categoryLabel = sessionCategoryRef.current ?? "Belirtilmedi";

    const summaryData: SessionSummary = {
      modeLabel,
      category: categoryLabel,
      durationSeconds: duration,
      distractions: distractionsRef.current,
      finishedAt,
      completed: true,
      elapsedSeconds: duration,
      remainingSeconds: 0,
    };

    setTimeout(() => {
      addHistory({
        id: Date.now().toString(),
        mode: modeLabel,
        duration,
        date: finishedAt,
        category: categoryLabel,
        distractions: distractionsRef.current,
        completed: true,
        elapsedSeconds: duration,
        remainingSeconds: 0,
      });
    }, 0);

    setSummary(summaryData);
    setSummaryVisible(true);

    setTimeout(() => {
      setDistractions(0);
      setNeedToAskOnReturn(false);
      setSeconds(DURATIONS[selectedMode]);
      setRunning(false);
      setIsPaused(false);
    }, 0);
  };

  // ===== Oturum Yarım Kaldı =====
  const handleGiveUp = () => {
    const duration = DURATIONS[selectedMode];
    const remaining = secondsRef.current;
    const elapsed = duration - remaining;

    const modeLabel =
      selectedMode === "short"
        ? "Kısa"
        : selectedMode === "pomodoro"
        ? "Pomodoro"
        : "Uzun";

    const finishedAt = new Date().toISOString();
    const categoryLabel = sessionCategoryRef.current ?? "Belirtilmedi";

    const summaryData: SessionSummary = {
      modeLabel,
      category: categoryLabel,
      durationSeconds: duration,
      distractions: distractionsRef.current,
      finishedAt,
      completed: false,
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
    };

    setTimeout(() => {
      addHistory({
        id: Date.now().toString(),
        mode: modeLabel,
        duration,
        date: finishedAt,
        category: categoryLabel,
        distractions: distractionsRef.current,
        completed: false,
        elapsedSeconds: elapsed,
        remainingSeconds: remaining,
      });
    }, 0);

    setSummary(summaryData);
    setSummaryVisible(true);

    setTimeout(() => {
      setRunning(false);
      setIsPaused(false);
      setSeconds(DURATIONS[selectedMode]);
      setDistractions(0);
    }, 0);
  };

  // ===== Başlat =====
  const start = () => {
    if (isPaused && sessionCategoryRef.current) {
      setRunning(true);
      setIsPaused(false);
      return;
    }

    setCategoryModalVisible(true);
  };

  // ===== Kategori seçildi =====
  const chooseCategory = (cat: string) => {
    sessionCategoryRef.current = cat;

    setCategoryModalVisible(false);
    setSeconds(DURATIONS[selectedMode]);
    setDistractions(0);
    setIsPaused(false);
    setRunning(true);
  };

  // ===== Duraklat =====
  const pause = () => {
    setRunning(false);
    setIsPaused(true);
  };

  const resetSessionState = () => {
    setRunning(false);
    setIsPaused(false);
    setSeconds(DURATIONS[selectedMode]);
    setDistractions(0);
  };

  const stopTimerCompletely = () => {
    setRunning(false);
    setIsPaused(false);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  };

  const formatDuration = (s: number) => {
    if (s < 60) return `${s} saniye`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r === 0 ? `${m} dakika` : `${m} dakika ${r} saniye`;
  };

  const palette = isDark
    ? {
        screenBg: "#050816",
        cardBg: "#050a17",
        cardInner: "#070b1d",
        bigCircleBorder: "#5c6cff",
        bigCircleInner: "#050816",
        secondaryText: "#9aa4c6",
        mainText: "#f3f4ff",
        chipBg: "#111425",
        chipActive: "#4f46e5",
        chipActiveText: "#ffffff",
        chipText: "#f3f4ff",
        labelText: "#d1d5f5",
        accent: "#22c55e",
        resetBg: "transparent",
        resetBorder: "#4b5563",
        resetText: "#f3f4ff",
        modePillBg: "#111827",
      }
    : {
        screenBg: "#f5f5ff",
        cardBg: "#ffffff",
        cardInner: "#f4f5ff",
        bigCircleBorder: "#4f46e5",
        bigCircleInner: "#ffffff",
        secondaryText: "#6b7280",
        mainText: "#111827",
        chipBg: "#e5e7eb",
        chipActive: "#4f46e5",
        chipActiveText: "#ffffff",
        chipText: "#111827",
        labelText: "#4b5563",
        accent: "#16a34a",
        resetBg: "#ffffff",
        resetBorder: "#d1d5db",
        resetText: "#111827",
        modePillBg: "#e5e7eb",
      };

  const safeGoal = dailyGoalMinutes > 0 ? dailyGoalMinutes : 1;
  const progress = Math.min(todayTotalMinutes / safeGoal, 1);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.screenBg },
      ]}
    >
      {/* Üst header: Zamanlayıcı + Ayarlar + Tema */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.mainText }]}>
          Zamanlayıcı
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleTheme}
          >
            <Text style={styles.iconText}>
              {isDark ? "🌙" : "☀️"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.cardBg },
        ]}
      >
        <Text style={[styles.appTitle, { color: palette.mainText }]}>
          Fokus
        </Text>
        <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
          Bugün neye odaklanmak istersin?
        </Text>

        <View
          style={[
            styles.modeCard,
            { backgroundColor: palette.cardInner },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: palette.labelText }]}>
            Odak Modu
          </Text>

          <View
            style={[
              styles.modeSwitch,
              { backgroundColor: palette.modePillBg },
            ]}
          >
            <ModeButton label="Kısa" mode="short" />
            <ModeButton label="Pomodoro" mode="pomodoro" />
            <ModeButton label="Uzun" mode="long" />
          </View>

          {/* Büyük sayaç */}
          <View style={styles.timerWrapper}>
            <View
              style={[
                styles.timerCircleOuter,
                {
                  borderColor: palette.bigCircleBorder,
                  backgroundColor: palette.bigCircleInner,
                },
              ]}
            >
              <View style={styles.timerModeBadge}>
                <Text style={styles.timerModeBadgeText}>
                  {selectedMode === "short"
                    ? "Kısa"
                    : selectedMode === "pomodoro"
                    ? "Pomodoro"
                    : "Uzun"}
                </Text>
              </View>
              <Text style={[styles.timerText, { color: palette.mainText }]}>
                {format(seconds)}
              </Text>
            </View>
          </View>

          {/* Alt bilgiler */}
          <View style={styles.bottomRow}>
            <View>
              <Text
                style={[styles.bottomLabel, { color: palette.secondaryText }]}
              >
                Kategori
              </Text>
              <Text
                style={[styles.bottomValue, { color: palette.mainText }]}
              >
                {sessionCategoryRef.current ?? "Henüz seçilmedi"}
              </Text>
            </View>

            <View>
              <Text
                style={[styles.bottomLabel, { color: palette.secondaryText }]}
              >
                Dikkat Dağınıklığı
              </Text>
              <Text
                style={[styles.bottomValue, { color: palette.mainText }]}
              >
                {distractions}
              </Text>
            </View>
          </View>

          {/* Butonlar */}
          <View style={styles.buttonsRow}>
            {!running && !isPaused && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: palette.accent },
                ]}
                onPress={start}
              >
                <Text style={styles.primaryButtonText}>Başlat</Text>
              </TouchableOpacity>
            )}

            {isPaused && !running && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: "#f97316" },
                ]}
                onPress={start}
              >
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            )}

            {running && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: "#f97316" },
                ]}
                onPress={pause}
              >
                <Text style={styles.primaryButtonText}>Duraklat</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: palette.resetBg,
                  borderColor: palette.resetBorder,
                },
              ]}
              onPress={resetSessionState}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: palette.resetText },
                ]}
              >
                Sıfırla
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Kategori Modalı */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? "#020617" : "#ffffff" },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
            >
              Kategori Seç
            </Text>

            {[
              "Ders Çalışma",
              "Proje / Kodlama",
              "Ödev",
              "Kitap Okuma",
              "Meditasyon",
              "Genel Odak",
            ].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryItem}
                onPress={() => chooseCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: isDark ? "#e5e7eb" : "#111827" },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Özet Modalı */}
      <Modal visible={summaryVisible} transparent animationType="fade">
        <View style={styles.summaryOverlay}>
          <View
            style={[
              styles.summaryBox,
              { backgroundColor: isDark ? "#020617" : "#ffffff" },
            ]}
          >
            <Text
              style={[
                styles.summaryTitle,
                { color: isDark ? "#f9fafb" : "#111827" },
              ]}
            >
              Seans Özeti
            </Text>

            {summary && (
              <>
                <Text
                  style={[
                    styles.summaryText,
                    { color: isDark ? "#e5e7eb" : "#111827" },
                  ]}
                >
                  {formatDuration(summary.durationSeconds)} "
                  {summary.category}"{" "}
                  oturumu {summary.completed ? "tamamlandı." : "tamamlanamadı."}
                </Text>

                <Text
                  style={[
                    styles.summaryText,
                    { color: isDark ? "#e5e7eb" : "#111827" },
                  ]}
                >
                  Mod: {summary.modeLabel}
                </Text>

                {!summary.completed && (
                  <>
                    <Text
                      style={[
                        styles.summaryText,
                        { color: isDark ? "#e5e7eb" : "#111827" },
                      ]}
                    >
                      Geçen Süre: {formatDuration(summary.elapsedSeconds)}
                    </Text>
                    <Text
                      style={[
                        styles.summaryText,
                        { color: isDark ? "#e5e7eb" : "#111827" },
                      ]}
                    >
                      Kalan Süre:{" "}
                      {formatDuration(summary.remainingSeconds)}
                    </Text>
                  </>
                )}

                <Text
                  style={[
                    styles.summaryText,
                    { color: isDark ? "#e5e7eb" : "#111827" },
                  ]}
                >
                  Dikkat Dağınıklığı: {summary.distractions}
                </Text>
                <Text
                  style={[
                    styles.summaryText,
                    { color: isDark ? "#e5e7eb" : "#111827" },
                  ]}
                >
                  Bitiş: {new Date(summary.finishedAt).toLocaleTimeString()}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.summaryButton, { backgroundColor: "#3b82f6" }]}
              onPress={() => setSummaryVisible(false)}
            >
              <Text style={styles.summaryButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AYARLAR MODALI */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.settingsOverlay}>
          <View
            style={[
              styles.settingsBox,
              { backgroundColor: isDark ? "#020617" : "#ffffff" },
            ]}
          >
            <View style={styles.settingsHeaderRow}>
              <Text
                style={[
                  styles.settingsTitle,
                  { color: isDark ? "#111827" : "#111827" },
                ]}
              >
                Ayarlar
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={styles.settingsCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.settingsSubtitle,
                { color: isDark ? "#e5e7eb" : "#6b7280" },
              ]}
            >
              Uygulamanın davranışını kendine göre özelleştir ✨
            </Text>

            {/* Titreşim */}
            <View style={styles.settingsSection}>
              <Text
                style={[
                  styles.settingsSectionTitle,
                  { color: isDark ? "#f9fafb" : "#111827" },
                ]}
              >
                Titreşim
              </Text>
              <View style={styles.settingsRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.settingsRowTitle,
                      { color: isDark ? "#f9fafb" : "#111827" },
                    ]}
                  >
                    Titreşim
                  </Text>
                  <Text
                    style={[
                      styles.settingsRowSubtitle,
                      { color: isDark ? "#9ca3af" : "#6b7280" },
                    ]}
                  >
                    Seans bittiğinde ve dikkat dağıldığında titreşim gönder.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.switchOuter,
                    vibrationEnabled
                      ? styles.switchOuterOn
                      : styles.switchOuterOff,
                  ]}
                  onPress={() => setVibrationEnabled(!vibrationEnabled)}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      vibrationEnabled
                        ? styles.switchThumbOn
                        : styles.switchThumbOff,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Günlük Hedef */}
            <View style={styles.settingsSection}>
              <Text
                style={[
                  styles.settingsSectionTitle,
                  { color: isDark ? "#f9fafb" : "#111827" },
                ]}
              >
                Günlük Hedef
              </Text>

              <View style={styles.settingsRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.settingsRowTitle,
                      { color: isDark ? "#f9fafb" : "#111827" },
                    ]}
                  >
                    Günlük Hedef
                  </Text>
                  <Text
                    style={[
                      styles.settingsRowSubtitle,
                      { color: isDark ? "#9ca3af" : "#6b7280" },
                    ]}
                  >
                    Günde toplam odaklanmak istediğin süre (dakika).
                  </Text>
                </View>

                <View style={styles.goalInputWrapper}>
                  <TextInput
                    style={[
                      styles.goalInput,
                      {
                        color: isDark ? "#f9fafb" : "#111827",
                        borderColor: isDark ? "#374151" : "#d1d5db",
                        backgroundColor: isDark ? "#020617" : "#ffffff",
                      },
                    ]}
                    keyboardType="numeric"
                    value={String(dailyGoalMinutes)}
                    onChangeText={(txt) => {
                      const cleaned = txt.replace(/[^0-9]/g, "");
                      const val = cleaned === "" ? 0 : parseInt(cleaned, 10);
                      setDailyGoalMinutes(isNaN(val) ? 0 : val);
                    }}
                  />
                  <Text
                    style={[
                      styles.goalInputSuffix,
                      { color: isDark ? "#9ca3af" : "#6b7280" },
                    ]}
                  >
                    dk
                  </Text>
                </View>
              </View>

              <View style={styles.progressBlock}>
                <Text
                  style={[
                    styles.progressText,
                    { color: isDark ? "#e5e7eb" : "#4b5563" },
                  ]}
                >
                  Bugün: {todayTotalMinutes.toFixed(1)} dk / Hedef:{" "}
                  {dailyGoalMinutes} dk
                </Text>

                <View
                  style={[
                    styles.progressBarOuter,
                    {
                      backgroundColor: isDark ? "#111827" : "#e5e7eb",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarInner,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: "#22c55e",
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  function ModeButton({
    label,
    mode,
  }: {
    label: string;
    mode: "short" | "pomodoro" | "long";
  }) {
    const active = selectedMode === mode;
    return (
      <TouchableOpacity
        onPress={() => setSelectedMode(mode)}
        style={[
          styles.modeButton,
          active && { backgroundColor: "#4f46e5" },
        ]}
      >
        <Text
          style={[
            styles.modeButtonText,
            active && { color: "#ffffff" },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  iconText: {
    fontSize: 20,
  },

  card: {
    flex: 1,
    borderRadius: 32,
    padding: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  modeCard: {
    marginTop: 24,
    borderRadius: 28,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  modeSwitch: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  timerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  timerCircleOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  timerModeBadge: {
    position: "absolute",
    top: 26,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },
  timerModeBadgeText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottomLabel: {
    fontSize: 13,
  },
  bottomValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonsRow: {
    flexDirection: "row",
    marginTop: 28,
    gap: 12,
  },
  primaryButton: {
    flex: 1.1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 0.9,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  categoryItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#4b5563",
  },
  categoryText: {
    fontSize: 17,
    textAlign: "center",
  },

  summaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryBox: {
    width: "85%",
    borderRadius: 18,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 6,
  },
  summaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  summaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // SETTINGS MODAL
  settingsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  settingsBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    padding: 20,
  },
  settingsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "900",
  },
  settingsCloseText: {
    fontSize: 22,
  },
  settingsSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  settingsSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  settingsRowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingsRowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  switchOuter: {
    width: 48,
    height: 28,
    borderRadius: 999,
    padding: 2,
    justifyContent: "center",
  },
  switchOuterOn: {
    backgroundColor: "#22c55e",
    alignItems: "flex-end",
  },
  switchOuterOff: {
    backgroundColor: "#9ca3af",
    alignItems: "flex-start",
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  switchThumbOn: {
    shadowColor: "#22c55e",
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  switchThumbOff: {},

  goalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },
  goalInput: {
    minWidth: 60,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: "center",
  },
  goalInputSuffix: {
    fontSize: 14,
  },

  progressBlock: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 13,
    marginBottom: 4,
  },
  progressBarOuter: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    borderRadius: 999,
  },
});
