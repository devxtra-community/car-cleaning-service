import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient as _LinearGradient } from 'expo-linear-gradient';
const LinearGradient = _LinearGradient as any;
import api from '../../src/api/api';
import { useTheme } from '../../contexts/ThemeContext';

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

  // Reset state when a new job is loaded (since tab screens preserve state)
  React.useEffect(() => {
    setCompleted(false);
    setLoading(false);
  }, [jobId]);

  // QR code data - Web URL for review page
  const qrData = `http://10.10.3.21:5173/review/${jobId}`;

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
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <View className="p-6">
          <Pressable
            onPress={() => !loading && router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
          >
            <ArrowLeft color="#1E293B" size={24} />
          </Pressable>
        </View>

        <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
          <Text className="text-3xl font-heading mb-2 text-clay-text">Payment Summary</Text>
          <Text className="font-heading text-sm mb-8 text-clay-secondary">
            Review details and complete the job
          </Text>

          {/* PAYMENT DETAILS CARD */}
          <View className="clay-card p-6 mb-6 bg-white relative overflow-hidden">
            <LinearGradient
              colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
            <View className="flex-row justify-between items-center mb-5 pb-5 border-b border-gray-100">
              <Text className="font-label uppercase tracking-wide text-clay-secondary/80 text-[10px]">
                Payment Method
              </Text>
              <Text className="font-heading text-lg text-clay-text">{paymentMethod}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="font-label uppercase tracking-wide text-clay-secondary/80 text-[10px]">
                Amount Charged
              </Text>
              <Text className="text-4xl font-heading text-[#0EA5E9]">₹{finalPrice.toFixed(2)}</Text>
            </View>
          </View>

          {/* QR CODE SECTION */}
          <View className="clay-card p-8 items-center mb-6 bg-[#E0F2FE] border border-[#0EA5E9]/20 shadow-blue-200">
            <Text className="font-heading text-xl mb-2 text-[#0369A1]">Customer Review</Text>
            <Text className="text-center mb-6 font-body text-sm font-bold text-[#0EA5E9]">
              Ask customer to scan this QR code to rate your service
            </Text>

            <View className="p-4 rounded-[24px] bg-white shadow-sm border border-white">
              <QRCode value={qrData} size={180} color="#0284C7" backgroundColor="white" />
            </View>

            <Text className="font-label mt-6 text-center uppercase tracking-widest text-[#0369A1] text-[10px]">
              Scan to review worker performance
            </Text>
          </View>

          {/* SUCCESS INDICATOR */}
          {completed && (
            <View className="border border-[#10B981] bg-[#ECFDF5] rounded-2xl p-4 flex-row items-center mb-6">
              <CheckCircle size={24} color="#10B981" />
              <Text className="font-bold ml-3 text-[#065F46]">Job completed successfully!</Text>
            </View>
          )}

          {/* COMPLETE JOB BUTTON */}
          <Pressable
            className={`h-[64px] rounded-[24px] justify-center items-center mb-8 shadow-lg shadow-blue-200 clay-button bg-[#0EA5E9] ${
              loading || completed ? 'opacity-70' : ''
            }`}
            disabled={loading || completed}
            onPress={handleCompleteJob}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-sm font-heading uppercase tracking-widest">
                {completed ? 'Job Completed ✓' : 'Complete Job'}
              </Text>
            )}
          </Pressable>

          <Text className="text-[10px] text-center mb-8 px-4 font-medium text-clay-secondary/60">
            By completing this job, you confirm that the service has been provided and payment has
            been collected using the selected method.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}
