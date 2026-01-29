import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Checkbox from 'expo-checkbox';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { API } from '../src/api/api';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Enter email and password');
      return;
    }

    try {
      const res = await API.post('/api/auth/login', {
        email,
        password,
      });

      console.log('LOGIN RESPONSE:', res.data);

      alert('Login Success');
    } catch (err: unknown) {
      console.log(err.response?.data);
      alert(err.response?.data?.message || 'Login Failed');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#48A9D6', '#3DA2CE']} style={styles.header} />

      <View style={styles.card}>
        <Text style={styles.title}>Sign in</Text>
        <View style={styles.line} />

        <Text style={styles.label}>Email</Text>

        <View style={styles.inputRow}>
          <Mail size={18} color="#999" />
          <TextInput
            placeholder="Worker@email.com"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>

        <View style={styles.inputRow}>
          <Lock size={18} color="#999" />

          <TextInput
            placeholder="enter your password"
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
            <Text style={styles.rememberText}>Remember Me</Text>
          </View>

          <Text style={styles.forgot}>Forgot Password?</Text>
        </View>

        {/* 🔥 BUTTON CONNECTED */}
        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },

  header: {
    height: height * 0.38,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },

  card: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    marginTop: -80,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },

  line: {
    width: 30,
    height: 3,
    backgroundColor: '#3DA2CE',
    marginVertical: 10,
    borderRadius: 2,
  },

  label: {
    color: '#555',
    marginBottom: 6,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#3DA2CE',
    paddingVertical: 10,
    gap: 10,
  },

  input: {
    flex: 1,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    alignItems: 'center',
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  rememberText: {
    fontSize: 13,
  },

  forgot: {
    color: '#3DA2CE',
    fontSize: 13,
  },

  button: {
    backgroundColor: '#48A9D6',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
