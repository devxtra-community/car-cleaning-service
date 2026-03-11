import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  User,
  ChevronDown,
  X,
  Car,
  Clock,
  MapPin,
  Phone,
  DollarSign,
  Hash,
  Image as ImageIcon,
  Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { API } from '@/src/api/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Worker {
  id: string;
  full_name: string;
  email: string;
  status: 'idle' | 'working';
  task_started_at?: string;
  current_task_id?: string;
  car_number?: string;
  car_model?: string;
  car_type?: string;
  car_image_url?: string;
  owner_name?: string;
  owner_phone?: string;
  task_amount?: string;
  car_location?: string;
  car_color?: string;
}

interface VehicleType {
  id: string;
  type: string;
}

export default function LiveWorker() {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [carTypes, setCarTypes] = useState<VehicleType[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [formData, setFormData] = useState({
    owner_name: '',
    owner_phone: '',
    car_number: '',
    car_model: '',
    car_type: '',
    car_image_url: '',
    task_amount: '',
    car_location: '',
    car_color: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleWorkerPress = (worker: Worker) => {
    setSelectedWorker(worker);
    if (worker.status === 'working') {
      setIsUpdating(true);
      setFormData({
        owner_name: worker.owner_name || '',
        owner_phone: worker.owner_phone || '',
        car_number: worker.car_number || '',
        car_model: worker.car_model || '',
        car_type: worker.car_type || '',
        car_image_url: worker.car_image_url || '',
        task_amount: worker.task_amount?.toString() || '',
        car_location: worker.car_location || '',
        car_color: worker.car_color || '',
      });
    } else {
      setIsUpdating(false);
      setFormData({
        owner_name: '',
        owner_phone: '',
        car_number: '',
        car_model: '',
        car_type: '',
        car_image_url: '',
        task_amount: '',
        car_location: '',
        car_color: '',
      });
    }
    setModalVisible(true);
  };

  const showImageOptions = () => {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      setUploadingImage(true);
      const presignRes = await API.post('/s3/presign', {
        fileType: 'image/jpeg',
        folder: 'tasks',
      });

      const { uploadUrl, fileUrl } = presignRes.data;

      const response = await fetch(uri);
      const blob = await response.blob();

      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      setFormData({ ...formData, car_image_url: fileUrl });
    } catch (err) {
      console.error('Upload failed', err);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.owner_name ||
      !formData.car_number ||
      !formData.car_model ||
      !formData.car_type ||
      !formData.task_amount
    ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!selectedWorker) return;

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
      loadWorkers();
    } catch (err) {
      console.error('Submission failed', err);
      Alert.alert('Error', 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/api/supervisor/workers');

      if (res.data.success) {
        setWorkers(res.data.data);
      } else {
        setError('Failed to fetch workers');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5F7FA]">
        <ActivityIndicator size="large" color="#3DA2CE" />
        <Text className="mt-3 text-sm text-[#6B7280] font-antigravity-medium">
          {t('addJob.loadingWorkers', { defaultValue: 'Loading workers...' })}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5F7FA]">
        <Text className="text-sm text-[#EF4444] text-center px-5 font-antigravity-medium">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA] p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-antigravity-bold text-[#2C2C2C]">
          {t('supervisor.workerStatus', { defaultValue: 'Worker Status' })}
        </Text>
        <TouchableOpacity className="px-3 py-1.5 bg-[#E8F4F8] rounded-lg" onPress={loadWorkers}>
          <Text className="text-[#3DA2CE] text-[13px] font-antigravity-bold">
            {t('common.refresh', { defaultValue: 'Refresh' })}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text className="text-center mt-10 text-[#9CA3AF] font-antigravity-medium">
            {t('supervisor.noWorkers', { defaultValue: 'No workers assigned to you' })}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row bg-white rounded-2xl p-3.5 mb-3 items-center shadow-sm border border-white"
            onPress={() => handleWorkerPress(item)}
          >
            <View className="w-12 h-12 rounded-full bg-[#E8F4F8] justify-center items-center mr-3">
              <User size={20} color="#3DA2CE" />
            </View>

            <View className="flex-1">
              <Text className="text-[15px] font-antigravity-bold text-[#2C2C2C]">
                {item.full_name}
              </Text>
              <Text className="text-xs text-[#6B7280] font-antigravity-medium mt-0.5">
                {item.email}
              </Text>

              <View className="flex-row items-center mt-1.5">
                <View
                  className={`w-2 h-2 rounded-full mr-1.5 ${item.status === 'working' ? 'bg-[#16A34A]' : 'bg-[#9CA3AF]'}`}
                />
                <Text
                  className={`text-[12px] font-antigravity-bold ${item.status === 'working' ? 'text-[#16A34A]' : 'text-[#6B7280]'}`}
                >
                  {item.status === 'working'
                    ? t('supervisor.working', { defaultValue: 'Working' }).toUpperCase()
                    : t('supervisor.idle', { defaultValue: 'Idle' }).toUpperCase()}
                </Text>
                {item.status === 'working' && item.task_started_at && (
                  <Text className="text-xs text-[#6B7280] font-antigravity-medium ml-1.5">
                    {t('supervisor.sinceTime', {
                      time: formatTime(item.task_started_at),
                      defaultValue: `• Since ${formatTime(item.task_started_at)}`,
                    })}
                  </Text>
                )}
              </View>
            </View>

            {item.status === 'working' && (
              <View className="bg-[#E8F4F8] px-2 py-1 rounded">
                <Text className="text-[10px] text-[#3DA2CE] font-antigravity-bold">
                  {t('supervisor.viewTask', { defaultValue: 'View Task' })}
                </Text>
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
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%] min-h-[40%]">
            <View className="flex-row justify-between items-center p-5 border-b border-[#F3F4F6]">
              <Text className="text-lg font-antigravity-bold text-[#2C2C2C]">
                {t('supervisor.workerDetails', { defaultValue: 'Worker Details' })}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View className="items-center mb-6">
                <View className="w-[60px] h-[60px] rounded-full bg-[#E8F4F8] justify-center items-center mb-3">
                  <User size={30} color="#3DA2CE" />
                </View>
                <Text className="text-lg font-antigravity-bold text-[#2C2C2C]">
                  {selectedWorker?.full_name}
                </Text>
                <Text className="text-sm text-[#6B7280] font-antigravity-medium mt-0.5">
                  {selectedWorker?.email}
                </Text>
                <View
                  className={`mt-3 px-3 py-1.5 rounded-full ${selectedWorker?.status === 'working' ? 'bg-[#DCFCE7]' : 'bg-[#F3F4F6]'}`}
                >
                  <Text
                    className={`text-[12px] font-antigravity-bold ${selectedWorker?.status === 'working' ? 'text-[#16A34A]' : 'text-[#6B7280]'}`}
                  >
                    {selectedWorker?.status === 'working'
                      ? t('supervisor.currentlyWorking', { defaultValue: 'Currently Working' })
                      : t('supervisor.currentlyIdle', { defaultValue: 'Currently Idle' })}
                  </Text>
                </View>
              </View>

              {selectedWorker?.status === 'working' ? (
                <View className="bg-[#F9FAFB] rounded-2xl p-4 mb-5 shadow-sm border border-[#F3F4F6]">
                  <Text className="text-[15px] font-antigravity-bold text-[#2C2C2C] mb-4">
                    {t('supervisor.currentTaskInfo', { defaultValue: 'Current Task Info' })}
                  </Text>

                  <DetailRow
                    icon={<Car size={18} color="#3DA2CE" />}
                    label={t('addJob.vehicle', { defaultValue: 'Vehicle' })}
                    value={`${selectedWorker.car_number} (${selectedWorker.car_model})`}
                  />
                  <DetailRow
                    icon={<Hash size={18} color="#3DA2CE" />}
                    label={t('supervisor.type', { defaultValue: 'Type' })}
                    value={selectedWorker.car_type || 'N/A'}
                  />
                  <DetailRow
                    icon={<User size={18} color="#3DA2CE" />}
                    label={t('addJob.owner', { defaultValue: 'Owner' })}
                    value={selectedWorker.owner_name || 'N/A'}
                  />
                  <DetailRow
                    icon={<Phone size={18} color="#3DA2CE" />}
                    label={t('supervisor.phone', { defaultValue: 'Phone' })}
                    value={selectedWorker.owner_phone || 'N/A'}
                  />
                  <DetailRow
                    icon={<DollarSign size={18} color="#3DA2CE" />}
                    label={t('supervisor.amount', { defaultValue: 'Amount' })}
                    value={`₹${selectedWorker.task_amount}`}
                  />
                  <DetailRow
                    icon={<Clock size={18} color="#3DA2CE" />}
                    label={t('supervisor.startedAt', { defaultValue: 'Started At' })}
                    value={formatTime(selectedWorker.task_started_at!)}
                  />
                </View>
              ) : (
                <View className="items-center py-6">
                  <Clock size={40} color="#9CA3AF" className="mb-2.5" />
                  <Text className="text-sm text-[#9CA3AF] font-antigravity-medium">
                    {t('supervisor.noActiveTask', { defaultValue: 'No active task at the moment' })}
                  </Text>
                </View>
              )}

              {/* TASK MANAGEMENT FORM */}
              <View className="pt-2 px-1 border-t border-[#F3F4F6] mt-2">
                <Text className="text-[15px] font-antigravity-bold text-[#2C2C2C] mb-4">
                  {isUpdating
                    ? t('supervisor.updateTaskDetails', { defaultValue: 'Update Task Details' })
                    : t('supervisor.assignNewTask', { defaultValue: 'Assign New Task' })}
                </Text>

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('addJob.ownerName', { defaultValue: 'Owner Name' })}
                </Text>
                <TextInput
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] font-antigravity-medium text-[#1F2937] mb-4"
                  placeholder="Ex: John Doe"
                  value={formData.owner_name}
                  onChangeText={(text) => setFormData({ ...formData, owner_name: text })}
                />

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('addJob.ownerPhone', { defaultValue: 'Owner Phone' })}
                </Text>
                <TextInput
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] font-antigravity-medium text-[#1F2937] mb-4"
                  placeholder="Ex: 9876543210"
                  keyboardType="phone-pad"
                  value={formData.owner_phone}
                  onChangeText={(text) => setFormData({ ...formData, owner_phone: text })}
                />

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('addJob.carNumber', { defaultValue: 'Car Number' })}
                </Text>
                <TextInput
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] font-antigravity-medium text-[#1F2937] mb-4"
                  placeholder="Ex: KA 01 AB 1234"
                  autoCapitalize="characters"
                  value={formData.car_number}
                  onChangeText={(text) => setFormData({ ...formData, car_number: text })}
                />

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('addJob.modelColor', { defaultValue: 'Car Model' })}
                </Text>
                <TextInput
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] font-antigravity-medium text-[#1F2937] mb-4"
                  placeholder="Ex: Honda City"
                  value={formData.car_model}
                  onChangeText={(text) => setFormData({ ...formData, car_model: text })}
                />

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('addJob.carType', { defaultValue: 'Car Type' })}
                </Text>
                <Pressable
                  className="flex-row items-center justify-between bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-3 mb-4"
                  onPress={() => setShowTypePicker(true)}
                >
                  <Text
                    className={`text-[15px] font-antigravity-medium ${!formData.car_type ? 'text-[#9CA3AF]' : 'text-[#1F2937]'}`}
                  >
                    {formData.car_type ||
                      t('addJob.selectType', { defaultValue: 'Select Car Type' })}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </Pressable>

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('addJob.location', { defaultValue: 'Car Location (Optional)' })}
                </Text>
                <View className="flex-row items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 mb-4">
                  <MapPin size={18} color="#9CA3AF" className="mr-2" />
                  <TextInput
                    className="flex-1 py-3 text-[15px] font-antigravity-medium text-[#1F2937]"
                    placeholder="Ex: Parking Level 2, Spot B12"
                    value={formData.car_location}
                    onChangeText={(text) => setFormData({ ...formData, car_location: text })}
                  />
                </View>

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('supervisor.carColor', { defaultValue: 'Car Color' })}
                </Text>
                <TextInput
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] font-antigravity-medium text-[#1F2937] mb-4"
                  placeholder="Ex: White"
                  value={formData.car_color}
                  onChangeText={(text) => setFormData({ ...formData, car_color: text })}
                />

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('supervisor.carPhoto', { defaultValue: 'Car Photo' })}
                </Text>
                <Pressable
                  className="bg-[#F9FAFB] border border-[#E5E7EB] border-dashed rounded-xl p-4 mb-4 items-center justify-center min-h-[100px]"
                  onPress={showImageOptions}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color="#3DA2CE" />
                  ) : formData.car_image_url ? (
                    <View className="w-full relative rounded-lg overflow-hidden">
                      <Image
                        source={{ uri: formData.car_image_url }}
                        className="w-full h-40"
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 bg-black/30 justify-center items-center">
                        <Camera size={24} color="#FFF" />
                        <Text className="text-white text-xs font-antigravity-bold mt-1">
                          {t('supervisor.changePhoto', { defaultValue: 'Change Photo' })}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <ImageIcon size={28} color="#3DA2CE" />
                      <Text className="text-[#3DA2CE] text-sm font-antigravity-bold mt-2">
                        {t('supervisor.uploadCarPhoto', { defaultValue: 'Upload Car Photo' })}
                      </Text>
                    </>
                  )}
                </Pressable>

                <Text className="text-sm font-antigravity-bold text-[#4B5563] mb-2">
                  {t('supervisor.taskAmount', { defaultValue: 'Task Amount (₹)' })}
                </Text>
                <TextInput
                  className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-3 text-[15px] font-antigravity-medium text-[#1F2937] mb-6"
                  placeholder="Ex: 500"
                  keyboardType="numeric"
                  value={formData.task_amount}
                  onChangeText={(text) => setFormData({ ...formData, task_amount: text })}
                />

                <TouchableOpacity
                  className={`py-4 rounded-xl items-center shadow-lg bg-[#3DA2CE] ${submitting ? 'opacity-70' : ''}`}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-white text-base font-antigravity-bold">
                      {isUpdating
                        ? t('addJob.updateTask', { defaultValue: 'Update Task' })
                        : t('addJob.assignTask', { defaultValue: 'Assign Task' })}
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
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center p-5"
          onPress={() => setShowTypePicker(false)}
        >
          <View className="bg-white rounded-2xl w-full max-h-[70%]">
            <View className="flex-row justify-between items-center p-4 border-b border-[#F3F4F6]">
              <Text className="text-base font-antigravity-bold text-[#1F2937]">
                {t('addJob.selectType', { defaultValue: 'Select Car Type' })}
              </Text>
              <Pressable onPress={() => setShowTypePicker(false)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
            <ScrollView className="p-2">
              {carTypes.map((type) => (
                <Pressable
                  key={type.id}
                  className="flex-row justify-between items-center p-4 rounded-xl mb-1 active:bg-[#F3F4F6]"
                  onPress={() => {
                    setFormData({ ...formData, car_type: type.type });
                    setShowTypePicker(false);
                  }}
                >
                  <Text
                    className={`text-[15px] ${formData.car_type === type.type ? 'font-antigravity-bold text-[#3DA2CE]' : 'font-antigravity-medium text-[#4B5563]'}`}
                  >
                    {type.type}
                  </Text>
                  {formData.car_type === type.type && (
                    <View className="w-2 h-2 rounded-full bg-[#3DA2CE]" />
                  )}
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
    <View className="flex-row items-center mb-4">
      <View className="w-10 h-10 rounded-xl bg-white justify-center items-center shadow-sm mr-3 border border-[#F1F5F9]">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-antigravity-bold text-[#94A3B8] uppercase tracking-wider">
          {label}
        </Text>
        <Text className="text-sm font-antigravity-bold text-[#1E293B] mt-0.5">{value}</Text>
      </View>
    </View>
  );
}
