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
  const { colors } = useTheme();
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
        className="flex-1 justify-center items-center"
        style={{ paddingTop: insets.top, backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 font-bold" style={{ color: colors.textSecondary }}>
          Loading details...
        </Text>
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
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="p-5">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft color={colors.text} size={24} />
          </Pressable>
        </View>

        <ScrollView className="px-5" style={{ backgroundColor: colors.background }}>
          <Text className="text-3xl font-black mb-2 tracking-tight" style={{ color: colors.text }}>
            Job Completion
          </Text>
          <Text className="font-bold text-sm mb-8" style={{ color: colors.textSecondary }}>
            Take after-wash photo and complete payment details
          </Text>

          {/* AFTER WASH PHOTO */}
          <Text
            className="font-bold text-[11px] uppercase tracking-widest mb-2"
            style={{ color: colors.textSecondary }}
          >
            After Wash Photo
          </Text>
          <Pressable
            className="h-[220px] border-2 border-dashed rounded-2xl justify-center items-center mb-8"
            style={{ borderColor: colors.border, backgroundColor: colors.cardBackground }}
            onPress={openCamera}
          >
            {image ? (
              <Image source={{ uri: image.uri }} className="w-full h-full rounded-2xl" />
            ) : (
              <>
                <Camera size={48} color={colors.primary} />
                <Text
                  className="mt-3 font-bold text-xs uppercase tracking-widest"
                  style={{ color: colors.textTertiary }}
                >
                  Take After Wash Photo
                </Text>
              </>
            )}
          </Pressable>

          {/* PAYMENT METHOD */}
          <Text
            className="font-bold text-[11px] uppercase tracking-widest mb-2"
            style={{ color: colors.textSecondary }}
          >
            Payment Method
          </Text>
          <View
            className="rounded-xl mb-8 border"
            style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
          >
            <Picker
              selectedValue={paymentMethod}
              onValueChange={setPaymentMethod}
              style={{ height: 50, color: colors.text }}
              dropdownIconColor={colors.text}
            >
              <Picker.Item label="Select Payment Method" value="" color={colors.textTertiary} />
              {PAYMENT_METHODS.map((method) => (
                <Picker.Item key={method} label={method} value={method} color={colors.text} />
              ))}
            </Picker>
          </View>

          {/* PRICE SELECTION */}
          <Text
            className="font-bold text-[11px] uppercase tracking-widest mb-2"
            style={{ color: colors.textSecondary }}
          >
            Service Price
          </Text>
          {loadingPricing ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : pricing ? (
            <View className="mb-8">
              {/* PRICE INPUT */}
              <View
                className="flex-row items-center rounded-xl px-4 py-4 mb-3 border"
                style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
              >
                <Text className="text-xl font-bold mr-2" style={{ color: colors.textSecondary }}>
                  ₹
                </Text>
                <TextInput
                  className="flex-1 text-xl font-black"
                  style={{ color: colors.primary }}
                  value={finalPrice}
                  onChangeText={setFinalPrice}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* RANGE INFO */}
              <Text
                className="text-[10px] font-bold uppercase tracking-wide mb-4 ml-1"
                style={{ color: colors.textTertiary }}
              >
                Allowed Range: ₹{pricing.base_price} - ₹{pricing.premium_price}
              </Text>

              {/* QUICK SELECT CHIPS */}
              <View className="flex-row gap-3">
                <Pressable
                  className="px-5 py-3 rounded-full border"
                  style={{ backgroundColor: colors.primaryLight, borderColor: colors.primary }}
                  onPress={() => setFinalPrice(pricing.base_price.toString())}
                >
                  <Text
                    className="font-bold text-[11px] uppercase tracking-wide"
                    style={{ color: colors.primary }}
                  >
                    Base: ₹{pricing.base_price}
                  </Text>
                </Pressable>
                <Pressable
                  className="px-5 py-3 rounded-full border"
                  style={{ backgroundColor: colors.primaryLight, borderColor: colors.primary }}
                  onPress={() => setFinalPrice(pricing.premium_price.toString())}
                >
                  <Text
                    className="font-bold text-[11px] uppercase tracking-wide"
                    style={{ color: colors.primary }}
                  >
                    Premium: ₹{pricing.premium_price}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text className="mb-5 font-bold" style={{ color: colors.danger }}>
              Failed to load pricing
            </Text>
          )}

          {/* CONTINUE BUTTON */}
          <Pressable
            className={`py-5 rounded-xl justify-center items-center mb-10 shadow-lg ${
              loading || !canSubmit ? 'opacity-50' : ''
            }`}
            style={{
              backgroundColor: loading || !canSubmit ? colors.border : colors.primary,
              shadowColor: colors.primary,
              shadowOpacity: 0.3,
            }}
            disabled={loading || !canSubmit}
            onPress={handleContinue}
          >
            <Text className="text-white text-[12px] font-black uppercase tracking-widest">
              {loading ? 'Uploading...' : 'Continue to Summary'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
