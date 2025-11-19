import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';

const DURATIONS = {
  short: 15 * 60,
  pomodoro: 25 * 60,
  long: 50 * 60,
};

export default function TimerScreen() {
  const [selectedMode, setSelectedMode] = useState<'short' | 'pomodoro' | 'long'>('pomodoro');
  const [seconds, setSeconds] = useState<number>(DURATIONS.pomodoro);
  const [running, setRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  // Süre seçildiğinde sayaç sıfırlansın
  useEffect(() => {
    setRunning(false);
    setSeconds(DURATIONS[selectedMode]);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
  }, [selectedMode]);

  // Geri sayım
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setRunning(false);
            Alert.alert("Süre Bitti!", `${format(DURATIONS[selectedMode])} tamamlandı.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    }

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    setSeconds(DURATIONS[selectedMode]);
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
  };

  const ModeButton = ({ label, mode }: { label: string; mode: 'short' | 'pomodoro' | 'long' }) => (
    <TouchableOpacity
      onPress={() => setSelectedMode(mode)}
      style={[
        styles.modeButton,
        selectedMode === mode ? styles.modeButtonActive : styles.modeButtonInactive
      ]}
    >
      <Text style={selectedMode === mode ? styles.modeTextActive : styles.modeTextInactive}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odak Modu</Text>

      {/* MOD SEÇİCİ */}
      <View style={styles.modeContainer}>
        <ModeButton label="Kısa" mode="short" />
        <ModeButton label="Pomodoro" mode="pomodoro" />
        <ModeButton label="Uzun" mode="long" />
      </View>

      {/* SAYAC */}
      <Text style={styles.time}>{format(seconds)}</Text>

      <View style={styles.buttons}>
        {!running ? (
          <Button title="Başlat" onPress={start} />
        ) : (
          <Button title="Duraklat" onPress={pause} />
        )}
        <Button title="Sıfırla" onPress={reset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  
  modeContainer: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  modeButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modeButtonActive: { backgroundColor: '#4287f5' },
  modeButtonInactive: { backgroundColor: '#e4e4e4' },
  modeTextActive: { color: 'white', fontWeight: '600' },
  modeTextInactive: { color: '#333', fontWeight: '500' },

  time: { fontSize: 58, fontWeight: 'bold', marginBottom: 30 },

  buttons: { flexDirection: 'row', gap: 16 },
});
