import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Users, CheckCircle } from 'lucide-react-native';
import api from '../../src/api/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Floor {
  id: string;
  floor_number: number | string;
  floor_name?: string;
  cleaners_count?: number;
  completed_jobs?: number;
  daily_target?: number;
}

interface BuildingFloors {
  building_name: string;
  floors: Floor[];
}

export default function FloorOverview() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<BuildingFloors | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFloors = async () => {
    try {
      const res = await api.get('/buildings/supervisor/floors');
      setData(res.data?.data ?? res.data ?? null);
    } catch (err) {
      console.error('Failed to load floor overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFloors();
  }, []);
  const onRefresh = () => {
    setRefreshing(true);
    loadFloors();
  };

  const pct = (done: number, target: number) =>
    target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;

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
          {t('supervisor.floorOverview', { defaultValue: 'Floor Overview' })}
        </Text>
        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
          {t('supervisor.operationalStatus', {
            buildingName:
              data?.building_name ??
              t('supervisor.yourBuilding', { defaultValue: 'Your building' }),
            defaultValue: `${data?.building_name ?? 'Your building'} — today's operational status`,
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
          {!data || data.floors.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Building2 size={48} color="#CBD5E1" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#94A3B8', marginTop: 16 }}>
                {t('supervisor.noFloorData', { defaultValue: 'No floor data available' })}
              </Text>
            </View>
          ) : (
            data.floors.map((floor) => {
              const done = floor.completed_jobs ?? 0;
              const target = floor.daily_target ?? 0;
              const progress = pct(done, target);
              const barColor = progress >= 80 ? '#10B981' : progress >= 50 ? '#F59E0B' : '#EF4444';

              return (
                <View
                  key={floor.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 18,
                    marginBottom: 14,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  {/* Floor header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 14,
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: '#EFF6FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={18} color="#1B86C6" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B' }}>
                        {floor.floor_name ??
                          t('supervisor.floorNumber', {
                            number: floor.floor_number,
                            defaultValue: `Floor ${floor.floor_number}`,
                          })}
                      </Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#F0F9FF',
                        borderRadius: 10,
                        padding: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Users size={16} color="#1B86C6" />
                      <Text
                        style={{ fontSize: 18, fontWeight: '800', color: '#1B86C6', marginTop: 4 }}
                      >
                        {floor.cleaners_count ?? '—'}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: '#94A3B8',
                          textTransform: 'uppercase',
                          marginTop: 2,
                        }}
                      >
                        {t('supervisor.cleaners', { defaultValue: 'Cleaners' })}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#F0FDF4',
                        borderRadius: 10,
                        padding: 12,
                        alignItems: 'center',
                      }}
                    >
                      <CheckCircle size={16} color="#10B981" />
                      <Text
                        style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginTop: 4 }}
                      >
                        {done}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: '#94A3B8',
                          textTransform: 'uppercase',
                          marginTop: 2,
                        }}
                      >
                        {t('supervisor.done', { defaultValue: 'Done' })}
                      </Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#FFF7ED',
                        borderRadius: 10,
                        padding: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{ fontSize: 18, fontWeight: '800', color: '#F59E0B', marginTop: 4 }}
                      >
                        {target > 0 ? target : '—'}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: '#94A3B8',
                          textTransform: 'uppercase',
                          marginTop: 2,
                        }}
                      >
                        {t('supervisor.target', { defaultValue: 'Target' })}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  {target > 0 && (
                    <View>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#64748B' }}>
                          {t('supervisor.progress', { defaultValue: 'Progress' })}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: barColor }}>
                          {progress}%
                        </Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 99 }}>
                        <View
                          style={{
                            height: 6,
                            borderRadius: 99,
                            backgroundColor: barColor,
                            width: `${progress}%`,
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
