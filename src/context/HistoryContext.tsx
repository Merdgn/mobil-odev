import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FocusHistoryItem = {
  id: string;
  mode: string;
  duration: number; // saniye
  date: string;
  category: string; // 🆕 EKLENDİ
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

  // İlk yükleme
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // 🛠 Eski kayıtlarda category yoksa "Belirtilmedi" ekle
        const fixed = parsed.map((item: any) => ({
          ...item,
          category: item.category ?? "Belirtilmedi",
        }));

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
