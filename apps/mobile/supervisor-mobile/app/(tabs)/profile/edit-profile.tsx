import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, ArrowLeft, Save, Mail, User, Phone, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';

// Topographic Pattern
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    style={StyleSheet.absoluteFillObject}
    viewBox="0 0 400 200"
    preserveAspectRatio="xMidYMid slice"
  >
    <Path
      d="M 0 50 Q 50 30, 100 50 T 200 50 T 300 50 T 400 50"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 70 Q 50 55, 100 70 T 200 70 T 300 70 T 400 70"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />
    <Circle cx="320" cy="60" r="25" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
    <Circle cx="320" cy="60" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
  </Svg>
);

export default function MyAccountScreen() {
  const [profileImage, setProfileImage] = useState('https://i.pravatar.cc/300?img=12');
  const [name, setName] = useState('MUHD YASIR');
  const [email, setEmail] = useState('yasir@email.com');
  const [phone, setPhone] = useState('+1 234 567 8900');
  const [address, setAddress] = useState('123 Main Street, City');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your photo.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // TODO: Add your API call here to save the profile data
      // Example:
      // await api.put('/api/profile', { name, email, phone, address, profileImage });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} style={styles.header}>
          <TopoPattern />
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>My Account</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* PROFILE PHOTO */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profileImage }} style={styles.avatar} />
            <Pressable style={styles.cameraButton} onPress={showImageOptions}>
              <Camera size={18} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.photoText}>Tap to change photo</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={18} color="#A0A0A0" style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#B0B0B0"
                style={styles.input}
              />
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color="#A0A0A0" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          {/* PHONE */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={18} color="#A0A0A0" style={styles.inputIcon} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor="#B0B0B0"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </View>

          {/* ADDRESS */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputContainer}>
              <MapPin size={18} color="#A0A0A0" style={styles.inputIcon} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor="#B0B0B0"
                multiline
                style={[styles.input, { minHeight: 44 }]}
              />
            </View>
          </View>
        </View>

        {/* SAVE BUTTON */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  headerContainer: {
    height: 100,
  },

  header: {
    flex: 1,
    overflow: 'hidden',
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 10,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  scrollView: {
    flex: 1,
  },

  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  avatarContainer: {
    position: 'relative',
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3DA2CE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#3DA2CE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  photoText: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  form: {
    paddingHorizontal: 20,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#2C2C2C',
    paddingVertical: 12,
  },

  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },

  saveButton: {
    backgroundColor: '#4FB3D9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3DA2CE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
