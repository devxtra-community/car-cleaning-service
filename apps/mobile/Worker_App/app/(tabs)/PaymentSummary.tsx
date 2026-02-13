import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import api from '../../src/api/api';

/* ================= COMPONENT ================= */

export default function PaymentSummary() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="p-5">
        <Pressable onPress={() => !loading && router.back()}>
          <ArrowLeft color="black" />
        </Pressable>
      </View>

      <ScrollView className="px-5">
        <Text className="text-2xl font-bold mb-2">Payment Summary</Text>
        <Text className="text-gray-600 mb-6">Review details and complete the job</Text>

        {/* PAYMENT DETAILS CARD */}
        <View className="bg-white border border-gray-200 rounded-3xl p-5 mb-5 shadow-sm">
          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
            <Text className="text-gray-500">Payment Method</Text>
            <Text className="font-semibold text-base">{paymentMethod}</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-500">Amount Charged</Text>
            <Text className="text-3xl font-bold text-[#1B86C6]">₹{finalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* QR CODE SECTION */}
        <View className="bg-gradient-to-b from-[#1B86C6]/10 to-white border border-[#1B86C6]/20 rounded-3xl p-6 items-center mb-5">
          <Text className="font-bold text-lg mb-2">Customer Review</Text>
          <Text className="text-gray-600 text-center mb-4 text-sm">
            Ask customer to scan this QR code to rate your service
          </Text>

          <View className="bg-white p-5 rounded-2xl shadow-md">
            <QRCode value={qrData} size={200} color="#1B86C6" backgroundColor="white" />
          </View>

          <Text className="text-xs text-gray-400 mt-3 text-center">
            Scan to review worker performance
          </Text>
        </View>

        {/* SUCCESS INDICATOR */}
        {completed && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center mb-5">
            <CheckCircle size={24} color="#10b981" />
            <Text className="text-green-700 font-semibold ml-3">Job completed successfully!</Text>
          </View>
        )}

        {/* COMPLETE JOB BUTTON */}
        <Pressable
          className={`h-[55px] rounded-xl justify-center items-center mb-8 ${
            loading || completed ? 'bg-[#bbb]' : 'bg-[#1B86C6]'
          }`}
          disabled={loading || completed}
          onPress={handleCompleteJob}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {completed ? 'Job Completed ✓' : 'Complete Job'}
            </Text>
          )}
        </Pressable>

        <Text className="text-xs text-gray-400 text-center mb-6">
          By completing this job, you confirm that the service has been provided and payment has
          been collected using the selected method.
        </Text>
      </ScrollView>
    </View>
  );
}
