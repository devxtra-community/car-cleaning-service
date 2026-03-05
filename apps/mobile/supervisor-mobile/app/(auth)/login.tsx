import React, { useState } from 'react';
import { API } from '@/src/api/api';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Checkbox from 'expo-checkbox';
import { Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { saveTokens } from '../../src/tokenStorage';

const { height, width } = Dimensions.get('window');

// Topographic Pattern for Headers
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    className="absolute inset-0"
    viewBox="0 0 400 400"
    preserveAspectRatio="xMidYMid slice"
    pointerEvents="none"
  >
    <Path
      d="M 0 80 Q 50 60, 100 80 T 200 80 T 300 80 T 400 80"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 100 Q 50 85, 100 100 T 200 100 T 300 100 T 400 100"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 0 120 Q 50 110, 100 120 T 200 120 T 300 120 T 400 120"
      stroke="rgba(255,255,255,0.08)"
      strokeWidth="2"
      fill="none"
    />
    <Circle cx="320" cy="100" r="30" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
    <Circle cx="320" cy="100" r="45" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
  </Svg>
);

const WavyHeader = () => (
  <View className="absolute inset-0" pointerEvents="none">
    <Svg
      height={height * 0.45}
      width={width}
      viewBox={`0 0 ${width} 320`}
      preserveAspectRatio="none"
    >
      <Defs>
        <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0EA5E9" />
          <Stop offset="1" stopColor="#0284C7" />
        </SvgGradient>
      </Defs>
      <Path
        d={`M0,0 L${width},0 L${width},250 C${width * 0.75},320 ${width * 0.25},180 0,250 Z`}
        fill="url(#grad)"
      />
    </Svg>
    <TopoPattern />
  </View>
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

      const res = await API.post('/api/auth/login', {
        email,
        password,
        client_type: 'mobile',
      });

      const data = res.data;

      if (!data.success) {
        Alert.alert('Login failed', data.message);
        return;
      }

      await saveTokens(data.accessToken, data.refreshToken);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Server error';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFB]">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View className="h-[42%] justify-center items-center">
          <WavyHeader />

          <View className="items-center z-10">
            <View className="w-20 h-20 rounded-3xl bg-white/20 justify-center items-center mb-5 border border-white/30">
              <Mail size={32} color="#fff" />
            </View>
            <Text className="text-[28px] font-antigravity-bold text-white mb-2">Welcome Back</Text>
            <Text className="text-[15px] text-white/80 font-antigravity-medium">
              Sign in to manage your team
            </Text>
          </View>
        </View>

        <View className="mx-6 -mt-[60px] bg-white rounded-[32px] p-6 shadow-xl border border-[#F1F5F9]">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* EMAIL */}
            <Text className="text-[11px] font-antigravity-bold text-[#94A3B8] tracking-[1.5px] mb-2.5 ml-1 uppercase">
              OFFICIAL EMAIL
            </Text>
            <View className="flex-row items-center h-14 bg-[#F8FAFB] rounded-2xl px-3 border border-[#F1F5F9]">
              <View className="w-9 h-9 rounded-xl bg-white justify-center items-center mr-2.5 shadow-sm">
                <Mail size={18} color="#0EA5E9" />
              </View>
              <TextInput
                placeholder="supervisor@cleaning.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                className="flex-1 text-sm font-antigravity-bold text-[#1E293B]"
                autoCapitalize="none"
              />
            </View>

            {/* PASSWORD */}
            <Text className="text-[11px] font-antigravity-bold text-[#94A3B8] tracking-[1.5px] mb-2.5 ml-1 mt-6 uppercase">
              SECURE PASSWORD
            </Text>
            <View className="flex-row items-center h-14 bg-[#F8FAFB] rounded-2xl px-3 border border-[#F1F5F9]">
              <View className="w-9 h-9 rounded-xl bg-white justify-center items-center mr-2.5 shadow-sm">
                <Lock size={18} color="#0EA5E9" />
              </View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                className="flex-1 text-sm font-antigravity-bold text-[#1E293B]"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
                {showPassword ? (
                  <EyeOff size={20} color="#94A3B8" />
                ) : (
                  <Eye size={20} color="#94A3B8" />
                )}
              </Pressable>
            </View>

            {/* REMEMBER & FORGOT */}
            <View className="flex-row justify-between items-center mt-5 mb-8 px-1">
              <View className="flex-row items-center gap-2">
                <Checkbox
                  value={remember}
                  onValueChange={setRemember}
                  color={remember ? '#0EA5E9' : '#CBD5E1'}
                  className="rounded-md w-5 h-5"
                />
                <Text className="text-[13px] text-[#64748B] font-antigravity-semibold">
                  Remember me
                </Text>
              </View>
              <Pressable>
                <Text className="text-[13px] text-[#0EA5E9] font-antigravity-bold">Forgot?</Text>
              </Pressable>
            </View>

            {/* LOGIN BUTTON */}
            <Pressable
              className="h-[60px] rounded-[20px] overflow-hidden shadow-lg"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                className="flex-1 flex-row justify-center items-center gap-2.5"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-[15px] font-antigravity-bold tracking-[1.5px] uppercase">
                      SIGN IN NOW
                    </Text>
                    <ChevronRight size={18} color="#fff" opacity={0.6} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </KeyboardAvoidingView>
        </View>

        <View className="flex-row justify-center items-center mt-10 pb-10">
          <Text className="text-sm text-[#64748B] font-antigravity-medium">Need an account? </Text>
          <Pressable>
            <Text className="text-sm text-[#0EA5E9] font-antigravity-bold">Contact Admin</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
