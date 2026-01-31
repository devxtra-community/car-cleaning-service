import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Camera, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const API = axios.create({
  baseURL: 'http://10.10.2.230:3033',
});

interface FieldProps {
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
}

interface LabelProps {
  title: string;
}

export default function AddJob() {
  const [image, setImage] = useState<ImagePickerAsset | null>(null);

  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [carType, setCarType] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [workerId, setWorkerId] = useState('');

  // ✅ Animated value WITHOUT refs (ESLint safe)
  const [slideX] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const init = async () => {
      try {
        const u = await AsyncStorage.getItem('user');
        if (u) setWorkerId(JSON.parse(u).id);

        const token = await AsyncStorage.getItem('token');

        const res = await API.get('/api/vehicle/allVehicles', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const vehicleTypes: string[] = [
          ...new Set((res.data.data as { type: string }[]).map((v) => v.type)),
        ];

        setTypes(vehicleTypes);
      } catch (error: unknown) {
        console.log(error);
        Alert.alert('Failed to load initial data');
      }
    };

    init();
  }, []);

  const openCamera = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return;

    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setImage(res.assets[0]);
  };

  const canSubmit =
    image && ownerName && ownerPhone && carNumber && carModel && carColor && carType && workerId;

  const confirm = () => {
    if (!canSubmit) return Alert.alert('Fill all fields');

    Animated.timing(slideX, {
      toValue: width - 120,
      duration: 300,
      useNativeDriver: true,
    }).start(upload);
  };

  const upload = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!image?.uri) {
      Alert.alert('Please select image');
      return;
    }

    const form = new FormData();

    form.append('car_image', {
      uri: image.uri,
      name: 'car.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    form.append('owner_name', ownerName);
    form.append('owner_phone', ownerPhone);
    form.append('car_number', carNumber);
    form.append('car_model', carModel);
    form.append('car_color', carColor);
    form.append('car_type', carType);
    form.append('worker_id', workerId);

    await API.post('/api/tasks/tasks', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    Alert.alert('Job Added Successfully');
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#4FB3E8', '#3DA2CE']} style={styles.header}>
        <ArrowLeft color="#fff" />
      </LinearGradient>

      <ScrollView style={styles.container}>
        <Pressable style={styles.uploadBox} onPress={openCamera}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} />
          ) : (
            <>
              <Camera size={36} color="#bbb" />
              <Text style={{ color: '#bbb' }}>Add Photo</Text>
            </>
          )}
        </Pressable>

        <Field placeholder="Enter Owner Name" value={ownerName} onChange={setOwnerName} />

        <Label title="Phone Number" />
        <Field placeholder="Enter Owner Number" value={ownerPhone} onChange={setOwnerPhone} />

        <Label title="Vehicle Number" />
        <Field placeholder="Enter vehicle Number" value={carNumber} onChange={setCarNumber} />

        <Label title="Car Model Name *" />
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
            <Picker selectedValue={carType} onValueChange={setCarType} style={styles.picker}>
              <Picker.Item label="Type" value="" />
              {types.map((t, i) => (
                <Picker.Item key={i} label={t} value={t} />
              ))}
            </Picker>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.slider, !canSubmit && { opacity: 0.4 }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: slideX }] }]}>
          <Pressable onPress={confirm}>
            <Text style={{ color: '#fff' }}>➜</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.slideText}>Slide To Confirm</Text>
      </View>
    </View>
  );
}

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

const styles = StyleSheet.create({
  header: {
    height: 120,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  uploadBox: {
    height: 150,
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
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pill: {
    width: '48%',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  pillInput: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  picker: {
    height: 48,
  },
  slider: {
    height: 60,
    backgroundColor: '#d0d0d0',
    margin: 20,
    borderRadius: 40,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1B86C6',
    justifyContent: 'center',
    alignItems: 'center',
    left: 5,
  },
  slideText: {
    textAlign: 'center',
    color: '#444',
  },
});
