import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Analytics() {
  const stats = [
    { title: 'Total Users', value: 120 },
    { title: 'Orders', value: 45 },
    { title: 'Revenue', value: '₹18,500' },
    { title: 'Active Sessions', value: 8 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Analytics</Text>

      <View style={styles.grid}>
        {stats.map((item, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },

  title: {
    fontSize: 12,
    color: '#6b7280',
  },

  value: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
  },
});
