import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Car, X } from 'lucide-react-native';

import api from '@/src/api/api';

interface Worker {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'idle' | 'working';
  current_task_id?: string;
  owner_name?: string;
  owner_phone?: string;
  car_number?: string;
  car_model?: string;
  car_type?: string;
  car_color?: string;
  task_amount?: string;
  task_started_at?: string;
}

export default function AddTasksScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    owner_name: '',
    owner_phone: '',
    car_number: '',
    car_model: '',
    car_type: '',
    car_color: '',
    task_amount: '',
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const res = await api.get('/api/supervisor/workers');

      if (res.data.success) {
        setWorkers(res.data.data);
      } else {
        console.error('Failed to load workers', res.data.message);
      }
    } catch (err) {
      console.error('Failed to load workers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (worker: Worker, modifyExisting: boolean = false) => {
    setSelectedWorker(worker);
    setIsUpdating(modifyExisting);

    if (modifyExisting) {
      setFormData({
        owner_name: worker.owner_name || '',
        owner_phone: worker.owner_phone || '',
        car_number: worker.car_number || '',
        car_model: worker.car_model || '',
        car_type: worker.car_type || '',
        car_color: worker.car_color || '',
        task_amount: worker.task_amount?.toString() || '',
      });
    } else {
      setFormData({
        owner_name: '',
        owner_phone: '',
        car_number: '',
        car_model: '',
        car_type: '',
        car_color: '',
        task_amount: '',
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedWorker) return;

    if (!formData.car_number || !formData.car_model || !formData.car_type) {
      Alert.alert('Error', 'Please fill in car details');
      return;
    }

    setSubmitting(true);
    try {
      if (isUpdating) {
        await api.patch(`/api/supervisor/tasks/${selectedWorker.current_task_id}`, formData);
        Alert.alert('Success', 'Task updated successfully');
      } else {
        await api.post('/api/supervisor/tasks', {
          ...formData,
          worker_id: selectedWorker.id,
        });
        Alert.alert('Success', 'Task assigned successfully');
      }
      setModalVisible(false);
      loadWorkers(); // Refresh list
    } catch (err) {
      console.error('Submit error', err);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3DA2CE" />
        <Text style={styles.loadingText}>Loading workers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assign or Update Tasks</Text>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No workers assigned to you</Text>}
        onRefresh={loadWorkers}
        refreshing={loading}
        renderItem={({ item }) => (
          <View style={styles.workerCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarContainer}>
                <User size={24} color="#3DA2CE" />
              </View>
              <View style={styles.workerBasicInfo}>
                <Text style={styles.workerName}>{item.full_name}</Text>
                <View style={styles.statusBadgeContainer}>
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
                    {item.status === 'working' ? 'Working' : 'Idle'}
                  </Text>
                  {item.status === 'working' && item.task_started_at && (
                    <Text style={styles.statusTime}>
                      {' '}
                      • Since{' '}
                      {new Date(item.task_started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {item.status === 'working' && (
              <View style={styles.taskInfoContainer}>
                <View style={styles.taskDetailHeader}>
                  <Car size={16} color="#3DA2CE" />
                  <Text style={styles.taskDetailTitle}>Current Task Details</Text>
                </View>

                <View style={styles.taskGrid}>
                  <View style={styles.taskGridItem}>
                    <Text style={styles.taskLabel}>Car</Text>
                    <Text style={styles.taskValue}>{item.car_model}</Text>
                    <Text style={styles.taskSubValue}>{item.car_number}</Text>
                  </View>
                  <View style={styles.taskGridItem}>
                    <Text style={styles.taskLabel}>Owner</Text>
                    <Text style={styles.taskValue}>{item.owner_name || 'N/A'}</Text>
                    <Text style={styles.taskSubValue}>{item.owner_phone || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.taskFooter}>
                  <View style={styles.taskBadge}>
                    <Text style={styles.taskBadgeText}>{item.car_type}</Text>
                  </View>
                  {item.car_color && (
                    <View style={[styles.taskBadge, { backgroundColor: '#F3F4F6' }]}>
                      <Text style={[styles.taskBadgeText, { color: '#4B5563' }]}>
                        {item.car_color}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.cardActions}>
              {item.status === 'idle' ? (
                <Pressable style={styles.assignButton} onPress={() => handleOpenModal(item, false)}>
                  <Text style={styles.assignButtonText}>Assign Task</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.updateButton} onPress={() => handleOpenModal(item, true)}>
                  <Text style={styles.updateButtonText}>Update Task</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />

      {/* TASK MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isUpdating ? 'Update Task' : 'Assign New Task'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={24} color="#2C2C2C" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
              <Text style={styles.inputLabel}>Owner Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: John Doe"
                value={formData.owner_name}
                onChangeText={(text) => setFormData({ ...formData, owner_name: text })}
              />

              <Text style={styles.inputLabel}>Owner Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 9876543210"
                keyboardType="phone-pad"
                value={formData.owner_phone}
                onChangeText={(text) => setFormData({ ...formData, owner_phone: text })}
              />

              <Text style={styles.inputLabel}>Car Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: KA 01 AB 1234"
                autoCapitalize="characters"
                value={formData.car_number}
                onChangeText={(text) => setFormData({ ...formData, car_number: text })}
              />

              <Text style={styles.inputLabel}>Car Model</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Honda City"
                value={formData.car_model}
                onChangeText={(text) => setFormData({ ...formData, car_model: text })}
              />

              <Text style={styles.inputLabel}>Car Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Sedan / SUV"
                value={formData.car_type}
                onChangeText={(text) => setFormData({ ...formData, car_type: text })}
              />

              <Text style={styles.inputLabel}>Car Color</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: White"
                value={formData.car_color}
                onChangeText={(text) => setFormData({ ...formData, car_color: text })}
              />

              <Text style={styles.inputLabel}>Task Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 500"
                keyboardType="numeric"
                value={formData.task_amount}
                onChangeText={(text) => setFormData({ ...formData, task_amount: text })}
              />

              <View style={{ height: 40 }} />
            </ScrollView>

            <Pressable
              style={[styles.submitButton, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isUpdating ? 'Update Task' : 'Assign Task'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
    color: '#9CA3AF',
  },
  workerCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  workerBasicInfo: {
    flex: 1,
  },
  workerName: {
    fontWeight: '700',
    fontSize: 17,
    color: '#1F2937',
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskInfoContainer: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3DA2CE',
  },
  taskDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  taskDetailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3DA2CE',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskGridItem: {
    flex: 1,
  },
  taskLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 2,
  },
  taskValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  taskSubValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  taskBadge: {
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3DA2CE',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#3DA2CE',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3DA2CE',
  },
  updateButtonText: {
    color: '#3DA2CE',
    fontWeight: '700',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#3DA2CE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3DA2CE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
