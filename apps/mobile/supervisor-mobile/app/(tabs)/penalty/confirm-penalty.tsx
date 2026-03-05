import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IndianRupee, AlertCircle, FileText } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { API } from '@/src/api/api';

export default function PenaltyDetailsScreen() {
  const { workerId } = useLocalSearchParams();

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !reason) {
      Alert.alert('Error', 'Please enter amount and reason');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        worker_id: workerId,
        amount: parseFloat(amount),
        reason: note ? `${reason} - ${note}` : reason,
      };

      const res = await API.post('/api/supervisor/penalties', payload);

      if (res.data.success) {
        Alert.alert('Success', 'Penalty added successfully', [
          { text: 'OK', onPress: () => router.navigate('/(tabs)') },
        ]);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to add penalty');
      }
    } catch (error: unknown) {
      console.error('Add penalty error', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to add penalty. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="p-5">
        <Text className="text-2xl font-antigravity-bold text-[#1E293B] mb-1">Add Penalty</Text>
        <Text className="text-xs text-[#6B7280] font-antigravity-medium mb-5">
          Worker ID: {String(workerId).substring(0, 8)}...
        </Text>

        {/* AMOUNT */}
        <View className="flex-row items-center bg-white rounded-2xl px-3 py-3 gap-2.5 mb-3 shadow-md border border-white">
          <IndianRupee size={18} color="#6B7280" />
          <TextInput
            placeholder="Penalty amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            className="flex-1 text-sm font-antigravity-medium"
          />
        </View>

        {/* REASON */}
        <View className="flex-row items-center bg-white rounded-2xl px-3 py-3 gap-2.5 mb-3 shadow-md border border-white">
          <AlertCircle size={18} color="#6B7280" />
          <TextInput
            placeholder="Reason"
            value={reason}
            onChangeText={setReason}
            className="flex-1 text-sm font-antigravity-medium"
          />
        </View>

        {/* NOTE */}
        <View className="flex-row items-start bg-white rounded-2xl p-3 gap-2.5 mb-5 shadow-md border border-white">
          <FileText size={18} color="#6B7280" />
          <TextInput
            placeholder="Optional note"
            value={note}
            onChangeText={setNote}
            multiline
            className="flex-1 min-h-[80px] text-sm font-antigravity-medium"
            textAlignVertical="top"
          />
        </View>

        {/* SUBMIT */}
        <Pressable
          className={`h-14 rounded-[18px] items-center justify-center bg-[#EF4444] shadow-lg shadow-red-500/30 ${submitting ? 'opacity-70' : ''}`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white text-base font-antigravity-bold">Add Penalty</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
