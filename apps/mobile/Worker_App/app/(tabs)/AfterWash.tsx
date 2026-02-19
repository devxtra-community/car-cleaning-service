import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker'; // Keep native picker for now, or replace if desired
import { Camera, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

/* ================= TYPES ================= */

interface PricingData {
  base_price: number;
  premium_price: number;
  wash_time: number;
}

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

/* ================= COMPONENT ================= */

export default function AfterWash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  const carType = params.carType as string;

  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [finalPrice, setFinalPrice] = useState<string>(''); // Keep as string for input handling
  const [loading, setLoading] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(true);

  /* ================= LOAD PRICING ================= */

  useEffect(() => {
    const loadPricing = async () => {
      if (!carType) return;
      try {
        const res = await api.get(`/api/vehicle/${carType}/pricing`);
        if (res.data?.success) {
          const data = res.data.data;
          // Ensure prices are numbers
          const cleanData = {
            ...data,
            base_price: Number(data.base_price),
            premium_price: Number(data.premium_price),
          };
          setPricing(cleanData);
          // Set initial price to base price
          setFinalPrice(cleanData.base_price.toString());
        }
      } catch (err) {
        console.error('Failed to load pricing:', err);
        Alert.alert('Error', 'Failed to load pricing information');
      } finally {
        setLoadingPricing(false);
      }
    };

    loadPricing();
  }, [carType]);

  /* ================= PARAMS & VALIDATION ================= */

  useEffect(() => {
    if (!jobId || !carType) {
      console.error('Missing required params:', { jobId, carType });
      Alert.alert('Error', 'Invalid job details', [
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    }
  }, [jobId, carType, router]);

  if (!jobId || !carType) {
    return (
      <View
        className="flex-1 justify-center items-center bg-[#E0F2FE]"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="mt-4 font-heading text-clay-secondary">Loading details...</Text>
      </View>
    );
  }

  /* ================= CAMERA ================= */

  const openCamera = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (!res.canceled) {
      setImage(res.assets[0]);
    }
  };

  /* ================= S3 UPLOAD ================= */

  const uploadToS3 = async (image: ImagePickerAsset): Promise<string> => {
    const presign = await api.post('/s3/presign', {
      fileType: 'image/jpeg',
    });

    const { uploadUrl, fileUrl } = presign.data;

    const blob = await (await fetch(image.uri)).blob();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    });

    if (!uploadRes.ok) throw new Error('S3 upload failed');

    return fileUrl;
  };

  /* ================= VALIDATION ================= */

  const canSubmit = image && paymentMethod && finalPrice;

  const validatePrice = () => {
    if (!pricing) return false;
    const price = parseFloat(finalPrice);
    if (isNaN(price)) return false;
    if (price < pricing.base_price || price > pricing.premium_price) {
      Alert.alert(
        'Invalid Price',
        `Price must be between ₹${pricing.base_price} and ₹${pricing.premium_price}`
      );
      return false;
    }
    return true;
  };

  /* ================= SUBMIT ================= */

  const handleContinue = async () => {
    if (!canSubmit) {
      Alert.alert('Incomplete', 'Please complete all fields');
      return;
    }

    if (!validatePrice()) return;

    try {
      setLoading(true);

      // Upload image to S3
      const afterWashImageUrl = await uploadToS3(image);

      // Navigate to Payment Summary with data
      router.push({
        pathname: '/(tabs)/PaymentSummary',
        params: {
          jobId,
          afterWashImageUrl,
          paymentMethod,
          finalPrice: finalPrice,
        },
      });
    } catch (err) {
      console.error('Upload failed:', err);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        className="absolute w-full h-full"
      />

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
              onPress={() => router.back()}
              className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
            >
              <ArrowLeft size={24} color="#1E293B" />
            </Pressable>
            <Text className="text-xl font-heading tracking-tight text-clay-text">
              Job Completion
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="font-heading text-sm mb-6 text-clay-secondary">
            Take after-wash photo and complete payment details
          </Text>

          {/* AFTER WASH PHOTO */}
          <View className="mb-8">
            <Text className="font-label text-[10px] uppercase tracking-widest mb-2 ml-1 text-clay-secondary/80">
              After Wash Photo
            </Text>
            <Pressable
              className="h-[220px] clay-card border-none bg-white overflow-hidden justify-center items-center"
              onPress={openCamera}
            >
              {image ? (
                <Image source={{ uri: image.uri }} className="w-full h-full rounded-2xl" />
              ) : (
                <View className="items-center">
                  <View className="w-16 h-16 rounded-full bg-[#E0F2FE] items-center justify-center mb-4 shadow-sm border border-[#0EA5E9]/20">
                    <Camera size={32} color="#0EA5E9" />
                  </View>
                  <Text className="font-heading text-xs uppercase tracking-widest text-clay-secondary">
                    Take Photo
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* PAYMENT METHOD */}
          <View className="mb-8">
            <Text className="font-label text-[10px] uppercase tracking-widest mb-2 ml-1 text-clay-secondary/80">
              Payment Method
            </Text>
            <View className="clay-card px-2 bg-white border border-gray-100">
              <Picker
                selectedValue={paymentMethod}
                onValueChange={setPaymentMethod}
                style={{ height: 50 }}
                dropdownIconColor="#1E293B"
              >
                <Picker.Item label="Select Payment Method" value="" color="#94A3B8" />
                {PAYMENT_METHODS.map((method) => (
                  <Picker.Item key={method} label={method} value={method} color="#1E293B" />
                ))}
              </Picker>
            </View>
          </View>

          {/* PRICE SELECTION */}
          <View className="mb-8">
            <Text className="font-label text-[10px] uppercase tracking-widest mb-2 ml-1 text-clay-secondary/80">
              Service Price
            </Text>

            {loadingPricing ? (
              <ActivityIndicator size="small" color="#0EA5E9" />
            ) : pricing ? (
              <View>
                {/* PRICE INPUT */}
                <View className="clay-card flex-row items-center px-4 py-4 mb-3 bg-white border border-gray-100">
                  <Text className="text-xl font-heading mr-2 text-clay-text">₹</Text>
                  <TextInput
                    className="flex-1 text-xl font-heading text-[#0EA5E9]"
                    value={finalPrice}
                    onChangeText={setFinalPrice}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* RANGE INFO */}
                <Text className="text-[10px] font-bold uppercase tracking-wide mb-4 ml-1 text-clay-secondary/60">
                  Allowed Range: ₹{pricing.base_price} - ₹{pricing.premium_price}
                </Text>

                {/* QUICK SELECT CHIPS */}
                <View className="flex-row gap-3">
                  <Pressable
                    className="flex-1 py-3 rounded-xl border border-[#0EA5E9] bg-[#E0F2FE] items-center"
                    onPress={() => setFinalPrice(pricing.base_price.toString())}
                  >
                    <Text className="font-heading text-[11px] uppercase tracking-wide text-[#0EA5E9]">
                      Base: ₹{pricing.base_price}
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 py-3 rounded-xl border border-[#0EA5E9] bg-[#E0F2FE] items-center"
                    onPress={() => setFinalPrice(pricing.premium_price.toString())}
                  >
                    <Text className="font-heading text-[11px] uppercase tracking-wide text-[#0EA5E9]">
                      Premium: ₹{pricing.premium_price}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text className="font-heading text-[#EF4444]">Failed to load pricing</Text>
            )}
          </View>

          {/* CONTINUE BUTTON */}
          <Pressable
            className={`w-full py-5 rounded-[22px] shadow-lg shadow-blue-200 items-center mb-10 clay-button bg-[#0EA5E9] ${
              loading || !canSubmit ? 'opacity-50' : ''
            }`}
            disabled={loading || !canSubmit}
            onPress={handleContinue}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-heading text-[12px] tracking-widest uppercase">
                Continue to Summary
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
