import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, User, ClipboardList, ChevronRight, Clock, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api/api';
import { useLanguage } from '../src/i18n/LanguageContext';

interface WorkerAttendance {
    id: string;
    full_name: string;
    attendance_status: 'present' | 'absent';
    check_in_time?: string;
    floor_number?: string;
}

export default function WorkerManagement() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [workers, setWorkers] = useState<WorkerAttendance[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAttendance = async () => {
        try {
            const res = await api.get('/api/supervisor/workers/attendance');
            if (res.data.success) {
                setWorkers(res.data.data);
            }
        } catch (error) {
            console.error('Fetch attendance error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    const filteredWorkers = workers.filter(w =>
        w.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: workers.length,
        present: workers.filter(w => w.attendance_status === 'present').length,
        absent: workers.filter(w => w.attendance_status === 'absent').length,
    };

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <LinearGradient
                colors={['#E0F2FE', '#F8FAFC']}
                className="absolute w-full h-full"
            />

            <View
                className="bg-white px-6 pb-6 rounded-b-[40px] shadow-sm border-b border-gray-100"
                style={{ paddingTop: insets.top + 10 }}
            >
                <View className="flex-row items-center justify-between mb-6">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-xl items-center justify-center bg-gray-50 border border-gray-100"
                    >
                        <ArrowLeft size={24} color="#1E293B" />
                    </Pressable>
                    <Text className="text-xl font-bold text-[#1E293B]">Worker Management</Text>
                    <View className="w-10" />
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        className="flex-1 ml-3 font-medium text-[#1E293B]"
                        placeholder="Search workers..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
                }
            >
                {/* Attendance Summary */}
                <View className="flex-row gap-3 mb-8">
                    <View className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 items-center">
                        <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Total</Text>
                        <Text className="text-2xl font-bold text-[#1E293B]">{stats.total}</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 items-center">
                        <Text className="text-green-500 text-[10px] font-bold uppercase mb-1">Present</Text>
                        <Text className="text-2xl font-bold text-green-500">{stats.present}</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-3xl shadow-sm border border-gray-100 items-center">
                        <Text className="text-red-400 text-[10px] font-bold uppercase mb-1">Absent</Text>
                        <Text className="text-2xl font-bold text-red-400">{stats.absent}</Text>
                    </View>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#0EA5E9" className="mt-10" />
                ) : (
                    filteredWorkers.map((worker) => (
                        <Pressable
                            key={worker.id}
                            onPress={() => router.push({
                                pathname: '/WorkerAssignmentProfile',
                                params: { id: worker.id, name: worker.full_name }
                            })}
                            className="bg-white p-5 rounded-[28px] mb-4 shadow-sm border border-gray-100 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center gap-4 flex-1">
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${worker.attendance_status === 'present' ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <User size={24} color={worker.attendance_status === 'present' ? '#22C55E' : '#FB7185'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-[#1E293B]">{worker.full_name}</Text>
                                    <View className="flex-row items-center gap-3 mt-1">
                                        {worker.attendance_status === 'present' ? (
                                            <View className="flex-row items-center gap-1">
                                                <Clock size={12} color="#94A3B8" />
                                                <Text className="text-xs text-gray-400">
                                                    Checked in {new Date(worker.check_in_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text className="text-xs text-red-300 italic">Not checked in yet</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center">
                                <ChevronRight size={20} color="#94A3B8" />
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
