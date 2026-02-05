import { View, Text, FlatList, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';

interface LiveWorkerUI {
  id: string;
  full_name: string;
  email: string;
  started_at: string;
}

const MOCK_LIVE_WORKERS: LiveWorkerUI[] = [
  {
    id: '1',
    full_name: 'Abu Rahman',
    email: 'abu@gmail.com',
    started_at: '10:15 AM',
  },
  {
    id: '2',
    full_name: 'Mahesh Kumar',
    email: 'mahesh@gmail.com',
    started_at: '10:42 AM',
  },
];

export default function LiveWorkersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Live Workers</Text>

      <FlatList
        data={MOCK_LIVE_WORKERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No workers are live right now</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <User size={20} color="#3DA2CE" />
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.email}>{item.email}</Text>

              <View style={styles.statusRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
                <Text style={styles.timer}>• Since {item.started_at}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },

  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2C2C2C',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2C2C',
  },

  email: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },

  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },

  timer: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9CA3AF',
  },
});
