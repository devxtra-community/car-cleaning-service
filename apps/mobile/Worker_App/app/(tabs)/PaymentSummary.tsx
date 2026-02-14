import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

/* ================= COMPONENT ================= */

export default function PaymentSummary() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const jobId = params.jobId as string;
  const afterWashImageUrl = params.afterWashImageUrl as string;
  const paymentMethod = params.paymentMethod as string;
  const finalPriceParam = parseFloat(params.finalPrice as string);
  const finalPrice = isNaN(finalPriceParam) ? 0 : finalPriceParam;

  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // QR code data - deep link to review page
  const qrData = `carwash://review/${jobId}`;

  /* ================= COMPLETE JOB ================= */

  const handleCompleteJob = async () => {
    try {
      setLoading(true);

      // Call complete task endpoint with all data
      await api.patch(`/tasks/${jobId}/complete`, {
        after_wash_image_url: afterWashImageUrl,
        payment_method: paymentMethod,
        final_price: finalPrice,
      });

      setCompleted(true);

      // Show success and navigate back after delay
      setTimeout(() => {
        Alert.alert('Job Completed!', 'The job has been marked as completed successfully.', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/Homepage'),
          },
        ]);
      }, 500);
    } catch (err) {
      console.error('Complete job error:', err);
      Alert.alert('Error', 'Failed to complete job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
      <View className="p-6">
        <Pressable
          onPress={() => !loading && router.back()}
          className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <ArrowLeft color={colors.text} size={24} />
        </Pressable>
      </View>

      <ScrollView className="px-6">
        <Text className="text-3xl font-black mb-2 tracking-tight" style={{ color: colors.text }}>
          Payment Summary
        </Text>
        <Text className="text-base font-medium mb-8" style={{ color: colors.textSecondary }}>
          Review details and complete the job
        </Text>

        {/* PAYMENT DETAILS CARD */}
        <View
          className="rounded-[32px] p-6 mb-6 shadow-sm border"
          style={{ backgroundColor: colors.cardBackground, borderColor: colors.border }}
        >
          <View
            className="flex-row justify-between items-center mb-5 pb-5 border-b"
            style={{ borderBottomColor: colors.borderLight }}
          >
            <Text
              className="font-bold text-[12px] uppercase tracking-wide"
              style={{ color: colors.textTertiary }}
            >
              Payment Method
            </Text>
            <Text className="font-black text-lg" style={{ color: colors.text }}>
              {paymentMethod}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              className="font-bold text-[12px] uppercase tracking-wide"
              style={{ color: colors.textTertiary }}
            >
              Amount Charged
            </Text>
            <Text className="text-4xl font-black" style={{ color: colors.primary }}>
              ₹{finalPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* QR CODE SECTION */}
        <View
          className="rounded-[32px] p-8 items-center mb-6 border"
          style={{ backgroundColor: colors.primaryLight, borderColor: colors.primary }}
        >
          <Text className="font-black text-xl mb-2" style={{ color: colors.primaryDark }}>
            Customer Review
          </Text>
          <Text className="text-center mb-6 text-sm font-bold" style={{ color: colors.primary }}>
            Ask customer to scan this QR code to rate your service
          </Text>

          <View className="p-6 rounded-[24px] shadow-sm" style={{ backgroundColor: 'white' }}>
            <QRCode value={qrData} size={200} color={colors.primary} backgroundColor="white" />
          </View>

          <Text
            className="text-[10px] font-bold mt-4 text-center uppercase tracking-widest"
            style={{ color: colors.primary }}
          >
            Scan to review worker performance
          </Text>
        </View>

        {/* SUCCESS INDICATOR */}
        {completed && (
          <View
            className="border rounded-2xl p-4 flex-row items-center mb-6"
            style={{ backgroundColor: colors.successLight, borderColor: colors.success }}
          >
            <CheckCircle size={24} color={colors.success} />
            <Text className="font-bold ml-3" style={{ color: colors.success }}>
              Job completed successfully!
            </Text>
          </View>
        )}

        {/* COMPLETE JOB BUTTON */}
        <Pressable
          className="h-[64px] rounded-[24px] justify-center items-center mb-8 shadow-md"
          style={{
            backgroundColor: loading || completed ? colors.border : colors.primary,
            opacity: loading || completed ? 0.7 : 1,
          }}
          disabled={loading || completed}
          onPress={handleCompleteJob}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-black uppercase tracking-widest">
              {completed ? 'Job Completed ✓' : 'Complete Job'}
            </Text>
          )}
        </Pressable>

        <Text
          className="text-[10px] text-center mb-8 px-4 font-medium"
          style={{ color: colors.textTertiary }}
        >
          By completing this job, you confirm that the service has been provided and payment has
          been collected using the selected method.
        </Text>
      </ScrollView>
    </View>
  );
}
