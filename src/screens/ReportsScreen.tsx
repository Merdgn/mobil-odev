import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useHistoryContext, FocusHistoryItem } from "../context/HistoryContext";
import { useThemeContext } from "../context/ThemeContext";
import { BarChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

type TabKey = "dashboard" | "done" | "undone";

export default function ReportsScreen() {
  const { history, clearHistory } = useHistoryContext();
  const { isDark } = useThemeContext();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  const completed = useMemo(
    () =>
      history
        .filter((h) => h.completed)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [history]
  );

  const incomplete = useMemo(
    () =>
      history
        .filter((h) => !h.completed)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [history]
  );

  // ------- Genel istatistikler -------
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let todaySeconds = 0;
  let allSeconds = 0;
  let totalDistractions = 0;

  const last7DaysMap: Record<string, number> = {};
  const categoriesMap: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7DaysMap[key] = 0;
  }

  history.forEach((item) => {
    const dayKey = item.date.slice(0, 10);
    const focusTime = item.elapsedSeconds || (item.completed ? item.duration : 0);

    allSeconds += focusTime;
    totalDistractions += item.distractions;

    if (dayKey === todayKey) {
      todaySeconds += focusTime;
    }

    if (dayKey in last7DaysMap) {
      last7DaysMap[dayKey] += focusTime;
    }

    const catKey = item.category || "Belirtilmedi";
    categoriesMap[catKey] = (categoriesMap[catKey] || 0) + focusTime;
  });

  const last7DaysLabels = Object.keys(last7DaysMap).map((key) => {
    const d = new Date(key);
    return `${d.getDate()} ${["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"][d.getMonth()]
      }`;
  });

  const last7DaysData = Object.values(last7DaysMap).map((sec) =>
    Number((sec / 60).toFixed(2))
  );

  const categoriesPie = Object.keys(categoriesMap).map((cat, index) => {
    const sec = categoriesMap[cat];
    const total = allSeconds === 0 ? 1 : allSeconds;
    const ratio = sec / total;

    const colors = ["#3b82f6", "#ec4899", "#22c55e", "#f97316", "#a855f7", "#14b8a6"];
    return {
      name: cat,
      population: Number(ratio.toFixed(2)),
      color: colors[index % colors.length],
      legendFontColor: isDark ? "#f9fafb" : "#111827",
      legendFontSize: 13,
    };
  });

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "0 sn";
    if (seconds < 60) return `${seconds} sn`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (s === 0) return `${m} dk`;
    return `${m} dk ${s} sn`;
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const palette = isDark
    ? {
        screenBg: "#050816",
        cardBg: "#050a17",
        sectionCardBg: "#060b1c",
        mainText: "#f9fafb",
        secondaryText: "#cbd5f5",
        pillBg: "#1f2937",
        pillActiveBg: "#2563eb",
        pillText: "#e5e7eb",
        pillTextActive: "#ffffff",
        danger: "#dc2626",
        doneCardBg: "#0b1728",
        undoneCardBg: "#1f2937",
      }
    : {
        screenBg: "#f3f4ff",
        cardBg: "#ffffff",
        sectionCardBg: "#f3f4ff",
        mainText: "#111827",
        secondaryText: "#4b5563",
        pillBg: "#e5e7eb",
        pillActiveBg: "#2563eb",
        pillText: "#374151",
        pillTextActive: "#ffffff",
        danger: "#b91c1c",
        doneCardBg: "#e5f2ff",
        undoneCardBg: "#ffe4e6",
      };

  const chartConfig = {
    backgroundColor: palette.sectionCardBg,
    backgroundGradientFrom: palette.sectionCardBg,
    backgroundGradientTo: palette.sectionCardBg,
    decimalPlaces: 1,
    color: (opacity: number = 1) =>
      `rgba(${isDark ? "248, 250, 252" : "15, 23, 42"}, ${opacity})`,
    labelColor: () => (isDark ? "#e5e7eb" : "#4b5563"),
  };

  const renderCompletedItem = ({ item }: { item: FocusHistoryItem }) => (
    <View
      style={[
        styles.sessionCard,
        { backgroundColor: palette.doneCardBg },
      ]}
    >
      <Text style={[styles.sessionMode, { color: palette.mainText }]}>
        {item.mode} ✓
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        📂 Kategori: {item.category}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        ⏱ Süre: {formatDuration(item.duration)}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        🎯 Dikkat: {item.distractions}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        📅 {formatDateTime(item.date)}
      </Text>
    </View>
  );

  const renderIncompleteItem = ({ item }: { item: FocusHistoryItem }) => (
    <View
      style={[
        styles.sessionCard,
        { backgroundColor: palette.undoneCardBg },
      ]}
    >
      <Text style={[styles.sessionMode, { color: palette.mainText }]}>
        {item.mode} ⚠
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        📂 Kategori: {item.category}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        ⏱ Hedef: {formatDuration(item.duration)}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        ▶ Geçen: {formatDuration(item.elapsedSeconds)}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        ⏸ Kalan: {formatDuration(item.remainingSeconds)}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        🎯 Dikkat: {item.distractions}
      </Text>
      <Text style={[styles.sessionText, { color: palette.secondaryText }]}>
        📅 {formatDateTime(item.date)}
      </Text>
    </View>
  );

  const currentList =
    activeTab === "done" ? completed : incomplete;

  // ---------- RENDER ----------
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.screenBg },
      ]}
    >
      {/* Üst sekmeler */}
      <View style={styles.tabRow}>
        {[
          { text: "Dashboard", tab: "dashboard" as TabKey },
          { text: "Tamamlananlar", tab: "done" as TabKey },
          { text: "Yarım Kalanlar", tab: "undone" as TabKey },
        ].map(({ text, tab }) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                {
                  backgroundColor: active
                    ? palette.pillActiveBg
                    : "transparent",
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={{
                  color: active ? palette.pillTextActive : palette.pillText,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === "dashboard" ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Genel İstatistikler */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.cardBg },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.mainText }]}>
              📌 Genel İstatistikler
            </Text>
            <Text style={[styles.cardLine, { color: palette.secondaryText }]}>
              ⭐ Bugün: {formatDuration(todaySeconds)}
            </Text>
            <Text style={[styles.cardLine, { color: palette.secondaryText }]}>
              🕒 Tüm Zamanlar: {formatDuration(allSeconds)}
            </Text>
            <Text style={[styles.cardLine, { color: palette.secondaryText }]}>
              🎯 Toplam Dikkat Dağınıklığı: {totalDistractions}
            </Text>
          </View>

          {/* Son 7 Gün Bar Chart */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.cardBg },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.mainText }]}>
              📅 Son 7 Gün Odak Süreleri
            </Text>
            <BarChart
              data={{
                labels: last7DaysLabels,
                datasets: [{ data: last7DaysData }],
              }}
              width={screenWidth - 32}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" dk"
              chartConfig={chartConfig}
              style={{ marginTop: 8, borderRadius: 16 }}
              fromZero
            />
          </View>

          {/* Kategorilere Göre Pie Chart */}
          <View
            style={[
              styles.card,
              { backgroundColor: palette.cardBg },
            ]}
          >
            <Text style={[styles.cardTitle, { color: palette.mainText }]}>
              🥧 Kategorilere Göre Dağılım
            </Text>

            {categoriesPie.length === 0 ? (
              <Text
                style={[
                  styles.cardLine,
                  { color: palette.secondaryText },
                ]}
              >
                Henüz kayıt yok.
              </Text>
            ) : (
              <PieChart
                data={categoriesPie}
                width={screenWidth - 32}
                height={220}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                chartConfig={chartConfig}
                absolute={false}
              />
            )}
          </View>
        </ScrollView>
      ) : (
        <>
          {currentList.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                { color: palette.secondaryText },
              ]}
            >
              Bu sekmede henüz kayıt yok.
            </Text>
          ) : (
            <FlatList
              data={currentList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={
                activeTab === "done"
                  ? renderCompletedItem
                  : renderIncompleteItem
              }
            />
          )}
        </>
      )}

      {history.length > 0 && (
        <TouchableOpacity
          style={[
            styles.clearButton,
            { backgroundColor: palette.danger },
          ]}
          onPress={clearHistory}
        >
          <Text style={styles.clearText}>Tüm Geçmişi Temizle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb33",
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    paddingVertical: 8,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardLine: {
    fontSize: 14,
    marginBottom: 3,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
  },
  sessionCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  sessionMode: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sessionText: {
    fontSize: 13,
    marginBottom: 2,
  },
  clearButton: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  clearText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
