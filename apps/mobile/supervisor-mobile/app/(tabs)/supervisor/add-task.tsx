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
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Car, X, Camera, MapPin, ArrowLeft, Phone, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import api from '@/src/api/api';

// Topographic Pattern for Headers
const TopoPattern = ({ color = 'rgba(14, 165, 233, 0.08)' }: { color?: string }) => (
  <Svg
    height="100%"
    width="100%"
    style={StyleSheet.absoluteFillObject}
    viewBox="0 0 400 400"
    preserveAspectRatio="xMidYMid slice"
  >
    <Path
      d="M 0 80 Q 50 60, 100 80 T 200 80 T 300 80 T 400 80"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Circle cx="320" cy="100" r="30" stroke={color} strokeWidth="2" fill="none" />
  </Svg>
);

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
  task_started_at?: string;
  car_image_url?: string;
  car_location?: string;
}

const InputField = ({
  icon,
  label,
  placeholder,
  value,
  onChange,
  keyboard = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  keyboard?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
}) => {
  return (
    <View style={styles.inputFieldContainer}>
      <Text style={styles.inputFieldLabel}>{label}</Text>
      <View style={styles.clayInputCard}>
        <View style={styles.inputIconWrapper}>{icon}</View>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
        />
      </View>
    </View>
  );
};

export default function AddTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    car_image_url: '',
    car_location: '',
  });

  const [carTypes, setCarTypes] = useState<{ id: string; type: string }[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

      // 1. Get presigned URL
      const presignRes = await api.post('/s3/presign', {
        fileType: 'image/jpeg',
        folder: 'tasks',
      });
      const { uploadUrl, fileUrl } = presignRes.data;

      // 2. Upload to S3
      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
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
        car_image_url: '',
        car_location: '',
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
        <LinearGradient
          colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
        <TopoPattern />
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loadingText}>Loading workers...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      <TopoPattern />

      {/* HEADER SECTION */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerFlex}>
          <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
            <ArrowLeft size={22} color="#1E293B" />
          </Pressable>
          <Text style={styles.headerTitleText}>ASSIGN TASKS</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        ListEmptyComponent={<Text style={styles.emptyText}>No workers assigned to you</Text>}
        onRefresh={loadWorkers}
        refreshing={loading}
        renderItem={({ item }) => (
          <View style={styles.workerClayCard}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarClayContainer}>
                <User size={24} color="#0EA5E9" />
              </View>
              <View style={styles.workerBasicInfo}>
                <Text style={styles.workerName}>{item.full_name}</Text>
                <View style={styles.statusBadgeContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: item.status === 'working' ? '#10B981' : '#94A3B8' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.status === 'working' ? '#10B981' : '#64748B' },
                    ]}
                  >
                    {item.status === 'working' ? 'Working' : 'Idle'}
                  </Text>
                </View>
              </View>
            </View>

            {item.status === 'working' && (
              <BlurView intensity={20} style={styles.taskInfoGlassContainer}>
                <View style={styles.taskDetailHeader}>
                  <Car size={16} color="#0EA5E9" />
                  <Text style={styles.taskDetailTitle}>Current Task</Text>
                </View>

                <View style={styles.taskGrid}>
                  <View style={styles.taskGridItem}>
                    <Text style={styles.taskLabel}>Vehicle</Text>
                    <Text style={styles.taskValue}>{item.car_model}</Text>
                    <Text style={styles.taskSubValue}>{item.car_number}</Text>
                  </View>
                  <View style={styles.taskGridItem}>
                    <Text style={styles.taskLabel}>Owner</Text>
                    <Text style={styles.taskValue}>{item.owner_name || 'N/A'}</Text>
                  </View>
                </View>
              </BlurView>
            )}

            <View style={styles.cardActions}>
              <Pressable
                style={[
                  styles.clayActionButton,
                  item.status === 'working' ? styles.updateBtnStyle : styles.assignBtnStyle,
                ]}
                onPress={() => handleOpenModal(item, item.status === 'working')}
              >
                <Text
                  style={[
                    styles.clayActionBtnText,
                    item.status === 'working' ? { color: '#0EA5E9' } : { color: '#fff' },
                  ]}
                >
                  {item.status === 'working' ? 'Update Task' : 'Assign Task'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={[styles.modalContentRedesign, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeaderRedesign}>
                <Text style={styles.modalTitleRedesign}>
                  {isUpdating ? 'Update Task' : 'New Job Entry'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <X size={24} color="#1E293B" />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: Dimensions.get('window').height * 0.7 }}
              >
                <View style={styles.formGap}>
                  <Pressable onPress={showImageOptions} style={styles.imageUploadClayContainer}>
                    {uploadingImage ? (
                      <ActivityIndicator size="large" color="#0EA5E9" />
                    ) : formData.car_image_url ? (
                      <Image
                        source={{ uri: formData.car_image_url }}
                        style={styles.imagePreviewFull}
                      />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <View style={styles.cameraIconCircle}>
                          <Camera size={40} color="#0EA5E9" />
                        </View>
                        <Text style={styles.uploadTextCaps}>Take Vehicle Photo</Text>
                      </View>
                    )}
                  </Pressable>

                  <InputField
                    icon={<User size={18} color="#0EA5E9" />}
                    label="Customer Name"
                    placeholder="Eg: Rahul Sharma"
                    value={formData.owner_name}
                    onChange={(txt) => setFormData({ ...formData, owner_name: txt })}
                  />

                  <InputField
                    icon={<Phone size={18} color="#0EA5E9" />}
                    label="Contact Number"
                    placeholder="99000 00000"
                    value={formData.owner_phone}
                    onChange={(txt) => setFormData({ ...formData, owner_phone: txt })}
                    keyboard="phone-pad"
                  />

                  <InputField
                    icon={<Car size={18} color="#0EA5E9" />}
                    label="Vehicle Number"
                    placeholder="DL 01 AB 1234"
                    value={formData.car_number}
                    onChange={(txt) => setFormData({ ...formData, car_number: txt })}
                  />

                  <View style={styles.rowFlexGap}>
                    <View style={{ flex: 1.2 }}>
                      <InputField
                        icon={<Info size={18} color="#0EA5E9" />}
                        label="Model/Color"
                        placeholder="White Nexon"
                        value={
                          formData.car_color && formData.car_model
                            ? `${formData.car_color} ${formData.car_model}`
                            : formData.car_color || formData.car_model
                        }
                        onChange={(txt) => {
                          const parts = txt.trim().split(/\s+/);
                          if (parts.length > 1) {
                            setFormData({
                              ...formData,
                              car_color: parts[0],
                              car_model: parts.slice(1).join(' '),
                            });
                          } else {
                            setFormData({ ...formData, car_color: '', car_model: txt.trim() });
                          }
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, marginBottom: 24 }}>
                      <Text style={styles.inputFieldLabel}>Car Type</Text>
                      <Pressable
                        onPress={() => setShowTypePicker(true)}
                        style={styles.clayPickerTrigger}
                      >
                        <Text
                          style={[
                            styles.pickerValueText,
                            !formData.car_type && { color: '#94A3B8' },
                          ]}
                        >
                          {formData.car_type || 'Select Type'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <InputField
                    icon={<MapPin size={18} color="#0EA5E9" />}
                    label="Location (Optional)"
                    placeholder="Parking Level 2..."
                    value={formData.car_location}
                    onChange={(txt) => setFormData({ ...formData, car_location: txt })}
                  />
                </View>
              </ScrollView>

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                style={[styles.claySubmitButton, submitting && { opacity: 0.7 }]}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.claySubmitButtonText}>
                    {isUpdating ? 'Update Task' : 'Submit Job'}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    zIndex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  headerFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  listContent: {
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#94A3B8',
  },
  workerClayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarClayContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  workerBasicInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
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
  taskInfoGlassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  taskDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  taskDetailTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0EA5E9',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  taskGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskGridItem: {
    flex: 1,
  },
  taskLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  taskValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  taskSubValue: {
    fontSize: 12,
    color: '#64748B',
  },
  cardActions: {
    flexDirection: 'row',
  },
  clayActionButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignBtnStyle: {
    backgroundColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  updateBtnStyle: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  clayActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal Style Redesign
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContentRedesign: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
  },
  modalHeaderRedesign: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitleRedesign: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  imageUploadClayContainer: {
    height: 200,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(14, 165, 233, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  imagePreviewFull: {
    width: '100%',
    height: '100%',
  },
  cameraIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTextCaps: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  formGap: {
    gap: 4,
  },
  inputFieldContainer: {
    marginBottom: 24,
  },
  inputFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(148, 163, 184, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginLeft: 4,
  },
  clayInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  rowFlexGap: {
    flexDirection: 'row',
    gap: 16,
  },
  clayPickerTrigger: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pickerValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  claySubmitButton: {
    height: 56,
    backgroundColor: '#0EA5E9',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  claySubmitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pickerContent: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#4B5563',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
  },
});
