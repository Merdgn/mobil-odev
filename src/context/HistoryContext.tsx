import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FocusHistoryItem = {
  id: string;
  mode: string;             // "Kısa", "Pomodoro", "Uzun"
  duration: number;         // hedef süre (saniye)
  date: string;             // ISO tarih
  category: string;         // kategori adı
  distractions: number;     // dikkat dağınıklığı sayısı
  completed: boolean;       // true = tamamlandı, false = yarım kaldı
  elapsedSeconds: number;   // geçen süre
  remainingSeconds: number; // kalan süre
};

const STORAGE_KEY = "FOCUS_HISTORY";

type HistoryContextType = {
  history: FocusHistoryItem[];
  addHistory: (item: FocusHistoryItem) => void;
  clearHistory: () => void;
};

const HistoryContext = createContext<HistoryContextType | null>(null);

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [history, setHistory] = useState<FocusHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Eski kayıtları yeni alanlarla uyumlu hâle getir
        const fixed: FocusHistoryItem[] = parsed.map((item: any) => {
          const duration = Number(item.duration ?? 0);
          const completed =
            typeof item.completed === "boolean" ? item.completed : true;
          const elapsed = Number(
            item.elapsedSeconds ?? (completed ? duration : 0)
          );
          const remaining = Number(
            item.remainingSeconds ?? (completed ? 0 : duration - elapsed)
          );

          return {
            id: String(item.id),
            mode: item.mode ?? "Bilinmiyor",
            duration,
            date: item.date ?? new Date().toISOString(),
            category: item.category ?? "Belirtilmedi",
            distractions:
              typeof item.distractions === "number" ? item.distractions : 0,
            completed,
            elapsedSeconds: elapsed,
            remainingSeconds: remaining < 0 ? 0 : remaining,
          };
        });

        setHistory(fixed);
      }
    } catch (error) {
      console.log("Geçmiş yüklenemedi:", error);
    }
  }

  function addHistory(item: FocusHistoryItem) {
    setHistory((prev) => {
      const updated = [item, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function clearHistory() {
    AsyncStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }

  return (
    <HistoryContext.Provider value={{ history, addHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistoryContext = () => useContext(HistoryContext)!;
