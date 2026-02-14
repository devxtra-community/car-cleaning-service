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
import { Camera, ArrowLeft, User, Phone, Car, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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
  const { colors } = useTheme();
  return (
    <View className="mb-6">
      <Text
        className="text-[11px] font-bold uppercase tracking-widest mb-2 ml-1"
        style={{ color: colors.textSecondary }}
      >
        {label}
      </Text>
      <View
        className="flex-row items-center border shadow-sm rounded-[22px] px-4 py-4"
        style={{
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOpacity: 0.05,
        }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.primaryLight }}
        >
          {icon}
        </View>
        <TextInput
          className="flex-1 font-bold text-base"
          style={{ color: colors.text }}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
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
  const { colors } = useTheme();
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
          } catch (error) {
            console.error('Task submission error:', error);
            const errorMessage =
              (error as any).response?.data?.message ||
              (error as Error).message ||
              'Could not save task. Try again.';
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
    <>
      {/* Custom Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
          <View
            className="rounded-t-3xl pb-8"
            style={{ backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 20 }}
          >
            <View
              className="flex-row items-center justify-between px-6 py-4 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Select Car Type
              </Text>
              <Pressable onPress={() => setShowTypePicker(false)}>
                <Text className="font-bold text-base" style={{ color: colors.primary }}>
                  Done
                </Text>
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
                  className="px-6 py-5 border-b"
                  style={{
                    borderBottomColor: colors.border,
                    backgroundColor: carType === type ? colors.primaryLight : 'transparent',
                  }}
                >
                  <Text
                    className="text-lg font-bold"
                    style={{ color: carType === type ? colors.primary : colors.text }}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View
            className="flex-row items-center justify-between px-6 pb-4"
            style={{ paddingTop: insets.top + 10 }}
          >
            <Pressable
              onPress={() => router.push('/(tabs)/Homepage')}
              className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <Text className="font-black text-xl tracking-tighter" style={{ color: colors.text }}>
              New Job Entry
            </Text>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={openCamera}
              className="h-60 rounded-[32px] overflow-hidden border-2 border-dashed justify-center items-center my-6"
              style={{
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              }}
            >
              {image ? (
                <Image source={{ uri: image.uri }} className="w-full h-full" />
              ) : (
                <View className="items-center">
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center shadow-sm mb-4"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Camera size={40} color={colors.primary} />
                  </View>
                  <Text
                    className="font-bold text-[10px] uppercase tracking-widest"
                    style={{ color: colors.textSecondary }}
                  >
                    Take Vehicle Photo
                  </Text>
                </View>
              )}
            </Pressable>

            <InputField
              icon={<User size={20} color={colors.primary} />}
              label="Customer Name"
              placeholder="Eg: Rahul Sharma"
              value={ownerName}
              onChange={setOwnerName}
            />
            <InputField
              icon={<Phone size={20} color={colors.primary} />}
              label="Contact Number"
              placeholder="99000 00000"
              value={ownerPhone}
              onChange={setOwnerPhone}
              keyboard="phone-pad"
            />
            <InputField
              icon={<Car size={20} color={colors.primary} />}
              label="Vehicle Number"
              placeholder="DL 01 AB 1234"
              value={carNumber}
              onChange={setCarNumber}
            />

            <View className="flex-row gap-4 mb-4">
              <View className="flex-[1.2]">
                <InputField
                  icon={<Info size={20} color={colors.primary} />}
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
              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest mb-2 ml-1"
                  style={{ color: colors.textSecondary }}
                >
                  Car Type
                </Text>
                <Pressable
                  onPress={() => setShowTypePicker(true)}
                  className="border shadow-sm rounded-[22px] h-[72px] justify-center px-4"
                  style={{
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  }}
                >
                  {loadingTypes ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text
                      className="text-base font-bold"
                      style={{ color: carType ? colors.text : colors.textTertiary }}
                    >
                      {carType || 'Select Type'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={submit}
              disabled={loading}
              className="w-full py-5 rounded-[22px] shadow-xl items-center mt-4 mb-10"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOpacity: 0.3,
              }}
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-black text-[12px] tracking-widest uppercase">
                    {gettingLocation ? 'Getting Location...' : 'Submitting...'}
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-black text-[12px] tracking-widest uppercase">
                  Submit Job
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
