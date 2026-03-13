import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banknote, Smartphone, CreditCard } from 'lucide-react-native';
import api from '../../src/api/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface CollectionData {
  total_collected: number;
  payment_method: string;
  task_count: number;
}

export default function Collections() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCollections = async () => {
    try {
      const res = await api.get('/tasks/collections/supervisor');
      const data = res.data?.success ? res.data.data : [];
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCollections();
  };

  // Safe getter for payment method totals
  const getAmountForMethod = (method: string) => {
    const item = collections.find((c) => c.payment_method?.toLowerCase() === method);
    return item ? item.total_collected : 0;
  };

  const totalCash = getAmountForMethod('cash');
  const totalUPI = getAmountForMethod('upi');
  const totalCard = getAmountForMethod('card');
  const totalAll = collections.reduce((s, c) => s + c.total_collected, 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          padding: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E293B' }}>
          {t('supervisor.collections', { defaultValue: 'Collections' })}
        </Text>
        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
          {t('supervisor.paymentSummary', {
            defaultValue: 'Payment summary across all your cleaners (today)',
          })}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#1B86C6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Cards */}
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {/* Cash Card */}
            <View
              style={{
                width: '48%',
                backgroundColor: '#ECFDF5',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Banknote size={24} color="#10B981" />
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginTop: 8 }}>
                ₹{totalCash.toLocaleString('en-IN')}
              </Text>
              <Text
                style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}
              >
                {t('supervisor.cash', { defaultValue: 'Cash' })}
              </Text>
            </View>

            {/* UPI Card */}
            <View
              style={{
                width: '48%',
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Smartphone size={24} color="#1B86C6" />
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1B86C6', marginTop: 8 }}>
                ₹{totalUPI.toLocaleString('en-IN')}
              </Text>
              <Text
                style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}
              >
                {t('supervisor.upi', { defaultValue: 'UPI' })}
              </Text>
            </View>

            {/* Card/Online Card */}
            <View
              style={{
                width: '48%',
                backgroundColor: '#FFF7ED',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <CreditCard size={24} color="#F97316" />
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#F97316', marginTop: 8 }}>
                ₹{totalCard.toLocaleString('en-IN')}
              </Text>
              <Text
                style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}
              >
                {t('supervisor.card', { defaultValue: 'Card' })}
              </Text>
            </View>

            {/* Total Card */}
            <View
              style={{
                width: '48%',
                backgroundColor: '#F5F3FF',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Banknote size={24} color="#7C3AED" />
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#7C3AED', marginTop: 8 }}>
                ₹{totalAll.toLocaleString('en-IN')}
              </Text>
              <Text
                style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' }}
              >
                {t('supervisor.total', { defaultValue: 'Total' })}
              </Text>
            </View>
          </View>

          {/* Breakdown Section */}
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#334155',
                marginBottom: 12,
                paddingHorizontal: 4,
              }}
            >
              Transaction Breakdown
            </Text>

            {collections.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Banknote size={48} color="#CBD5E1" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#94A3B8', marginTop: 16 }}>
                  {t('supervisor.noCollectionData', { defaultValue: 'No collection data today' })}
                </Text>
              </View>
            ) : (
              collections.map((c, index) => (
                <View
                  key={c.payment_method || index.toString()}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          c.payment_method?.toLowerCase() === 'cash'
                            ? '#ECFDF5'
                            : c.payment_method?.toLowerCase() === 'upi'
                              ? '#EFF6FF'
                              : '#FFF7ED',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.payment_method?.toLowerCase() === 'cash' ? (
                        <Banknote size={20} color="#10B981" />
                      ) : c.payment_method?.toLowerCase() === 'upi' ? (
                        <Smartphone size={20} color="#1B86C6" />
                      ) : (
                        <CreditCard size={20} color="#F97316" />
                      )}
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: '#1E293B',
                          textTransform: 'capitalize',
                        }}
                      >
                        {c.payment_method || 'Unknown'}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                        {c.task_count} {c.task_count === 1 ? 'Task' : 'Tasks'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                    ₹{c.total_collected.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
