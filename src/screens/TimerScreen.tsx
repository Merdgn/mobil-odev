import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHistoryContext } from "../context/HistoryContext";

// 🔥 DEMO MODU
const DEMO_MODE = true;

const DURATIONS = {
  short: DEMO_MODE ? 15 : 15 * 60,
  pomodoro: DEMO_MODE ? 25 : 25 * 60,
  long: DEMO_MODE ? 50 : 50 * 60,
};

type SummaryData = {
  modeLabel: string;
  category: string;
  durationSeconds: number;
  finishedAt: Date;
};

export default function TimerScreen() {
  const [selectedMode, setSelectedMode] =
    useState<'short' | 'pomodoro' | 'long'>('pomodoro');
  const [seconds, setSeconds] = useState<number>(DURATIONS.pomodoro);
  const [running, setRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const { addHistory } = useHistoryContext();
  const navigation = useNavigation<any>();

  // Mod değişince süre değişir
  useEffect(() => {
    setRunning(false);
    setSeconds(DURATIONS[selectedMode]);

    if (intervalRef.current !== null) clearInterval(intervalRef.current);
  }, [selectedMode]);

  // Sayaç
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setRunning(false);

            const realDuration = DURATIONS[selectedMode];
            const modeLabel =
              selectedMode === "short"
                ? "Kısa"
                : selectedMode === "pomodoro"
                ? "Pomodoro"
                : "Uzun";
            const category = selectedCategory ?? "Belirtilmedi";
            const finishedAt = new Date();

            // 🟢 Özet verisini state’e koy (modal için)
            setSummaryData({
              modeLabel,
              category,
              durationSeconds: realDuration,
              finishedAt,
            });
            setSummaryVisible(true);

            // 🟢 Geçmiş kaydı — setState çatışmasını önlemek için timeout
            setTimeout(() => {
              addHistory({
                id: Date.now().toString(),
                mode: modeLabel,
                duration: realDuration,
                date: finishedAt.toISOString(),
                category,
              });
            }, 0);

            return 0;
          }

          return prev - 1;
        });
      }, 1000) as unknown as number;
    }

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [running, selectedMode, selectedCategory]);

  // ⏳ Başlat → önce kategori seçme modali
  const startWithCategory = () => {
    setCategoryModalVisible(true);
  };

  // Kategori seçme → sayaç başlar
  const chooseCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCategoryModalVisible(false);
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    setSeconds(DURATIONS[selectedMode]);
  };

  const formatClock = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
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
    mode: 'short' | 'pomodoro' | 'long';
  }) => (
    <TouchableOpacity
      onPress={() => setSelectedMode(mode)}
      style={[
        styles.modeButton,
        selectedMode === mode ? styles.modeButtonActive : styles.modeButtonInactive,
      ]}
    >
      <Text style={selectedMode === mode ? styles.modeTextActive : styles.modeTextInactive}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const closeSummary = () => {
    setSummaryVisible(false);
  };

  const goToReports = () => {
    setSummaryVisible(false);
    navigation.navigate("Raporlar");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odak Modu</Text>

      {/* Mod Seçici */}
      <View style={styles.modeContainer}>
        <ModeButton label="Kısa" mode="short" />
        <ModeButton label="Pomodoro" mode="pomodoro" />
        <ModeButton label="Uzun" mode="long" />
      </View>

      {/* Sayaç */}
      <Text style={styles.time}>{formatClock(seconds)}</Text>

      <View style={styles.buttons}>
        {!running ? (
          <Button title="Başlat" onPress={startWithCategory} />
        ) : (
          <Button title="Duraklat" onPress={pause} />
        )}
        <Button title="Sıfırla" onPress={reset} />
      </View>

      {/* 🟣 Kategori Modalı */}
      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
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

      {/* 🟡 Oturum Özeti Modalı */}
      <Modal visible={summaryVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Oturum Özeti</Text>

            {summaryData && (
              <>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Mod: </Text>
                  {summaryData.modeLabel}
                </Text>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Kategori: </Text>
                  {summaryData.category}
                </Text>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Süre: </Text>
                  {formatDuration(summaryData.durationSeconds)}
                </Text>
                <Text style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Bitiş: </Text>
                  {summaryData.finishedAt.toLocaleTimeString()}
                </Text>
              </>
            )}

            <View style={styles.summaryButtons}>
              <TouchableOpacity style={styles.summaryBtnSecondary} onPress={closeSummary}>
                <Text style={styles.summaryBtnTextSecondary}>Tamam</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.summaryBtnPrimary} onPress={goToReports}>
                <Text style={styles.summaryBtnTextPrimary}>Raporları Gör</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  modeContainer: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  modeButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modeButtonActive: { backgroundColor: '#4287f5' },
  modeButtonInactive: { backgroundColor: '#e4e4e4' },
  modeTextActive: { color: 'white', fontWeight: '600' },
  modeTextInactive: { color: '#333', fontWeight: '500' },
  time: { fontSize: 58, fontWeight: 'bold', marginBottom: 30 },
  buttons: { flexDirection: 'row', gap: 16 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  categoryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryText: {
    fontSize: 18,
    textAlign: 'center',
  },

  // Özet kartı
  summaryBox: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryLine: {
    fontSize: 16,
    marginBottom: 6,
  },
  summaryLabel: {
    fontWeight: '700',
  },
  summaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  summaryBtnSecondary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    alignItems: 'center',
  },
  summaryBtnPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4287f5',
    marginLeft: 8,
    alignItems: 'center',
  },
  summaryBtnTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryBtnTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
