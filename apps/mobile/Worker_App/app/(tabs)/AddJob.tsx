import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, ArrowLeft, User, Phone, Car, Info, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

interface InputFieldProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  keyboard?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
}

const InputField = ({
  icon,
  label,
  placeholder,
  value,
  onChange,
  keyboard = 'default',
}: InputFieldProps) => {
  return (
    <View className="mb-6">
      <Text className="text-[10px] font-label uppercase tracking-widest mb-2 ml-1 text-clay-secondary/80">
        {label}
      </Text>
      <View className="clay-card flex-row items-center px-4 py-4 bg-white border border-gray-100">
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-[#E0F2FE]">
          {icon}
        </View>
        <TextInput
          className="flex-1 font-heading text-base text-clay-text"
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

export default function AddJob() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carType, setCarType] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/vehicle');
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setTypes([...new Set(list.map((v: { type: string }) => String(v.type)))] as string[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, []);

  const openCamera = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (p.granted) {
      const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!res.canceled) setImage(res.assets[0]);
    }
  };

  const uploadToS3 = async (img: ImagePickerAsset) => {
    const presign = await api.post('/s3/presign', { fileType: 'image/jpeg' });
    const { uploadUrl, fileUrl } = presign.data;
    const blob = await (await fetch(img.uri)).blob();
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    });
    if (!uploadRes.ok) throw new Error('S3 upload failed');
    return fileUrl;
  };

  const submit = async () => {
    if (!image || !ownerName || !ownerPhone || !carNumber || !carType || !carModel) {
      return Alert.alert('Missing Info', 'Please fill all required fields and add a photo.');
    }

    const finalColor = carColor.trim() || 'Standard';
    const finalModel = carModel.trim();

    Alert.alert('Submit Job', 'Confirm all details are correct?', [
      { text: 'Review', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setLoading(true);
            setGettingLocation(true);

            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              setGettingLocation(false);
              setLoading(false);
              return Alert.alert(
                'Permission Denied',
                'GPS permission is required to create tasks.'
              );
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            setGettingLocation(false);

            const iUrl = await uploadToS3(image);
            await api.post('/tasks', {
              owner_name: ownerName,
              owner_phone: ownerPhone,
              car_number: carNumber,
              car_model: finalModel,
              car_color: finalColor,
              car_type: carType,
              car_image_url: iUrl,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            router.replace('/(tabs)/Homepage');
          } catch (error: unknown) {
            console.error('Task submission error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const errorMessage =
              err.response?.data?.message ||
              (error instanceof Error ? error.message : 'Could not save task. Try again.');
            Alert.alert('Failed', errorMessage);
          } finally {
            setLoading(false);
            setGettingLocation(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        className="absolute w-full h-full"
      />

      {/* Custom Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <BlurView intensity={20} className="flex-1 justify-end">
          <View
            className="rounded-t-[40px] pb-8 bg-white/90"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
              <Text className="text-xl font-heading text-clay-text">Select Car Type</Text>
              <Pressable onPress={() => setShowTypePicker(false)}>
                <Text className="font-heading text-base text-[#0EA5E9]">Done</Text>
              </Pressable>
            </View>
            <ScrollView className="max-h-96">
              {types.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => {
                    setCarType(type);
                    setShowTypePicker(false);
                  }}
                  className={`px-6 py-5 border-b border-gray-100 ${
                    carType === type ? 'bg-[#E0F2FE]' : 'transparent'
                  }`}
                >
                  <Text
                    className={`text-lg font-heading ${
                      carType === type ? 'text-[#0EA5E9]' : 'text-clay-text'
                    }`}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </BlurView>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View
          className="pb-6 rounded-b-[40px] shadow-sm bg-white/80 z-10"
          style={{ paddingTop: insets.top + 10 }}
        >
          <View className="flex-row items-center justify-between px-6">
            <Pressable
              onPress={() => router.push('/(tabs)/Homepage')}
              className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
            >
              <ArrowLeft size={24} color="#1E293B" />
            </Pressable>
            <Text className="text-xl font-heading tracking-tight text-clay-text">
              New Job Entry
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        >
          <Pressable
            onPress={openCamera}
            className="h-60 rounded-[32px] overflow-hidden border-2 border-dashed border-clay-secondary/30 justify-center items-center mb-8 bg-white/50"
          >
            {image ? (
              <Image source={{ uri: image.uri }} className="w-full h-full" />
            ) : (
              <View className="items-center">
                <View className="w-20 h-20 rounded-full items-center justify-center shadow-sm mb-4 bg-[#E0F2FE]">
                  <Camera size={40} color="#0EA5E9" />
                </View>
                <Text className="font-heading text-xs uppercase tracking-widest text-clay-secondary">
                  Take Vehicle Photo
                </Text>
              </View>
            )}
            <View className="absolute bottom-4 right-4 bg-white/80 px-3 py-1 rounded-full">
              <View className="flex-row items-center gap-1">
                <MapPin size={12} color="#0EA5E9" />
                <Text className="text-[10px] font-bold text-clay-secondary">Tagging Location</Text>
              </View>
            </View>
          </Pressable>

          <View className="gap-2">
            <InputField
              icon={<User size={20} color="#0EA5E9" />}
              label="Customer Name"
              placeholder="Eg: Rahul Sharma"
              value={ownerName}
              onChange={setOwnerName}
            />
            <InputField
              icon={<Phone size={20} color="#0EA5E9" />}
              label="Contact Number"
              placeholder="99000 00000"
              value={ownerPhone}
              onChange={setOwnerPhone}
              keyboard="phone-pad"
            />
            <InputField
              icon={<Car size={20} color="#0EA5E9" />}
              label="Vehicle Number"
              placeholder="DL 01 AB 1234"
              value={carNumber}
              onChange={setCarNumber}
            />

            <View className="flex-row gap-4 mb-4">
              <View className="flex-[1.2]">
                <InputField
                  icon={<Info size={20} color="#0EA5E9" />}
                  label="Model/Color"
                  placeholder="White Nexon"
                  value={carColor && carModel ? `${carColor} ${carModel}` : carColor || carModel}
                  onChange={(txt: string) => {
                    const parts = txt.trim().split(/\s+/);
                    if (parts.length > 1) {
                      setCarColor(parts[0]);
                      setCarModel(parts.slice(1).join(' '));
                    } else {
                      setCarColor('');
                      setCarModel(txt.trim());
                    }
                  }}
                />
              </View>
              <View className="flex-1 mb-6">
                <Text className="text-[10px] font-label uppercase tracking-widest mb-2 ml-1 text-clay-secondary/80">
                  Car Type
                </Text>
                <Pressable
                  onPress={() => setShowTypePicker(true)}
                  className="clay-card h-[60px] justify-center px-4 bg-white border border-gray-100"
                >
                  {loadingTypes ? (
                    <ActivityIndicator size="small" color="#0EA5E9" />
                  ) : (
                    <Text
                      className={`text-base font-heading ${
                        carType ? 'text-clay-text' : 'text-gray-400'
                      }`}
                    >
                      {carType || 'Select Type'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            onPress={submit}
            disabled={loading}
            className="w-full py-5 rounded-[22px] shadow-lg shadow-blue-200 items-center clay-button bg-[#0EA5E9]"
          >
            {loading ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-heading text-[12px] tracking-widest uppercase">
                  {gettingLocation ? 'Getting Location...' : 'Submitting...'}
                </Text>
              </View>
            ) : (
              <Text className="text-white font-heading text-[12px] tracking-widest uppercase">
                Submit Job
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
