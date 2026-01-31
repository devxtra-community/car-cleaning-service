import React, { useState } from 'react';
import { API } from '@/src/api/api';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
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
import * as SecureStore from 'expo-secure-store';

const { height, width } = Dimensions.get('window');

// Topographic Pattern
const TopoPattern = () => (
  <Svg
    height="100%"
    width="100%"
    style={StyleSheet.absoluteFillObject}
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
  <Svg height="81" width={width} viewBox={`0 0 ${width} 81`} style={styles.wave}>
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

      const res = await API.post('/auth/login', {
        email,
        password,
        client_type: 'mobile',
      });

      const data = res.data;

      if (!data.success) {
        Alert.alert('Login failed', data.message);
        return;
      }

      await SecureStore.setItemAsync('access_token', data.accessToken);

      console.log('ACCESS TOKEN:', data.accessToken);

      router.replace('/(tabs)');
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
          ? String(error.response.data.message)
          : 'Server error';

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER WITH TOPOGRAPHIC PATTERN */}
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} style={styles.header}>
          <TopoPattern />
        </LinearGradient>
        {/* WAVE CURVE */}
        <WaveCurve />
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Login in</Text>
        <View style={styles.line} />

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <Mail size={18} color="#A0A0A0" style={styles.icon} />
          <TextInput
            placeholder="Supervisor@email.com"
            placeholderTextColor="#B0B0B0"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* PASSWORD */}
        <Text style={[styles.label, { marginTop: 24 }]}>Password</Text>
        <View style={styles.inputRow}>
          <Lock size={18} color="#A0A0A0" style={styles.icon} />
          <TextInput
            placeholder="enter your password"
            placeholderTextColor="#B0B0B0"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
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
        <View style={styles.row}>
          <View style={styles.rememberRow}>
            <Checkbox
              value={remember}
              onValueChange={setRemember}
              color={remember ? '#3DA2CE' : undefined}
            />
            <Text style={styles.rememberText}>Remember Me</Text>
          </View>
          <Pressable>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* LOGIN BUTTON */}
        <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  headerContainer: {
    height: height * 0.4,
    position: 'relative',
  },

  header: {
    flex: 1,
    overflow: 'hidden',
  },

  wave: {
    position: 'absolute',
    bottom: -1, // Slightly overlap to remove any gap
    left: 0,
    right: 0,
  },

  card: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 32,
    paddingTop: 8, // Reduced from 20 to 8
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 2, // Reduced from 4 to 2
  },

  line: {
    width: 40,
    height: 3,
    backgroundColor: '#3DA2CE',
    marginBottom: 20, // Reduced from 24 to 20
    borderRadius: 2,
  },

  label: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 8,
    fontWeight: '500',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3DA2CE',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },

  icon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#2C2C2C',
    padding: 0,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  rememberText: {
    fontSize: 13,
    color: '#4A4A4A',
  },

  forgot: {
    fontSize: 13,
    color: '#3DA2CE',
    fontWeight: '500',
  },

  button: {
    backgroundColor: '#4FB3D9',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#3DA2CE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
