import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { API } from '@/src/api/api';

// Topographic Pattern
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    className="absolute inset-0"
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/api/users/me');
      if (res.data.success) {
        const user = res.data.data;
        setName(user.full_name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAddress(user.address || '');
        if (user.profile_image) {
          setProfileImage(user.profile_image);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setInitialLoading(false);
    }
  };

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

      console.log('Sending update to API:', { full_name: name, profile_image: profileImage });

      let profileImageUrl = profileImage;

      // If image is a local URI (newly selected), upload it to S3
      if (profileImage && !profileImage.startsWith('http')) {
        console.log('Uploading image to S3...');

        // 1. Get presigned URL
        const presignRes = await API.post('/s3/presign', {
          fileType: 'image/jpeg',
          folder: 'profiles',
        });
        const { uploadUrl, fileUrl } = presignRes.data;

        // 2. Upload to S3
        const response = await fetch(profileImage);
        const blob = await response.blob();

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image to S3');
        }

        profileImageUrl = fileUrl;
      }

      const res = await API.patch('/api/supervisor/profile', {
        full_name: name,
        profile_image: profileImageUrl,
      });

      if (res.data.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        router.back();
      } else {
        Alert.alert('Error', res.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5F7FA]">
        <ActivityIndicator size="large" color="#4FB3D9" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7FA]">
      {/* HEADER */}
      <View className="h-[100px]">
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} className="flex-1 overflow-hidden">
          <TopoPattern />
          <View className="flex-row items-center justify-between px-5 pt-3 z-10">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 justify-center items-center"
            >
              <ArrowLeft size={24} color="#fff" />
            </Pressable>
            <Text className="text-xl font-antigravity-bold text-white">My Account</Text>
            <View className="w-10" />
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* PROFILE PHOTO */}
        <View className="items-center py-8">
          <View className="relative">
            <Image
              source={{ uri: profileImage }}
              className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg"
            />
            <Pressable
              className="absolute right-0 bottom-0 w-10 h-10 rounded-full bg-[#3DA2CE] justify-center items-center border-[3px] border-white shadow"
              onPress={showImageOptions}
            >
              <Camera size={18} color="#fff" />
            </Pressable>
          </View>
          <Text className="mt-3 text-[13px] text-[#6B7280] font-antigravity-medium">
            Tap to change photo
          </Text>
        </View>

        {/* FORM */}
        <View className="px-5">
          {/* NAME */}
          <View className="mb-5">
            <Text className="text-sm font-antigravity-bold text-[#4A4A4A] mb-2">Full Name</Text>
            <View className="flex-row items-center bg-white rounded-xl px-4 py-1 border border-[#E5E7EB] shadow-sm">
              <User size={18} color="#A0A0A0" className="mr-3" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#B0B0B0"
                className="flex-1 text-[15px] font-antigravity-medium text-[#2C2C2C] py-3"
              />
            </View>
          </View>

          {/* EMAIL */}
          <View className="mb-5">
            <Text className="text-sm font-antigravity-bold text-[#4A4A4A] mb-2">
              Email Address{' '}
              <Text className="text-[#9CA3AF] text-[11px] font-antigravity-medium">
                (cannot be changed)
              </Text>
            </Text>
            <View className="flex-row items-center bg-[#F3F4F6] rounded-xl px-4 py-1 border border-[#E5E7EB]">
              <Mail size={18} color="#A0A0A0" className="mr-3" />
              <TextInput
                value={email}
                placeholder="Enter your email"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
                className="flex-1 text-[15px] font-antigravity-medium text-[#9CA3AF] py-3"
              />
            </View>
          </View>

          {/* PHONE */}
          <View className="mb-5">
            <Text className="text-sm font-antigravity-bold text-[#4A4A4A] mb-2">Phone Number</Text>
            <View className="flex-row items-center bg-white rounded-xl px-4 py-1 border border-[#E5E7EB] shadow-sm">
              <Phone size={18} color="#A0A0A0" className="mr-3" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                placeholderTextColor="#B0B0B0"
                keyboardType="phone-pad"
                className="flex-1 text-[15px] font-antigravity-medium text-[#2C2C2C] py-3"
              />
            </View>
          </View>

          {/* ADDRESS */}
          <View className="mb-5">
            <Text className="text-sm font-antigravity-bold text-[#4A4A4A] mb-2">Address</Text>
            <View className="flex-row items-center bg-white rounded-xl px-4 py-1 border border-[#E5E7EB] shadow-sm">
              <MapPin size={18} color="#A0A0A0" className="mr-3" />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor="#B0B0B0"
                multiline
                className="flex-1 text-[15px] font-antigravity-medium text-[#2C2C2C] py-3 min-h-[44px]"
              />
            </View>
          </View>
        </View>

        {/* SAVE BUTTON */}
        <View className="px-5 mt-3">
          <Pressable
            className={`flex-row items-center justify-center py-4 rounded-xl gap-2 shadow-lg ${loading ? 'bg-[#4FB3D9] opacity-60' : 'bg-[#4FB3D9]'}`}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text className="text-white text-base font-antigravity-bold">Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
