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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Checkbox from 'expo-checkbox';
import { Mail, Lock, Eye, EyeOff, ChevronRight, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { saveTokens, saveUserRole } from '../src/api/tokenStorage';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

const { height, width } = Dimensions.get('window');

/* ------------------ SVG DECORATION ------------------ */

const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    className="absolute"
    viewBox="0 0 400 400"
    preserveAspectRatio="xMidYMid slice"
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
  <View className="absolute inset-0">
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

/* ------------------ SCREEN ------------------ */

export default function LoginScreen() {
  const { expoPushToken, sendTokenToBackend } = usePushNotifications();
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

      await saveTokens(data.accessToken, data.refreshToken);
      if (data.data?.role) {
        await saveUserRole(data.data.role);
      }

      // Register push token
      if (expoPushToken) {
        try {
          await sendTokenToBackend(expoPushToken, data.accessToken);
        } catch (notifErr) {
          console.error('Failed to register push token during login:', notifErr);
        }
      }

      if (data.data?.role === 'supervisor') {
        router.replace('/(tabs)/SupervisorDashboard');
      } else {
        router.replace('/(tabs)/Homepage');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={{ height: height * 0.42 }} className="items-center justify-center">
          <WavyHeader />

          <View className="items-center z-10">
            <View className="px-4 py-2 rounded-full bg-white/15 border border-white/25 mb-4">
              <Text className="text-[11px] font-extrabold tracking-[2px] text-white/90">
                FIELD WORKER PORTAL
              </Text>
            </View>
            <View className="w-20 h-20 rounded-3xl bg-white/20 border border-white/30 items-center justify-center mb-5">
              <User size={32} color="#fff" />
            </View>
            <Text className="text-4xl font-extrabold text-white mb-2">Worker Sign In</Text>
            <Text className="text-base font-medium text-white/80">
              Sign in to view your jobs, earnings, and daily updates
            </Text>
          </View>
        </View>

        {/* CARD */}
        <View className="-mt-16 mx-6 bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className="flex-row items-center gap-3 mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-100">
              <View className="w-11 h-11 rounded-2xl bg-white items-center justify-center shadow-sm">
                <User size={20} color="#0EA5E9" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-extrabold tracking-[1.5px] text-sky-500 uppercase mb-1">
                  Worker Access
                </Text>
                <Text className="text-sm font-semibold text-slate-700">
                  Use your assigned worker email and password to continue.
                </Text>
              </View>
            </View>

            {/* EMAIL */}
            <Text className="text-xs font-extrabold text-slate-400 tracking-widest mb-2 ml-2">
              OFFICIAL EMAIL
            </Text>

            <View className="flex-row items-center h-16 bg-slate-50 rounded-2xl px-4 border border-slate-100">
              <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-3 shadow-sm">
                <Mail size={20} color="#0EA5E9" />
              </View>
              <TextInput
                className="flex-1 text-base font-bold text-slate-800"
                placeholder="worker@cleaning.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* PASSWORD */}
            <Text className="text-xs font-extrabold text-slate-400 tracking-widest mb-2 ml-2 mt-6">
              SECURE PASSWORD
            </Text>

            <View className="flex-row items-center h-16 bg-slate-50 rounded-2xl px-4 border border-slate-100">
              <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mr-3 shadow-sm">
                <Lock size={20} color="#0EA5E9" />
              </View>
              <TextInput
                className="flex-1 text-base font-bold text-slate-800"
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
                {showPassword ? (
                  <EyeOff size={20} color="#94A3B8" />
                ) : (
                  <Eye size={20} color="#94A3B8" />
                )}
              </Pressable>
            </View>

            {/* ACTIONS */}
            <View className="flex-row justify-between items-center mt-5 mb-8 px-1">
              <View className="flex-row items-center space-x-2">
                <Checkbox
                  value={remember}
                  onValueChange={setRemember}
                  color={remember ? '#0EA5E9' : '#CBD5E1'}
                />
                <Text className="text-xs font-semibold text-slate-600">Remember me</Text>
              </View>
              <Text className="text-xs font-bold text-sky-500">Forgot?</Text>
            </View>

            {/* BUTTON */}
            <Pressable
              disabled={loading}
              onPress={handleLogin}
              className="h-16 rounded-2xl overflow-hidden shadow-lg shadow-sky-500/40"
            >
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-sm font-extrabold tracking-widest">
                      SIGN IN NOW
                    </Text>
                    <ChevronRight size={18} color="#fff" opacity={0.6} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </KeyboardAvoidingView>
        </View>

        {/* FOOTER */}
        <View className="items-center mt-10 mb-10 px-8">
          <Text className="text-sm text-slate-500 font-medium text-center">
            Need worker access?
          </Text>
          <Text className="text-sm text-sky-500 font-extrabold text-center mt-1">
            Contact your supervisor to get your login details
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
