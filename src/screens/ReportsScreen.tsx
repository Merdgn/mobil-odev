import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useHistoryContext, FocusHistoryItem } from "../context/HistoryContext";

export default function ReportsScreen() {
  const { history, clearHistory } = useHistoryContext();
  const [activeTab, setActiveTab] = useState<"done" | "undone">("done");

  const sortedCompleted = useMemo(
    () =>
      history
        .filter((h) => h.completed)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [history]
  );

  const sortedIncomplete = useMemo(
    () =>
      history
        .filter((h) => !h.completed)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [history]
  );

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} saniye`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (s === 0) return `${m} dakika`;
    return `${m} dakika ${s} saniye`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };

  const renderCompletedItem = ({ item }: { item: FocusHistoryItem }) => (
    <View style={[styles.card, styles.cardCompleted]}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.mode}>{item.mode}</Text>
        <View style={styles.badgeSuccess}>
          <Text style={styles.badgeText}>✓ Tamamlandı</Text>
        </View>
      </View>

      <Text style={styles.text}>🏷 Kategori: {item.category}</Text>
      <Text style={styles.text}>
        ⏱ Süre: {formatDuration(item.duration)}
      </Text>
      <Text style={styles.text}>
        🎯 Dikkat Dağınıklığı: {item.distractions}
      </Text>
      <Text style={styles.text}>📅 Tarih: {formatDate(item.date)}</Text>
    </View>
  );

  const renderIncompleteItem = ({ item }: { item: FocusHistoryItem }) => (
    <View style={[styles.card, styles.cardIncomplete]}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.mode}>{item.mode}</Text>
        <View style={styles.badgeDanger}>
          <Text style={styles.badgeText}>⚠ Tamamlanamadı</Text>
        </View>
      </View>

      <Text style={styles.text}>🏷 Kategori: {item.category}</Text>
      <Text style={styles.text}>
        🎯 Dikkat Dağınıklığı: {item.distractions}
      </Text>
      <Text style={styles.text}>
        ⏱ Hedef Süre: {formatDuration(item.duration)}
      </Text>
      <Text style={styles.text}>
        ▶ Geçen Süre: {formatDuration(item.elapsedSeconds)}
      </Text>
      <Text style={styles.text}>
        ⏸ Kalan Süre: {formatDuration(item.remainingSeconds)}
      </Text>
      <Text style={styles.text}>📅 Tarih: {formatDate(item.date)}</Text>
    </View>
  );

  const currentList =
    activeTab === "done" ? sortedCompleted : sortedIncomplete;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Odak Raporları</Text>

      {/* Sekmeler */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "done" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("done")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "done" && styles.tabTextActive,
            ]}
          >
            Tamamlananlar ({sortedCompleted.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "undone" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("undone")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "undone" && styles.tabTextActive,
            ]}
          >
            Tamamlanamayanlar ({sortedIncomplete.length})
          </Text>
        </TouchableOpacity>
      </View>

      {currentList.length === 0 ? (
        <Text style={styles.empty}>Bu sekmede henüz kayıt yok.</Text>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={
            activeTab === "done" ? renderCompletedItem : renderIncompleteItem
          }
        />
      )}

      {history.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <Text style={styles.clearText}>Tüm Geçmişi Temizle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },

  tabRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 999,
    backgroundColor: "#e6e6e6",
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#4287f5",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  tabTextActive: {
    color: "white",
  },

  empty: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    color: "#555",
  },

  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardCompleted: {
    backgroundColor: "#e6f2ff",
  },
  cardIncomplete: {
    backgroundColor: "#ffecec",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  mode: { fontSize: 18, fontWeight: "bold" },
  text: { fontSize: 15 },

  badgeSuccess: {
    backgroundColor: "#2e8b57",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDanger: {
    backgroundColor: "#cc0000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  clearButton: {
    backgroundColor: "#cc0000",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  clearText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
