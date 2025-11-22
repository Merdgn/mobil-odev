import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
  Modal,
  AppState,
  Platform,
} from "react-native";
import { useHistoryContext } from "../context/HistoryContext";

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
  // 🔥 SEANSI KORUYAN DEĞİŞKENLER
  const sessionCategoryRef = useRef<string | null>(null);

  const [selectedMode, setSelectedMode] =
    useState<"short" | "pomodoro" | "long">("pomodoro");

  const [seconds, setSeconds] = useState<number>(DURATIONS.pomodoro);
  const [running, setRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false); // 🔥 YENİ

  const intervalRef = useRef<number | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // =============== REF GÜNCELLEYİCİLER ===============
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

  // =====================================================
  // 📌 APPSTATE — UYGULAMA ARKA PLANA GİDİNCE
  // =====================================================
  useEffect(() => {
    if (Platform.OS === "web") return;

    const sub = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;

      if (prev === "active" && next.match(/inactive|background/)) {
        if (runningRef.current) {
          setDistractions((p) => p + 1);
          setRunning(false);
          setIsPaused(true); // 🔥 arka plana gidince pause gibi davran
          setNeedToAskOnReturn(true);
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
  }, []);

  // =====================================================
  // 📌 MOD DEĞİŞİNCE RESET
  // =====================================================
  useEffect(() => {
    stopTimerCompletely();
    setSeconds(DURATIONS[selectedMode]);
    setDistractions(0);
    setIsPaused(false);
    setNeedToAskOnReturn(false);
  }, [selectedMode]);

  // =====================================================
  // 📌 TIMER MEKANİĞİ
  // =====================================================
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

  // =====================================================
  // 📌 SEANS TAMAMLANDI
  // =====================================================
  const handleComplete = () => {
    const duration = DURATIONS[selectedMode];
    const modeLabel =
      selectedMode === "short"
        ? "Kısa"
        : selectedMode === "pomodoro"
        ? "Pomodoro"
        : "Uzun";

    const summaryData: SessionSummary = {
      modeLabel,
      category: sessionCategoryRef.current ?? "Belirtilmedi",
      durationSeconds: duration,
      distractions: distractionsRef.current,
      finishedAt: new Date().toISOString(),
      completed: true,
      elapsedSeconds: duration,
      remainingSeconds: 0,
    };

    addHistory({
      id: Date.now().toString(),
      mode: modeLabel,
      duration,
      date: summaryData.finishedAt,
      category: sessionCategoryRef.current ?? "Belirtilmedi",
      distractions: distractionsRef.current,
      completed: true,
      elapsedSeconds: duration,
      remainingSeconds: 0,
    });

    setSummary(summaryData);
    setSummaryVisible(true);
    resetSessionState();
  };

  // =====================================================
  // 📌 SEANS YARIM KALDI (Hayır)
  // =====================================================
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

    const summaryData: SessionSummary = {
      modeLabel,
      category: sessionCategoryRef.current ?? "Belirtilmedi",
     	durationSeconds: duration,
      distractions: distractionsRef.current,
      finishedAt,
      completed: false,
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
    };

    addHistory({
      id: Date.now().toString(),
      mode: modeLabel,
      duration,
      date: finishedAt,
      category: sessionCategoryRef.current ?? "Belirtilmedi",
      distractions: distractionsRef.current,
      completed: false,
      elapsedSeconds: elapsed,
      remainingSeconds: remaining,
    });

    setSummary(summaryData);
    setSummaryVisible(true);
    resetSessionState();
  };

  // =====================================================
  // 📌 BAŞLAT EVENTİ
  // =====================================================
  const start = () => {
    // Eğer devam edilebilir bir seans varsa kategori seçtirmiyoruz
    if (isPaused && sessionCategoryRef.current) {
      setRunning(true);
      setIsPaused(false);
      return;
    }

    // Yeni seans → kategori seçtir
    setCategoryModalVisible(true);
  };

  // =====================================================
  // 📌 KATEGORİ SEÇİLDİ
  // =====================================================
  const chooseCategory = (cat: string) => {
    sessionCategoryRef.current = cat;
    setSelectedCategory(cat);

    setCategoryModalVisible(false);
    setSeconds(DURATIONS[selectedMode]);
    setDistractions(0);
    setIsPaused(false);
    setRunning(true);
  };

  // =====================================================
  // 📌 DURAKLAT
  // =====================================================
  const pause = () => {
    setRunning(false);
    setIsPaused(true);
  };

  // =====================================================
  // 📌 RESET
  // =====================================================
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

  // =====================================================
  // 📌 FORMATLAYICILAR
  // =====================================================
  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDuration = (s: number) => {
    if (s < 60) return `${s} saniye`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r === 0 ? `${m} dakika` : `${m} dakika ${r} saniye`;
  };

  // =====================================================
  // UI
  // =====================================================
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odak Modu</Text>

      <View style={styles.modeContainer}>
        <ModeButton label="Kısa" mode="short" />
        <ModeButton label="Pomodoro" mode="pomodoro" />
        <ModeButton label="Uzun" mode="long" />
      </View>

      <Text style={styles.time}>{format(seconds)}</Text>

      <Text style={styles.infoText}>
        Seçilen kategori: {sessionCategoryRef.current ?? "—"}
      </Text>
      <Text style={styles.infoText}>Dikkat Dağınıklığı: {distractions}</Text>

      <View style={styles.buttons}>
        {!running && !isPaused && (
          <Button title="Başlat" onPress={start} />
        )}

        {isPaused && !running && (
          <Button title="Devam Et" onPress={start} />
        )}

        {running && (
          <Button title="Duraklat" onPress={pause} />
        )}

        <Button title="Sıfırla" onPress={resetSessionState} />
      </View>

      {/* Kategori Modalı */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Kategori Seç</Text>

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
                <Text style={styles.categoryText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Özet Modalı */}
      <Modal visible={summaryVisible} transparent animationType="fade">
        <View style={styles.summaryOverlay}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Seans Özeti</Text>

            {summary && (
              <>
                <Text style={styles.summaryText}>
                  {formatDuration(summary.durationSeconds)} "{summary.category}"
                  {" "}oturumu {summary.completed ? "tamamlandı." : "tamamlanamadı."}
                </Text>

                <Text style={styles.summaryText}>Mod: {summary.modeLabel}</Text>

                {!summary.completed && (
                  <>
                    <Text style={styles.summaryText}>
                      Geçen Süre: {formatDuration(summary.elapsedSeconds)}
                    </Text>
                    <Text style={styles.summaryText}>
                      Kalan Süre: {formatDuration(summary.remainingSeconds)}
                    </Text>
                  </>
                )}

                <Text style={styles.summaryText}>
                  Dikkat Dağınıklığı Sayısı: {summary.distractions}
                </Text>
                <Text style={styles.summaryText}>
                  Bitiş:{" "}
                  {new Date(summary.finishedAt).toLocaleTimeString()}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={styles.summaryButton}
              onPress={() => setSummaryVisible(false)}
            >
              <Text style={styles.summaryButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  // =====================================================
  // BUTTON COMPONENT
  // =====================================================
  function ModeButton({
    label,
    mode,
  }: {
    label: string;
    mode: "short" | "pomodoro" | "long";
  }) {
    return (
      <TouchableOpacity
        onPress={() => setSelectedMode(mode)}
        style={[
          styles.modeButton,
          selectedMode === mode ? styles.modeButtonActive : styles.modeButtonInactive,
        ]}
      >
        <Text
          style={
            selectedMode === mode
              ? styles.modeTextActive
              : styles.modeTextInactive
          }
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },

  modeContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  modeButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  modeButtonActive: { backgroundColor: "#4287f5" },
  modeButtonInactive: { backgroundColor: "#ececec" },
  modeTextActive: { color: "#fff", fontWeight: "700" },
  modeTextInactive: { color: "#333", fontWeight: "600" },

  time: { fontSize: 60, fontWeight: "900", marginBottom: 10 },

  infoText: { fontSize: 14, marginBottom: 4, color: "#555" },

  buttons: { flexDirection: "row", gap: 16, marginTop: 16 },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 15 },
  categoryItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  categoryText: { fontSize: 18, textAlign: "center" },

  summaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryBox: {
    backgroundColor: "white",
    width: "85%",
    borderRadius: 14,
    padding: 20,
  },
  summaryTitle: { fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 10 },
  summaryText: { fontSize: 16, marginBottom: 6 },
  summaryButton: {
    marginTop: 12,
    backgroundColor: "#4287f5",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  summaryButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
