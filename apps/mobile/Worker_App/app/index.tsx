import React, { useState } from 'react';
import api from '@/src/api/api';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Checkbox from 'expo-checkbox';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { saveTokens } from '@/src/api/tokenStorage';

const { height, width } = Dimensions.get('window');

// Topographic Pattern
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    className="absolute inset-0"
    viewBox="0 0 400 500"
    preserveAspectRatio="xMidYMid slice"
  >
    <Path
      d="M 0 80 Q 50 60, 100 80 T 200 80 T 300 80 T 400 80"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 120 Q 50 110, 100 120 T 200 120 T 300 120 T 400 120"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />

    <Circle cx="320" cy="100" r="30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
    <Circle cx="320" cy="100" r="45" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" />
    <Circle cx="320" cy="100" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />

    <Path
      d="M 60 180 Q 40 160, 60 140 Q 80 120, 100 140 Q 120 160, 100 180 Q 80 200, 60 180 Z"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 50 180 Q 28 160, 50 135 Q 72 110, 110 135 Q 132 160, 110 185 Q 88 210, 50 180 Z"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />

    <Path
      d="M 0 240 Q 60 220, 120 240 T 240 240 T 360 240 T 400 240"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 260 Q 60 245, 120 260 T 240 260 T 360 260 T 400 260"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />

    <Circle cx="340" cy="380" r="25" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
    <Circle cx="340" cy="380" r="38" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" />
  </Svg>
);

// Wave Curve Component
const WaveCurve = () => (
  <Svg
    height={81}
    width={width}
    viewBox={`0 0 ${width} 81`}
    className="absolute -bottom-px left-0 right-0"
  >
    <Path
      d={`M 0 40 Q ${width * 0.25} 0, ${width * 0.5} 40 T ${width} 40 L ${width} 81 L 0 81 Z`}
      fill="#F5F7FA"
    />
  </Svg>
);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await api.post('/api/auth/login', {
        email,
        password,
        client_type: 'mobile',
      });

      const data = res.data;

      if (!data.success) {
        Alert.alert('Login failed', data.message);
        return;
      }

      // Try different possible locations for the tokens
      const accessToken = data.accessToken || data.tokens?.accessToken || data.access_token;
      let refreshToken = data.refreshToken || data.tokens?.refreshToken || data.refresh_token;

      if (!accessToken) {
        Alert.alert('Login Error', 'No access token received from server');
        return;
      }

      if (!refreshToken) {
        refreshToken = accessToken;
      }

      await saveTokens(accessToken, refreshToken);
      router.replace('/Homepage');
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string }; status?: number };
      };
      Alert.alert('Login Error', err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F7FA]">
      {/* HEADER WITH TOPOGRAPHIC PATTERN */}
      <View style={{ height: height * 0.4 }} className="relative">
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} className="flex-1 overflow-hidden">
          <TopoPattern />
        </LinearGradient>
        {/* WAVE CURVE */}
        <WaveCurve />
      </View>

      {/* CARD */}
      <View className="flex-1 bg-[#F5F7FA] px-8 pt-2">
        <Text className="text-[32px] font-bold text-[#2C2C2C] mb-0.5">Login in</Text>
        <View className="w-10 h-[3px] bg-[#3DA2CE] mb-5 rounded-sm" />

        {/* EMAIL */}
        <Text className="text-sm text-[#4A4A4A] mb-2 font-medium">Email</Text>
        <View className="flex-row items-center border-b border-b-[#3DA2CE] py-3 px-1">
          <Mail size={18} color="#A0A0A0" className="mr-3" />
          <TextInput
            placeholder="Supervisor@email.com"
            placeholderTextColor="#B0B0B0"
            value={email}
            onChangeText={setEmail}
            className="flex-1 text-[15px] text-[#2C2C2C] p-0"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* PASSWORD */}
        <Text className="text-sm text-[#4A4A4A] mb-2 font-medium mt-6">Password</Text>
        <View className="flex-row items-center border-b border-b-[#3DA2CE] py-3 px-1">
          <Lock size={18} color="#A0A0A0" className="mr-3" />
          <TextInput
            placeholder="enter your password"
            placeholderTextColor="#B0B0B0"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            className="flex-1 text-[15px] text-[#2C2C2C] p-0"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={18} color="#A0A0A0" />
            ) : (
              <Eye size={18} color="#A0A0A0" />
            )}
          </Pressable>
        </View>

        {/* REMEMBER & FORGOT */}
        <View className="flex-row justify-between items-center mt-5">
          <View className="flex-row items-center gap-2">
            <Checkbox
              value={remember}
              onValueChange={setRemember}
              color={remember ? '#3DA2CE' : undefined}
            />
            <Text className="text-[13px] text-[#4A4A4A]">Remember Me</Text>
          </View>
          <Pressable>
            <Text className="text-[13px] text-[#3DA2CE] font-medium">Forgot Password?</Text>
          </Pressable>
        </View>

        {/* LOGIN BUTTON */}
        <Pressable
          className="bg-[#4FB3D9] h-[52px] rounded-xl justify-center items-center mt-8 shadow-md"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base tracking-wide">Login</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
