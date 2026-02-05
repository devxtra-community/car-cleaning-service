import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IndianRupee, AlertCircle, FileText } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PenaltyDetailsScreen() {
  const { workerId } = useLocalSearchParams();

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Add Penalty</Text>
        <Text style={styles.subtitle}>Worker ID: {workerId}</Text>

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
        <Pressable style={styles.submitButton}>
          <Text style={styles.submitText}>Add Penalty</Text>
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
