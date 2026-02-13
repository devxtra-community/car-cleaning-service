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
import { Picker } from '@react-native-picker/picker';
import { Camera, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../src/api/api';

/* ================= TYPES ================= */

interface PricingData {
  base_price: number;
  premium_price: number;
  wash_time: number;
}

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

/* ================= COMPONENT ================= */

export default function AfterWash() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  const carType = params.carType as string;

  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [finalPrice, setFinalPrice] = useState<string>(''); // Keep as string for input handling
  const [loading, setLoading] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(true);

  /* ================= PARAMS & VALIDATION ================= */

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
        className="flex-1 bg-white justify-center items-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#1B86C6" />
        <Text className="mt-4 text-gray-500">Loading details...</Text>
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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="p-5">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft color="black" />
          </Pressable>
        </View>

        <ScrollView className="px-5 bg-white">
          <Text className="text-2xl font-bold mb-2">Job Completion</Text>
          <Text className="text-gray-600 mb-6">
            Take after-wash photo and complete payment details
          </Text>

          {/* AFTER WASH PHOTO */}
          <Text className="font-semibold mb-2">After Wash Photo</Text>
          <Pressable
            className="h-[200px] border border-dashed border-[#bbb] rounded-2xl justify-center items-center mb-5"
            onPress={openCamera}
          >
            {image ? (
              <Image source={{ uri: image.uri }} className="w-full h-full rounded-2xl" />
            ) : (
              <>
                <Camera size={40} color="#bbb" />
                <Text className="text-[#bbb] mt-2">Take After Wash Photo</Text>
              </>
            )}
          </Pressable>

          {/* PAYMENT METHOD */}
          <Text className="font-semibold mb-2">Payment Method</Text>
          <View className="bg-[#f2f2f2] rounded-xl mb-5">
            <Picker
              selectedValue={paymentMethod}
              onValueChange={setPaymentMethod}
              style={{ height: 50 }}
            >
              <Picker.Item label="Select Payment Method" value="" />
              {PAYMENT_METHODS.map((method) => (
                <Picker.Item key={method} label={method} value={method} />
              ))}
            </Picker>
          </View>

          {/* PRICE SELECTION */}
          <Text className="font-semibold mb-2">Service Price</Text>
          {loadingPricing ? (
            <ActivityIndicator size="large" color="#1B86C6" />
          ) : pricing ? (
            <View className="mb-6">
              {/* PRICE INPUT */}
              <View className="flex-row items-center bg-[#f6f8fb] rounded-xl px-4 py-3 mb-3 border border-gray-200">
                <Text className="text-gray-500 text-lg mr-2">₹</Text>
                <TextInput
                  className="flex-1 text-lg font-semibold text-[#1B86C6]"
                  value={finalPrice}
                  onChangeText={setFinalPrice}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                />
              </View>

              {/* RANGE INFO */}
              <Text className="text-xs text-gray-500 mb-3 ml-1">
                Allowed Range: ₹{pricing.base_price} - ₹{pricing.premium_price}
              </Text>

              {/* QUICK SELECT CHIPS */}
              <View className="flex-row gap-2">
                <Pressable
                  className="bg-[#1B86C6]/10 px-4 py-2 rounded-full border border-[#1B86C6]/20"
                  onPress={() => setFinalPrice(pricing.base_price.toString())}
                >
                  <Text className="text-[#1B86C6] font-medium text-xs">
                    Base: ₹{pricing.base_price}
                  </Text>
                </Pressable>
                <Pressable
                  className="bg-[#1B86C6]/10 px-4 py-2 rounded-full border border-[#1B86C6]/20"
                  onPress={() => setFinalPrice(pricing.premium_price.toString())}
                >
                  <Text className="text-[#1B86C6] font-medium text-xs">
                    Premium: ₹{pricing.premium_price}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text className="text-red-500 mb-5">Failed to load pricing</Text>
          )}

          {/* CONTINUE BUTTON */}
          <Pressable
            className={`h-[55px] rounded-xl justify-center items-center mb-8 ${
              loading || !canSubmit ? 'bg-[#bbb]' : 'bg-[#1B86C6]'
            }`}
            disabled={loading || !canSubmit}
            onPress={handleContinue}
          >
            <Text className="text-white text-base font-semibold">
              {loading ? 'Uploading...' : 'Continue to Summary'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
