import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IndianRupee, AlertCircle, FileText } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '@/src/api/api';

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

      const res = await api.post('/api/supervisor/penalties', payload);

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Add Penalty</Text>
        <Text style={styles.subtitle}>Worker ID: {String(workerId).substring(0, 8)}...</Text>

        {/* AMOUNT */}
        <View style={styles.inputRow}>
          <IndianRupee size={18} color="#6B7280" />
          <TextInput
            placeholder="Penalty amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
          />
        </View>

        {/* REASON */}
        <View style={styles.inputRow}>
          <AlertCircle size={18} color="#6B7280" />
          <TextInput
            placeholder="Reason"
            value={reason}
            onChangeText={setReason}
            style={styles.input}
          />
        </View>

        {/* NOTE */}
        <View style={styles.noteBox}>
          <FileText size={18} color="#6B7280" />
          <TextInput
            placeholder="Optional note"
            value={note}
            onChangeText={setNote}
            multiline
            style={styles.noteInput}
          />
        </View>

        {/* SUBMIT */}
        <Pressable
          style={[styles.submitButton, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Add Penalty</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  noteInput: {
    flex: 1,
    minHeight: 80,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
