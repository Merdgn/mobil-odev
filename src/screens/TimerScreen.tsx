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

// 🔥 DEMO MODU
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
  const [selectedMode, setSelectedMode] =
    useState<"short" | "pomodoro" | "long">("pomodoro");
  const [seconds, setSeconds] = useState<number>(DURATIONS.pomodoro);
  const [running, setRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  // 🔹 Kategori seçimi
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Bu ref seans boyunca kategoriyi tutar (kaybolmaz)
  const sessionCategoryRef = useRef<string | null>(null);

  const { addHistory } = useHistoryContext();

  // Dikkat dağınıklığı
  const [distractions, setDistractions] = useState(0);

  // AppState takibi
  const appState = useRef(AppState.currentState);
  const runningRef = useRef(running);
  const secondsRef = useRef(seconds);
  const distractionsRef = useRef(distractions);
  const [needToAskOnReturn, setNeedToAskOnReturn] = useState(false);
  const needToAskOnReturnRef = useRef(needToAskOnReturn);

  // Seans özeti
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // ---- Ref'leri güncel tut ----
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

  // ---- AppState Listener (sadece mobil) ----
  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = appState.current;
      appState.current = nextState;

      // Aktifken arka plana geçti
      if (prevState === "active" && nextState.match(/inactive|background/)) {
        if (runningRef.current) {
          setDistractions((prev) => prev + 1); // dikkat dağınıklığı say
          setRunning(false); // sayacı durdur
          setNeedToAskOnReturn(true); // geri dönünce sor
        }
      }

      // Arka plandan tekrar aktif oldu
      if (
        (prevState === "inactive" || prevState === "background") &&
        nextState === "active"
      ) {
        if (needToAskOnReturnRef.current && secondsRef.current > 0) {
          Alert.alert(
            "Dikkat Dağıldı 😟",
            "Oturum duraklatıldı. Devam etmek ister misin?",
            [
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
                  // 🔥 Eski kategoriyi aynen koru, sadece devam et
                  setRunning(true);
                  setNeedToAskOnReturn(false);
                },
              },
            ]
          );
        }
      }
    });

    return () => subscription.remove();
  }, []);

  // ---- Mod değişince reset ----
  useEffect(() => {
    reset(); // alttaki reset fonksiyonunu kullanıyoruz
  }, [selectedMode]);

  // ---- Sayaç geri sayım ----
  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setRunning(false);
          handleComplete(); // bitti
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, selectedMode]);

  // ---- Süre doğal bitti → tamamlanan seans ----
  const handleComplete = () => {
    const realDuration = DURATIONS[selectedMode];
    const modeLabel =
      selectedMode === "short"
        ? "Kısa"
        : selectedMode === "pomodoro"
        ? "Pomodoro"
        : "Uzun";

    const categoryLabel =
      sessionCategoryRef.current ?? selectedCategory ?? "Belirtilmedi";

    const finishedAt = new Date().toISOString();

    const summaryData: SessionSummary = {
      modeLabel,
      category: categoryLabel,
      durationSeconds: realDuration,
      distractions: distractionsRef.current,
      finishedAt,
      completed: true,
      elapsedSeconds: realDuration,
      remainingSeconds: 0,
    };

    // Geçmişe kaydı bir sonraki "tick"te yap → React uyarısı olmasın
    setTimeout(() => {
      addHistory({
        id: Date.now().toString(),
        mode: modeLabel,
        duration: realDuration,
        date: finishedAt,
        category: categoryLabel,
        distractions: distractionsRef.current,
        completed: true,
        elapsedSeconds: realDuration,
        remainingSeconds: 0,
      });
    }, 0);

    setSummary(summaryData);
    setSummaryVisible(true);

    // Yeni oturum için sıfırla
    setDistractions(0);
    setNeedToAskOnReturn(false);
    sessionCategoryRef.current = null;
    setSelectedCategory(null);
  };

  // ---- Kullanıcı “Hayır” dedi → tamamlanamayan seans ----
  const handleGiveUp = () => {
    const realDuration = DURATIONS[selectedMode];
    const remaining = secondsRef.current;
    const elapsed = realDuration - remaining;

    const modeLabel =
      selectedMode === "short"
        ? "Kısa"
        : selectedMode === "pomodoro"
        ? "Pomodoro"
        : "Uzun";

    const categoryLabel =
      sessionCategoryRef.current ?? selectedCategory ?? "Belirtilmedi";

    const finishedAt = new Date().toISOString();

    const summaryData: SessionSummary = {
      modeLabel,
      category: categoryLabel,
      durationSeconds: realDuration,
      distractions: distractionsRef.current,
      finishedAt,
      completed: false,
      elapsedSeconds: elapsed < 0 ? 0 : elapsed,
      remainingSeconds: remaining,
    };

    setTimeout(() => {
      addHistory({
        id: Date.now().toString(),
        mode: modeLabel,
        duration: realDuration,
        date: finishedAt,
        category: categoryLabel,
        distractions: distractionsRef.current,
        completed: false,
        elapsedSeconds: elapsed < 0 ? 0 : elapsed,
        remainingSeconds: remaining,
      });
    }, 0);

    setSummary(summaryData);
    setSummaryVisible(true);

    setRunning(false);
    setSeconds(DURATIONS[selectedMode]);
    setDistractions(0);
    setNeedToAskOnReturn(false);
    sessionCategoryRef.current = null;
    setSelectedCategory(null);
  };

  // ---- Başlat → önce kategori seçtir ----
  const startWithCategory = () => {
    setCategoryModalVisible(true);
  };

  const chooseCategory = (cat: string) => {
    // Seans kategorisi artık sabit
    sessionCategoryRef.current = cat;
    setSelectedCategory(cat);
    setCategoryModalVisible(false);
    setRunning(true);
    setNeedToAskOnReturn(false);
  };

  const pause = () => {
    setRunning(false);
    setNeedToAskOnReturn(false);
  };

  const reset = () => {
    setRunning(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(DURATIONS[selectedMode]);
    setDistractions(0);
    setNeedToAskOnReturn(false);
    sessionCategoryRef.current = null;
    setSelectedCategory(null);
  };

  // ---- Format helpers ----
  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r
      .toString()
      .padStart(2, "0")}`;
  };

  const formatHumanDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} saniyelik`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (s === 0) return `${m} dakikalık`;
    return `${m} dakika ${s} saniyelik`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} saniye`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (s === 0) return `${m} dakika`;
    return `${m} dakika ${s} saniye`;
  };

  const ModeButton = ({
    label,
    mode,
  }: {
    label: string;
    mode: "short" | "pomodoro" | "long";
  }) => (
    <TouchableOpacity
      onPress={() => setSelectedMode(mode)}
      style={[
        styles.modeButton,
        selectedMode === mode
          ? styles.modeButtonActive
          : styles.modeButtonInactive,
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

  const currentCategoryLabel =
    selectedCategory ?? sessionCategoryRef.current ?? "Henüz seçilmedi";

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
        Seçilen kategori: {currentCategoryLabel}
      </Text>
      <Text style={styles.infoText}>
        Dikkat Dağınıklığı: {distractions}
      </Text>

      <View style={styles.buttons}>
        {!running ? (
          <Button title="Başlat" onPress={startWithCategory} />
        ) : (
          <Button title="Duraklat" onPress={pause} />
        )}
        <Button title="Sıfırla" onPress={reset} />
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

      {/* Seans Özeti Modalı */}
      <Modal visible={summaryVisible} transparent animationType="fade">
        <View style={styles.summaryOverlay}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Seans Özeti</Text>

            {summary && (
              <>
                <Text style={styles.summaryText}>
                  {formatHumanDuration(summary.durationSeconds)} "
                  {summary.category}" oturumu{" "}
                  {summary.completed ? "tamamlandı." : "tamamlanamadı."}
                </Text>
                <Text style={styles.summaryText}>
                  Mod: {summary.modeLabel}
                </Text>
                <Text style={styles.summaryText}>
                  Hedef Süre: {formatDuration(summary.durationSeconds)}
                </Text>
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
                  Bitiş Zamanı:{" "}
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
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  modeContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  modeButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modeButtonActive: { backgroundColor: "#4287f5" },
  modeButtonInactive: { backgroundColor: "#e4e4e4" },
  modeTextActive: { color: "white", fontWeight: "600" },
  modeTextInactive: { color: "#333", fontWeight: "500" },

  time: { fontSize: 58, fontWeight: "bold", marginBottom: 10 },

  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },

  buttons: { flexDirection: "row", gap: 16, marginTop: 16 },

  // Kategori modalı
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  categoryText: {
    fontSize: 18,
    textAlign: "center",
  },

  // Seans özeti modalı
  summaryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryBox: {
    backgroundColor: "white",
    width: "85%",
    borderRadius: 16,
    padding: 22,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 6,
  },
  summaryButton: {
    marginTop: 14,
    backgroundColor: "#4287f5",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  summaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
