import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Camera, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import axios from 'axios';
import { API } from '../../src/api/api';

/* ================= TYPES ================= */

interface FieldProps {
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
}

interface LabelProps {
  title: string;
}

/* ================= COMPONENT ================= */

export default function AddJob() {
  const [image, setImage] = useState<ImagePickerAsset | null>(null);

  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carType, setCarType] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD VEHICLE TYPES ================= */

  useEffect(() => {
    const init = async () => {
      try {
        const res = await API.get('/api/vehicle/allVehicles');
        const raw = res.data.data as { type: string }[];
        const unique = [...new Set(raw.map((v) => v.type))];
        setTypes(unique);
      } catch {
        Alert.alert('Failed to load vehicles');
      }
    };

    init();
  }, []);

  /* ================= CAMERA ================= */

  const openCamera = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return;

    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled) setImage(res.assets[0]);
  };

  /* ================= S3 UPLOAD ================= */

  const uploadToS3 = async (image: ImagePickerAsset): Promise<string> => {
    const presign = await API.post('/s3/presign', {
      fileType: 'image/jpeg',
    });

    const { uploadUrl, fileUrl } = presign.data;

    const blob = await (await fetch(image.uri)).blob();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: blob,
    });

    if (!uploadRes.ok) {
      throw new Error('S3 upload failed');
    }

    return fileUrl;
  };

  const canSubmit =
    image && ownerName && ownerPhone && carNumber && carModel && carColor && carType;

  /* ================= SUBMIT ================= */

  const confirm = async () => {
    if (!canSubmit) return Alert.alert('Please fill all fields');

    Alert.alert('Confirm Submission', 'Submit this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            setLoading(true);
            if (!image) return;

            const imageUrl = await uploadToS3(image);

            await API.post('/tasks', {
              owner_name: ownerName,
              owner_phone: ownerPhone,
              car_number: carNumber,
              car_model: carModel,
              car_color: carColor,
              car_type: carType,
              car_image_url: imageUrl,
            });

            Alert.alert('Success', 'Job Added Successfully');

            setImage(null);
            setOwnerName('');
            setOwnerPhone('');
            setCarNumber('');
            setCarModel('');
            setCarColor('');
            setCarType('');

            router.replace('/(tabs)/Homepage');
          } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
              console.log('UPLOAD ERROR:', err.response?.data);
            } else {
              console.log('UNKNOWN ERROR:', err);
            }

            Alert.alert('Upload failed');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <LinearGradient colors={['#fff', '#fff']} style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ArrowLeft color="black" />
          </Pressable>
        </LinearGradient>

        <ScrollView style={styles.container}>
          <Pressable style={styles.uploadBox} onPress={openCamera}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.preview} />
            ) : (
              <>
                <Camera size={36} color="#bbb" />
                <Text style={{ color: '#bbb' }}>Add Photo of Car</Text>
              </>
            )}
          </Pressable>

          <Field placeholder="Owner Name" value={ownerName} onChange={setOwnerName} />
          <Label title="Phone Number" />
          <Field placeholder="Owner Number" value={ownerPhone} onChange={setOwnerPhone} />
          <Label title="Vehicle Number" />
          <Field placeholder="Vehicle Number" value={carNumber} onChange={setCarNumber} />
          <Label title="Car Model" />
          <Field placeholder="" value={carModel} onChange={setCarModel} />

          <View style={styles.row}>
            <View style={styles.pill}>
              <TextInput
                style={styles.pillInput}
                placeholder="Color"
                value={carColor}
                onChangeText={setCarColor}
              />
            </View>

            <View style={styles.pill}>
              <Picker selectedValue={carType} onValueChange={setCarType}>
                <Picker.Item label="Type" value="" />
                {types.map((t) => (
                  <Picker.Item key={t} label={t} value={t} />
                ))}
              </Picker>
            </View>
          </View>

          <Pressable style={styles.submitBtn} disabled={loading} onPress={confirm}>
            <Text style={styles.submitText}>
              {loading ? 'Submitting...' : 'Confirm & Submit Job'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= SMALL COMPONENTS ================= */

function Field({ placeholder, value, onChange }: FieldProps) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
    />
  );
}

function Label({ title }: LabelProps) {
  return <Text style={styles.label}>{title}</Text>;
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: { padding: 20 },
  container: { paddingHorizontal: 20, backgroundColor: '#fff' },

  uploadBox: {
    height: 180,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },

  preview: { width: '100%', height: '100%', borderRadius: 16 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  label: { fontSize: 12, color: '#666', marginBottom: 4 },

  row: { flexDirection: 'row', gap: 10 },

  pill: { flex: 1, backgroundColor: '#f2f2f2', borderRadius: 12 },

  pillInput: { height: 48, paddingHorizontal: 12 },

  submitBtn: {
    height: 55,
    backgroundColor: '#1B86C6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },

  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
