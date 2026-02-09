import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, X, Car, Phone, Hash, DollarSign, Clock } from 'lucide-react-native';

import api from '@/src/api/api';

interface Worker {
  id: string;
  cleaner_id: string;
  full_name: string;
  email: string;
  status: 'working' | 'idle';
  current_task_id?: string;
  owner_name?: string;
  owner_phone?: string;
  car_number?: string;
  car_model?: string;
  car_type?: string;
  car_color?: string;
  task_amount?: number;
  task_started_at?: string;
}

export default function LiveWorkersScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/supervisor/workers');

      if (res.data.success) {
        setWorkers(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load workers');
      }
    } catch (err) {
      console.error('Failed to load workers', err);
      setError('Failed to load workers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleWorkerPress = (worker: Worker) => {
    setSelectedWorker(worker);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3DA2CE" />
        <Text style={styles.loadingText}>Loading workers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Worker Status</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadWorkers}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No workers assigned to you</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => handleWorkerPress(item)}>
            <View style={styles.avatar}>
              <User size={20} color="#3DA2CE" />
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.email}>{item.email}</Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: item.status === 'working' ? '#16A34A' : '#9CA3AF' },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: item.status === 'working' ? '#16A34A' : '#6B7280' },
                  ]}
                >
                  {item.status === 'working' ? 'WORKING' : 'IDLE'}
                </Text>
                {item.status === 'working' && item.task_started_at && (
                  <Text style={styles.timer}>• Since {formatTime(item.task_started_at)}</Text>
                )}
              </View>
            </View>

            {item.status === 'working' && (
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>View Task</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Worker Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.workerProfile}>
                <View style={styles.largeAvatar}>
                  <User size={30} color="#3DA2CE" />
                </View>
                <Text style={styles.profileName}>{selectedWorker?.full_name}</Text>
                <Text style={styles.profileEmail}>{selectedWorker?.email}</Text>
                <View
                  style={[
                    styles.profileStatusBadge,
                    {
                      backgroundColor: selectedWorker?.status === 'working' ? '#DCFCE7' : '#F3F4F6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.profileStatusText,
                      { color: selectedWorker?.status === 'working' ? '#16A34A' : '#6B7280' },
                    ]}
                  >
                    {selectedWorker?.status === 'working' ? 'Currently Working' : 'Currently Idle'}
                  </Text>
                </View>
              </View>

              {selectedWorker?.status === 'working' ? (
                <View style={styles.taskSection}>
                  <Text style={styles.sectionHeading}>Current Task Info</Text>

                  <DetailRow
                    icon={<Car size={18} color="#3DA2CE" />}
                    label="Vehicle"
                    value={`${selectedWorker.car_number} (${selectedWorker.car_model})`}
                  />
                  <DetailRow
                    icon={<Hash size={18} color="#3DA2CE" />}
                    label="Type"
                    value={selectedWorker.car_type || 'N/A'}
                  />
                  <DetailRow
                    icon={<User size={18} color="#3DA2CE" />}
                    label="Owner"
                    value={selectedWorker.owner_name || 'N/A'}
                  />
                  <DetailRow
                    icon={<Phone size={18} color="#3DA2CE" />}
                    label="Phone"
                    value={selectedWorker.owner_phone || 'N/A'}
                  />
                  <DetailRow
                    icon={<DollarSign size={18} color="#3DA2CE" />}
                    label="Amount"
                    value={`₹${selectedWorker.task_amount}`}
                  />
                  <DetailRow
                    icon={<Clock size={18} color="#3DA2CE" />}
                    label="Started At"
                    value={formatTime(selectedWorker.task_started_at!)}
                  />
                </View>
              ) : (
                <View style={styles.emptyTaskSection}>
                  <Clock size={40} color="#9CA3AF" style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyTaskText}>No active task at the moment</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
  },
  refreshText: {
    color: '#3DA2CE',
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timer: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  taskBadge: {
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taskBadgeText: {
    fontSize: 10,
    color: '#3DA2CE',
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  modalBody: {
    padding: 20,
  },
  workerProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  profileStatusBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  detailIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  emptyTaskSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTaskText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
