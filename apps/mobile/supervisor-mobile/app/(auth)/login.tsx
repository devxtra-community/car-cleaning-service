import React, { useState } from 'react';
import api from '@/src/api/api';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
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
    style={StyleSheet.absoluteFillObject}
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
  <View style={StyleSheet.absoluteFill}>
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerArea}>
          <WavyHeader />

          <View style={styles.headerContent}>
            <View style={styles.logoClay}>
              <Mail size={32} color="#fff" />
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to manage your team</Text>
          </View>
        </View>

        <View style={styles.loginCardClay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* EMAIL */}
            <Text style={styles.inputLabel}>OFFICIAL EMAIL</Text>
            <View style={styles.clayInput}>
              <View style={styles.iconContainer}>
                <Mail size={18} color="#0EA5E9" />
              </View>
              <TextInput
                placeholder="supervisor@cleaning.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                style={styles.textInput}
                autoCapitalize="none"
              />
            </View>

            {/* PASSWORD */}
            <Text style={[styles.inputLabel, { marginTop: 24 }]}>SECURE PASSWORD</Text>
            <View style={styles.clayInput}>
              <View style={styles.iconContainer}>
                <Lock size={18} color="#0EA5E9" />
              </View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.textInput}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? (
                  <EyeOff size={20} color="#94A3B8" />
                ) : (
                  <Eye size={20} color="#94A3B8" />
                )}
              </Pressable>
            </View>

            {/* REMEMBER & FORGOT */}
            <View style={styles.actionRow}>
              <View style={styles.rememberRow}>
                <Checkbox
                  value={remember}
                  onValueChange={setRemember}
                  color={remember ? '#0EA5E9' : '#CBD5E1'}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberLabel}>Remember me</Text>
              </View>
              <Pressable>
                <Text style={styles.forgotPass}>Forgot?</Text>
              </Pressable>
            </View>

            {/* LOGIN BUTTON */}
            <Pressable
              style={({ pressed }) => [styles.loginBtnClay, pressed && styles.btnPressed]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>SIGN IN NOW</Text>
                    <ChevronRight size={18} color="#fff" opacity={0.6} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </KeyboardAvoidingView>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Need an account? </Text>
          <Pressable>
            <Text style={styles.footerLink}>Contact Admin</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerArea: {
    height: height * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 0,
    zIndex: 10,
  },
  logoClay: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  loginCardClay: {
    marginHorizontal: 24,
    marginTop: -60,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  clayInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  eyeBtn: {
    padding: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    borderRadius: 6,
    width: 20,
    height: 20,
  },
  rememberLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  forgotPass: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '700',
  },
  loginBtnClay: {
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '800',
  },
});
