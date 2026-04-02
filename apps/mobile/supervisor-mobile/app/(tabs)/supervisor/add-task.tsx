import React from 'react';
import {
  View,
  Text,
  FlatList,
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
import { API } from '@/src/api/api';
import { useLanguage } from '@/contexts/LanguageContext';

// Topographic Pattern for Headers
const TopoPattern = ({ color = 'rgba(14, 165, 233, 0.08)' }: { color?: string }) => {
  const SvgComponent = Svg as any;
  const PathComponent = Path as any;
  const CircleComponent = Circle as any;

  return (
    <SvgComponent
      height="100%"
      width="100%"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
    >
      <PathComponent
        d="M 0 80 Q 50 60, 100 80 T 200 80 T 300 80 T 400 80"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <PathComponent
        d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <CircleComponent cx="320" cy="100" r="30" stroke={color} strokeWidth="2" fill="none" />
    </SvgComponent>
  );
};

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
    <View className="mb-6">
      <Text className="text-[11px] font-antigravity-bold text-[#94A3B8] uppercase tracking-widest mb-2 ml-1">
        {label}
      </Text>
      <View className="flex-row items-center bg-white rounded-[20px] px-4 h-14 border border-[#F1F5F9] shadow-sm">
        <View className="w-10 h-10 rounded-xl bg-[#F0F9FF] items-center justify-center mr-3">
          {icon}
        </View>
        <TextInput
          className="flex-1 text-base font-antigravity-bold text-[#1E293B]"
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
  const { t } = useLanguage();
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
      const res = await API.get('/api/vehicle');
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
      const presignRes = await API.post('/s3/presign', {
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
      const res = await API.get('/api/supervisor/workers');

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
        await API.patch(`/api/supervisor/tasks/${selectedWorker.current_task_id}`, formData);
        Alert.alert('Success', 'Task updated successfully');
      } else {
        await API.post('/api/supervisor/tasks', {
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
    const LinearGradientComponent = LinearGradient as any;
    return (
      <View className="flex-1 justify-center items-center">
        <LinearGradientComponent
          colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
          className="absolute inset-0"
        />
        <TopoPattern />
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="mt-3 text-sm text-[#64748B] z-10 font-antigravity-medium">
          {t('addJob.loadingWorkers', { defaultValue: 'Loading workers...' })}
        </Text>
      </View>
    );
  }

  const LinearGradientComponent = LinearGradient as any;
  const BlurViewComponent = BlurView as any;

  return (
    <View className="flex-1">
      <LinearGradientComponent
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        className="absolute inset-0"
      />
      <TopoPattern />

      {/* HEADER SECTION */}
      <View
        className="px-6 pb-5 bg-white/80 rounded-b-[40px] shadow-sm z-10"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white border border-[#F1F5F9]"
          >
            <ArrowLeft size={22} color="#1E293B" />
          </Pressable>
          <Text className="text-lg font-antigravity-bold text-[#1E293B] tracking-tighter">
            {t('supervisor.addTasks', { defaultValue: 'Assign Tasks' }).toUpperCase()}
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        ListEmptyComponent={
          <Text className="text-center mt-[60px] text-base text-[#94A3B8] font-antigravity-medium">
            {t('supervisor.noWorkers', { defaultValue: 'No workers assigned to you' })}
          </Text>
        }
        onRefresh={loadWorkers}
        refreshing={loading}
        renderItem={({ item }) => (
          <View className="bg-white/90 rounded-[28px] p-4 mb-4 border border-white shadow-xl">
            <View className="flex-row items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-[#E0F2FE] items-center justify-center mr-4">
                <User size={24} color="#0EA5E9" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-antigravity-bold text-[#1E293B]">
                  {item.full_name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View
                    className={`w-2 h-2 rounded-full mr-[6px] ${item.status === 'working' ? 'bg-[#10B981]' : 'bg-[#94A3B8]'}`}
                  />
                  <Text
                    className={`text-[13px] font-antigravity-semibold ${item.status === 'working' ? 'text-[#10B981]' : 'text-[#64748B]'}`}
                  >
                    {item.status === 'working'
                      ? t('supervisor.working', { defaultValue: 'Working' })
                      : t('supervisor.idle', { defaultValue: 'Idle' })}
                  </Text>
                </View>
              </View>
            </View>

            {item.status === 'working' && (
              <BlurViewComponent
                intensity={20}
                className="bg-white/50 rounded-[24px] p-4 mb-4 overflow-hidden border border-white/50"
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <Car size={16} color="#0EA5E9" />
                  <Text className="text-xs font-antigravity-bold text-[#0EA5E9] uppercase tracking-widest">
                    {t('addJob.currentTask', { defaultValue: 'Current Task' })}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-[10px] text-[#94A3B8] uppercase font-antigravity-bold mb-1">
                      {t('addJob.vehicle', { defaultValue: 'Vehicle' })}
                    </Text>
                    <Text className="text-sm font-antigravity-bold text-[#1E293B]">
                      {item.car_model}
                    </Text>
                    <Text className="text-xs text-[#64748B] font-antigravity-medium">
                      {item.car_number}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] text-[#94A3B8] uppercase font-antigravity-bold mb-1">
                      {t('addJob.owner', { defaultValue: 'Owner' })}
                    </Text>
                    <Text className="text-sm font-antigravity-bold text-[#1E293B]">
                      {item.owner_name || 'N/A'}
                    </Text>
                  </View>
                </View>
              </BlurViewComponent>
            )}

            <View className="flex-row">
              <Pressable
                className={`flex-1 h-12 rounded-2xl items-center justify-center ${
                  item.status === 'working'
                    ? 'bg-white border border-[#0EA5E9]'
                    : 'bg-[#0EA5E9] shadow-lg'
                }`}
                onPress={() => handleOpenModal(item, item.status === 'working')}
              >
                <Text
                  className={`text-sm font-antigravity-bold ${
                    item.status === 'working' ? 'text-[#0EA5E9]' : 'text-white'
                  }`}
                >
                  {item.status === 'working'
                    ? t('addJob.updateTask', { defaultValue: 'Update Task' })
                    : t('addJob.assignTask', { defaultValue: 'Assign Task' })}
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
        <View className="flex-1 justify-end bg-black/30">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 justify-end"
          >
            <View
              className="bg-white/95 rounded-t-[32px] p-5"
              style={{ paddingBottom: insets.bottom + 20 }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-antigravity-bold text-[#1E293B]">
                  {isUpdating
                    ? t('addJob.updateTask', { defaultValue: 'Update Task' })
                    : t('addJob.entry', { defaultValue: 'New Job Entry' })}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <X size={24} color="#1E293B" />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: Dimensions.get('window').height * 0.7 }}
              >
                <View className="gap-1">
                  <Pressable
                    onPress={showImageOptions}
                    className="h-[200px] rounded-[32px] border-2 border-[#0EA5E933] border-dashed bg-white/50 items-center justify-center overflow-hidden mb-6"
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="large" color="#0EA5E9" />
                    ) : formData.car_image_url ? (
                      <Image source={{ uri: formData.car_image_url }} className="w-full h-full" />
                    ) : (
                      <View className="items-center">
                        <View className="w-20 h-20 rounded-full bg-[#E0F2FE] items-center justify-center mb-3">
                          <Camera size={40} color="#0EA5E9" />
                        </View>
                        <Text className="text-[11px] font-antigravity-bold text-[#94A3B8] uppercase tracking-widest">
                          {t('addJob.takePhoto', { defaultValue: 'Take Vehicle Photo' })}
                        </Text>
                      </View>
                    )}
                  </Pressable>

                  <InputField
                    icon={<User size={18} color="#0EA5E9" />}
                    label={t('addJob.ownerName', { defaultValue: 'Customer Name' })}
                    placeholder="Eg: Rahul Sharma"
                    value={formData.owner_name}
                    onChange={(txt) => setFormData({ ...formData, owner_name: txt })}
                  />

                  <InputField
                    icon={<Phone size={18} color="#0EA5E9" />}
                    label={t('addJob.ownerPhone', { defaultValue: 'Contact Number' })}
                    placeholder="99000 00000"
                    value={formData.owner_phone}
                    onChange={(txt) => setFormData({ ...formData, owner_phone: txt })}
                    keyboard="phone-pad"
                  />

                  <InputField
                    icon={<Car size={18} color="#0EA5E9" />}
                    label={t('addJob.carNumber', { defaultValue: 'Vehicle Number' })}
                    placeholder="DL 01 AB 1234"
                    value={formData.car_number}
                    onChange={(txt) => setFormData({ ...formData, car_number: txt })}
                  />

                  <View className="flex-row gap-4">
                    <View className="flex-[1.2]">
                      <InputField
                        icon={<Info size={18} color="#0EA5E9" />}
                        label={t('addJob.modelColor', { defaultValue: 'Model/Color' })}
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
                    <View className="flex-1 mb-6">
                      <Text className="text-[10px] font-antigravity-bold text-[#94A3B8CC] uppercase tracking-widest mb-1.5 ml-1">
                        {t('addJob.carType', { defaultValue: 'Car Type' })}
                      </Text>
                      <Pressable
                        onPress={() => setShowTypePicker(true)}
                        className="h-[52px] bg-white rounded-2xl justify-center px-3 border border-[#F1F5F9]"
                      >
                        <Text
                          className={`text-sm font-antigravity-semibold text-[#1E293B] ${!formData.car_type ? 'text-[#94A3B8]' : ''}`}
                        >
                          {formData.car_type || 'Select Type'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <InputField
                    icon={<MapPin size={18} color="#0EA5E9" />}
                    label={t('addJob.location', { defaultValue: 'Location (Optional)' })}
                    placeholder="Parking Level 2..."
                    value={formData.car_location}
                    onChange={(txt) => setFormData({ ...formData, car_location: txt })}
                  />
                </View>
              </ScrollView>

              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                className={`h-14 bg-[#0EA5E9] rounded-[20px] items-center justify-center mt-3 shadow-lg ${submitting ? 'opacity-70' : ''}`}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-sm font-antigravity-bold uppercase tracking-widest">
                    {isUpdating
                      ? t('addJob.updateTask', { defaultValue: 'Update Task' })
                      : t('addJob.submitJob', { defaultValue: 'Submit Job' })}
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
        <Pressable
          className="flex-1 justify-end bg-black/30"
          onPress={() => setShowTypePicker(false)}
        >
          <View className="bg-white mx-5 rounded-[20px] p-5 max-h-[60%]">
            <View className="flex-row justify-between items-center mb-4 pb-[10px] border-b border-[#F3F4F6]">
              <Text className="text-base font-antigravity-bold text-[#1F2937]">
                {t('addJob.selectType', { defaultValue: 'Select Car Type' })}
              </Text>
              <Pressable onPress={() => setShowTypePicker(false)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView>
              {carTypes.map((type) => (
                <Pressable
                  key={type.id}
                  className="flex-row justify-between items-center py-[14px] border-b border-[#F9FAFB]"
                  onPress={() => {
                    setFormData({ ...formData, car_type: type.type });
                    setShowTypePicker(false);
                  }}
                >
                  <Text className="text-[15px] text-[#4B5563] font-antigravity-medium">
                    {type.type}
                  </Text>
                  {formData.car_type === type.type && (
                    <View className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
