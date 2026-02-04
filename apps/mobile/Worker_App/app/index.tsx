import React, { useState } from 'react';
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
import axios from 'axios';
import { API } from '../src/api/api';

const { height, width } = Dimensions.get('window');

/* ================= TOPO PATTERN ================= */

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
      d="M 0 240 Q 60 220, 120 240 T 240 240 T 360 240 T 400 240"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

const WaveCurve = () => (
  <Svg height={81} width={width} viewBox={`0 0 ${width} 81`} style={styles.wave}>
    <Path
      d={`M 0 40 Q ${width * 0.25} 0, ${width * 0.5} 40 T ${width} 40 L ${width} 81 L 0 81 Z`}
      fill="#F5F7FA"
    />
  </Svg>
);

/* ================= SCREEN ================= */

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= LOGIN ================= */

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

      await SecureStore.setItemAsync('access_token', data.accessToken);

      router.replace('/(tabs)/Homepage');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        Alert.alert('Login Error', err.response?.data?.message || err.message || 'Server error');
      } else {
        Alert.alert('Login Error', 'Unexpected error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} style={styles.header}>
          <TopoPattern />
        </LinearGradient>
        <WaveCurve />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <View style={styles.line} />

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <Mail size={18} color="#A0A0A0" />
          <TextInput
            placeholder="worker@email.com"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.label, { marginTop: 24 }]}>Password</Text>
        <View style={styles.inputRow}>
          <Lock size={18} color="#A0A0A0" />
          <TextInput
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={styles.rememberRow}>
            <Checkbox value={remember} onValueChange={setRemember} />
            <Text>Remember Me</Text>
          </View>
        </View>

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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerContainer: { height: height * 0.4 },
  header: { flex: 1 },
  wave: { position: 'absolute', bottom: -1 },

  card: { flex: 1, paddingHorizontal: 32, paddingTop: 8 },

  title: { fontSize: 32, fontWeight: '700' },
  line: { width: 40, height: 3, backgroundColor: '#3DA2CE', marginBottom: 20 },

  label: { fontSize: 14, marginBottom: 8 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#3DA2CE',
    paddingVertical: 12,
  },

  input: { flex: 1, marginLeft: 12 },

  row: { marginTop: 20 },

  rememberRow: { flexDirection: 'row', gap: 8 },

  button: {
    backgroundColor: '#4FB3D9',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },

  buttonText: { color: '#fff', fontWeight: '600' },
});
