import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type FocusHistoryItem = {
  id: string;
  mode: string;   // "Kısa", "Pomodoro", "Uzun"
  duration: number; // saniye
  date: string;   // ISO tarih
};

const STORAGE_KEY = "FOCUS_HISTORY";

export function useFocusHistory() {
  const [history, setHistory] = useState<FocusHistoryItem[]>([]);

  // Geçmişi yükle
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Geçmiş yüklenemedi:", error);
    }
  }

  // Yeni geçmiş ekle
  async function addHistory(item: FocusHistoryItem) {
    try {
      const newList = [item, ...history];
      setHistory(newList);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (error) {
      console.log("Geçmiş kaydedilemedi:", error);
    }
  }

  // Geçmişi temizle
  async function clearHistory() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (error) {
      console.log("Geçmiş silinemedi:", error);
    }
  }

  return { history, addHistory, clearHistory };
}
