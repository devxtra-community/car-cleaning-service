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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Camera, ArrowLeft, User, Phone, Car, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api/api';

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
}: InputFieldProps) => (
  <View className="mb-5">
    <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-2 ml-1">
      {label}
    </Text>
    <View className="flex-row items-center bg-white border border-gray-100 shadow-sm shadow-black/5 rounded-[22px] px-4 py-3.5">
      <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3">
        {icon}
      </View>
      <TextInput
        className="flex-1 text-gray-800 font-bold text-sm"
        placeholder={placeholder}
        placeholderTextColor="#ccc"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
      />
    </View>
  </View>
);

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
            const iUrl = await uploadToS3(image);
            await api.post('/tasks', {
              owner_name: ownerName,
              owner_phone: ownerPhone,
              car_number: carNumber,
              car_model: finalModel,
              car_color: finalColor,
              car_type: carType,
              car_image_url: iUrl,
            });
            router.replace('/(tabs)/Homepage');
          } catch {
            Alert.alert('Failed', 'Could not save task. Try again.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View
          className="flex-row items-center justify-between px-6 pb-4"
          style={{ paddingTop: insets.top + 10 }}
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm"
          >
            <ArrowLeft size={20} color="black" />
          </Pressable>
          <Text className="font-black text-lg tracking-tighter">New Job Entry</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={openCamera}
            className="h-56 bg-gray-100 rounded-[32px] overflow-hidden border-2 border-dashed border-gray-200 justify-center items-center my-6"
          >
            {image ? (
              <Image source={{ uri: image.uri }} className="w-full h-full" />
            ) : (
              <View className="items-center">
                <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-sm mb-3 text-[#1B86C6]">
                  <Camera size={32} color="#1B86C6" />
                </View>
                <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                  Take Vehicle Photo
                </Text>
              </View>
            )}
          </Pressable>

          <InputField
            icon={<User size={16} color="#1B86C6" />}
            label="Customer Name"
            placeholder="Eg: Rahul Sharma"
            value={ownerName}
            onChange={setOwnerName}
          />
          <InputField
            icon={<Phone size={16} color="#1B86C6" />}
            label="Contact Number"
            placeholder="99000 00000"
            value={ownerPhone}
            onChange={setOwnerPhone}
            keyboard="phone-pad"
          />
          <InputField
            icon={<Car size={16} color="#1B86C6" />}
            label="Vehicle Number"
            placeholder="DL 01 AB 1234"
            value={carNumber}
            onChange={setCarNumber}
          />

          <View className="flex-row gap-4 mb-4">
            <View className="flex-[1.2]">
              <InputField
                icon={<Info size={16} color="#1B86C6" />}
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
              <Text className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-2 ml-1">
                Car Type
              </Text>
              <View className="bg-white border border-gray-100 shadow-sm rounded-[22px] h-[58px] justify-center overflow-hidden">
                {loadingTypes ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Picker selectedValue={carType} onValueChange={setCarType} style={{ height: 50 }}>
                    <Picker.Item label="Type" value="" />
                    {types.map((t) => (
                      <Picker.Item key={t} label={t} value={t} />
                    ))}
                  </Picker>
                )}
              </View>
            </View>
          </View>

          <Pressable
            onPress={submit}
            disabled={loading}
            className={`h-16 rounded-[28px] items-center justify-center mb-10 shadow-lg ${loading ? 'bg-gray-400' : 'bg-[#1B86C6]'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-lg tracking-wide">Publish Task</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
