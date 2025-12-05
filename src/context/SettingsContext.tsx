import React, { createContext, useContext, useState } from "react";

type SettingsContextType = {
  vibrationEnabled: boolean;
  setVibrationEnabled: (v: boolean) => void;

  dailyGoalMinutes: number;
  setDailyGoalMinutes: (n: number) => void;

  todayTotalMinutes: number;
  setTodayTotalMinutes: (n: number) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  vibrationEnabled: true,
  setVibrationEnabled: () => {},

  dailyGoalMinutes: 60,
  setDailyGoalMinutes: () => {},

  todayTotalMinutes: 0,
  setTodayTotalMinutes: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(60);

  // 🔥 Günlük toplam süre — Progress bar için
  const [todayTotalMinutes, setTodayTotalMinutes] = useState(0);

  return (
    <SettingsContext.Provider
      value={{
        vibrationEnabled,
        setVibrationEnabled,

        dailyGoalMinutes,
        setDailyGoalMinutes,

        todayTotalMinutes,
        setTodayTotalMinutes,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => useContext(SettingsContext);
