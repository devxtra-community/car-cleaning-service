import React, { useState } from 'react';
import api from '@/src/api/api';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { saveTokens } from '@/src/api/tokenStorage';

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
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          className="px-8"
        >
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-blue-50 rounded-2xl items-center justify-center mb-4">
              <Text className="text-4xl">🧼</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
            <Text className="text-gray-500 mt-2 text-center">Sign in to your worker account</Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 h-14 bg-gray-50 focus:border-blue-500">
                <Mail size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  className="flex-1 text-gray-900 text-base"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <View className="flex-row items-center border border-gray-300 rounded-xl px-4 h-14 bg-gray-50 focus:border-blue-500">
                <Lock size={20} color="#6B7280" className="mr-3" />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  className="flex-1 text-gray-900 text-base"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </Pressable>
              </View>
            </View>

            <View className="flex-row justify-between items-center mt-4">
              <View className="flex-row items-center">
                <Checkbox
                  value={remember}
                  onValueChange={setRemember}
                  color={remember ? '#0EA5E9' : undefined}
                  style={{ borderRadius: 6 }}
                />
                <Text className="ml-2 text-sm text-gray-600">Remember me</Text>
              </View>
              <Pressable>
                <Text className="text-sm font-medium text-blue-600">Forgot password?</Text>
              </Pressable>
            </View>

            <Pressable
              className={`h-14 rounded-xl justify-center items-center mt-8 bg-blue-600 active:bg-blue-700 ${
                loading ? 'opacity-70' : ''
              }`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign In</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
