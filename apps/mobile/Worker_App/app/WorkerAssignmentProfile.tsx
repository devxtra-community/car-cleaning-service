import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, MapPin, AlertCircle, Save, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api/api';
import { useLanguage } from '../src/i18n/LanguageContext';

interface Floor {
    id: string;
    floor_number: string;
}

export default function WorkerAssignmentProfile() {
    const router = useRouter();
    const { id: workerId, name: workerName } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
    const [isFloorModalVisible, setIsFloorModalVisible] = useState(false);
    const [cleanerId, setCleanerId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch floors
                const floorsRes = await api.get('/api/floors');
                setFloors(floorsRes.data.data || []);

                // Fetch current cleaner details to get current floor
                const cleanerRes = await api.get(`/api/supervisor/workers`);
                const worker = cleanerRes.data.data.find((w: any) => w.id === workerId);
                if (worker) {
                    setCleanerId(worker.cleaner_id);
                    // Find floor id if needed - assuming backend returns floor_id
                    setSelectedFloor(worker.floor_id || null);
                }
            } catch (error) {
                console.error('Fetch assignment data error:', error);
            }
        };
        fetchData();
    }, [workerId]);

    const handleUpdateAssignment = async () => {
        if (!cleanerId) return;
        try {
            setLoading(true);
            const res = await api.post('/api/supervisor/workers/assignment', {
                cleaner_id: cleanerId,
                floor_id: selectedFloor,
            });
            if (res.data.success) {
                Alert.alert('Success', 'Worker assignment updated successfully');
            }
        } catch (error) {
            console.error('Update assignment error:', error);
            Alert.alert('Error', 'Failed to update assignment');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPenalty = () => {
        // Navigate to a dedicated penalty assignment page or open a modal
        // For now, let's just show a simple prompt as per common mobile patterns
        Alert.prompt(
            'Assign Penalty',
            'Enter the reason for the penalty',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Assign',
                    onPress: async (reason) => {
                        if (!reason) return Alert.alert('Error', 'Reason is required');
                        try {
                            await api.post('/api/supervisor/penalties', {
                                cleaner_id: cleanerId,
                                amount: 50, // Default penalty amount or fetch from config
                                reason: reason,
                            });
                            Alert.alert('Success', 'Penalty assigned successfully');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to assign penalty');
                        }
                    },
                },
            ],
            'plain-text'
        );
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
                <View className="flex-row items-center justify-between">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-xl items-center justify-center bg-gray-50 border border-gray-100"
                    >
                        <ArrowLeft size={24} color="#1E293B" />
                    </Pressable>
                    <Text className="text-xl font-bold text-[#1E293B]">Worker Profile</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
            >
                {/* Header Info */}
                <View className="items-center mb-10">
                    <View className="w-24 h-24 rounded-[32px] bg-white shadow-lg shadow-blue-200 items-center justify-center mb-4 border-2 border-white">
                        <User size={48} color="#0EA5E9" />
                    </View>
                    <Text className="text-2xl font-bold text-[#1E293B]">{workerName}</Text>
                    <Text className="text-gray-400 font-medium">Assigned Cleaner</Text>
                </View>

                {/* Assignment Controls */}
                <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-6">
                    <View className="flex-row items-center gap-3 mb-6">
                        <MapPin size={20} color="#0EA5E9" />
                        <Text className="text-lg font-bold text-[#1E293B]">Floor Assignment</Text>
                    </View>

                    <Pressable
                        onPress={() => setIsFloorModalVisible(true)}
                        className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6"
                    >
                        <Text className="text-[#1E293B] font-medium">
                            {selectedFloor ? `Floor ${floors.find(f => f.id === selectedFloor)?.floor_number || selectedFloor}` : 'Select Floor'}
                        </Text>
                        <ChevronDown size={20} color="#94A3B8" />
                    </Pressable>

                    <Pressable
                        onPress={handleUpdateAssignment}
                        disabled={loading}
                        className="bg-[#0EA5E9] py-4 rounded-2xl items-center shadow-lg shadow-blue-200 flex-row justify-center gap-2"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Save size={20} color="white" />
                                <Text className="text-white font-bold">Update Assignment</Text>
                            </>
                        )}
                    </Pressable>
                </View>

                {/* Performance Actions */}
                <View className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                    <View className="flex-row items-center gap-3 mb-6">
                        <AlertCircle size={20} color="#FB7185" />
                        <Text className="text-lg font-bold text-[#1E293B]">Quick Actions</Text>
                    </View>

                    <Pressable
                        onPress={handleApplyPenalty}
                        className="bg-red-50 py-4 rounded-2xl items-center border border-red-100 flex-row justify-center gap-2"
                    >
                        <AlertCircle size={20} color="#FB7185" />
                        <Text className="text-[#FB7185] font-bold">Assign Penalty (₹50)</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* Floor Selection Modal */}
            <Modal
                visible={isFloorModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsFloorModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-center px-10">
                    <View className="bg-white rounded-[40px] p-6 max-h-[70%]">
                        <Text className="text-xl font-bold text-[#1E293B] mb-6 text-center">Select Floor</Text>
                        <ScrollView>
                            {floors.map((floor) => (
                                <Pressable
                                    key={floor.id}
                                    onPress={() => {
                                        setSelectedFloor(floor.id);
                                        setIsFloorModalVisible(false);
                                    }}
                                    className={`py-4 px-6 rounded-2xl mb-2 ${selectedFloor === floor.id ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}
                                >
                                    <Text className={`text-center font-bold ${selectedFloor === floor.id ? 'text-[#0EA5E9]' : 'text-[#64748B]'}`}>
                                        Floor {floor.floor_number}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                        <Pressable
                            onPress={() => setIsFloorModalVisible(false)}
                            className="mt-6 py-4 bg-gray-100 rounded-2xl items-center"
                        >
                            <Text className="text-gray-600 font-bold">Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
