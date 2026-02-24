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
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  X,
  Car,
  Phone,
  Hash,
  DollarSign,
  Clock,
  Camera,
  ChevronDown,
  MapPin,
  ImageIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

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
  task_amount?: string;
  task_started_at?: string;
  car_image_url?: string;
  car_location?: string;
}

export default function LiveWorkersScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Task Form States
  const [isUpdating, setIsUpdating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [carTypes, setCarTypes] = useState<{ id: string; type: string }[]>([]);
  const [formData, setFormData] = useState({
    owner_name: '',
    owner_phone: '',
    car_number: '',
    car_model: '',
    car_type: '',
    car_color: '',
    task_amount: '',
    car_image_url: '',
    car_location: '',
  });

  useEffect(() => {
    loadWorkers();
    fetchCarTypes();
  }, []);

  const fetchCarTypes = async () => {
    try {
      const res = await api.get('/api/vehicle');
      setCarTypes(res.data || []);
    } catch (err) {
      console.error('Failed to fetch car types', err);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery permissions to upload a car photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a car photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      setUploadingImage(true);
      const presignRes = await api.post('/s3/presign', {
        fileType: 'image/jpeg',
        folder: 'tasks',
      });
      const { uploadUrl, fileUrl } = presignRes.data;

      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload image');

      setFormData({ ...formData, car_image_url: fileUrl });
      Alert.alert('Success', 'Car photo uploaded successfully');
    } catch (error) {
      console.error('Image upload error', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Car Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
      loadWorkers();
    } catch (err) {
      console.error('Submit error', err);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

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
    const modifyExisting = worker.status === 'working';
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
        car_image_url: worker.car_image_url || '',
        car_location: worker.car_location || '',
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
        car_image_url: '',
        car_location: '',
      });
    }
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

              {/* TASK MANAGEMENT FORM */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>
                  {isUpdating ? 'Update Task Details' : 'Assign New Task'}
                </Text>

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
                <Pressable style={styles.dropdownTrigger} onPress={() => setShowTypePicker(true)}>
                  <Text style={[styles.dropdownValue, !formData.car_type && { color: '#9CA3AF' }]}>
                    {formData.car_type || 'Select Car Type'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </Pressable>

                <Text style={styles.inputLabel}>Car Location (Optional)</Text>
                <View style={styles.inputWithIcon}>
                  <MapPin size={18} color="#9CA3AF" style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { marginBottom: 0, flex: 1, borderWidth: 0 }]}
                    placeholder="Ex: Parking Level 2, Spot B12"
                    value={formData.car_location}
                    onChangeText={(text) => setFormData({ ...formData, car_location: text })}
                  />
                </View>

                <Text style={styles.inputLabel}>Car Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: White"
                  value={formData.car_color}
                  onChangeText={(text) => setFormData({ ...formData, car_color: text })}
                />

                <Text style={styles.inputLabel}>Car Photo</Text>
                <Pressable style={styles.photoUploadButton} onPress={showImageOptions}>
                  {uploadingImage ? (
                    <ActivityIndicator color="#3DA2CE" />
                  ) : formData.car_image_url ? (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: formData.car_image_url }} style={styles.photoPreview} />
                      <View style={styles.photoOverlay}>
                        <Camera size={20} color="#FFF" />
                        <Text style={styles.photoOverlayText}>Change Photo</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <ImageIcon size={24} color="#3DA2CE" />
                      <Text style={styles.photoUploadText}>Upload Car Photo</Text>
                    </>
                  )}
                </Pressable>

                <Text style={styles.inputLabel}>Task Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 500"
                  keyboardType="numeric"
                  value={formData.task_amount}
                  onChangeText={(text) => setFormData({ ...formData, task_amount: text })}
                />

                <TouchableOpacity
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
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CAR TYPE PICKER MODAL */}
      <Modal
        visible={showTypePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypePicker(false)}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Car Type</Text>
              <Pressable onPress={() => setShowTypePicker(false)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView>
              {carTypes.map((type) => (
                <Pressable
                  key={type.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setFormData({ ...formData, car_type: type.type });
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{type.type}</Text>
                  {formData.car_type === type.type && <View style={styles.selectedDot} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
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
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  formSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 10,
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dropdownValue: {
    fontSize: 15,
    color: '#1F2937',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  fieldIcon: {
    marginRight: 10,
  },
  photoUploadButton: {
    height: 120,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  photoUploadText: {
    marginTop: 8,
    fontSize: 13,
    color: '#3DA2CE',
    fontWeight: '600',
  },
  photoPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  photoOverlayText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3DA2CE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
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
  // Picker Styles
  pickerContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3DA2CE',
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
    paddingVertical: 20,
  },
  emptyTaskText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
