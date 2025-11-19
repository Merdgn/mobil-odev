import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';

const DEFAULT_MINUTES = 25;
const DEFAULT_SECONDS = DEFAULT_MINUTES * 60;

export default function TimerScreen() {
  const [seconds, setSeconds] = useState<number>(DEFAULT_SECONDS);
  const [running, setRunning] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);  // <<< DÜZELTİLDİ

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current !== null) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setRunning(false);
            Alert.alert("Süre Doldu!", "Pomodoro tamamlandı.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number; // <<< Expo için zorunlu cast
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setSeconds(DEFAULT_SECONDS);
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pomodoro</Text>
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, opacity: 0.7, marginBottom: 10 },
  time: { fontSize: 60, fontWeight: 'bold', marginVertical: 20 },
  buttons: { flexDirection: 'row', gap: 10 }
});
