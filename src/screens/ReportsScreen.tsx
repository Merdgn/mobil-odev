import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusHistory } from '../hooks/useFocusHistory';

export default function ReportsScreen() {
  const { history, clearHistory } = useFocusHistory();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} dakika`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Geçmiş Odak Oturumları</Text>

      {history.length === 0 ? (
        <Text style={styles.empty}>Henüz kayıt yok</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.mode}>{item.mode}</Text>
              <Text style={styles.text}>⏱ Süre: {formatDuration(item.duration)}</Text>
              <Text style={styles.text}>📅 Tarih: {formatDate(item.date)}</Text>
            </View>
          )}
        />
      )}

      {history.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <Text style={styles.clearText}>Geçmişi Temizle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 20, color: "#555" },

  card: {
    backgroundColor: "#eee",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  mode: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  text: { fontSize: 16 },

  clearButton: {
    backgroundColor: "#cc0000",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  clearText: { color: "white", fontWeight: "bold" },
});
