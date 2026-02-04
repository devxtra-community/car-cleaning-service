import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';

export default function Profile() {
  const user = {
    name: 'Muhd Yasir',
    email: 'yasir@example.com',
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://i.pravatar.cc/150' }} style={styles.avatar} />

      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },

  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  email: {
    color: '#6b7280',
    marginTop: 4,
  },

  button: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
