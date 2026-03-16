import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api/api';
import { useTheme } from '../contexts/ThemeContext';

interface TaskDetails {
  car_model: string;
  car_type: string;
  completed_at: string;
}

/* ================= COMPONENT ================= */

export default function WorkerReview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const taskId = params.taskId as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);

  /* ================= LOAD TASK DETAILS ================= */

  useEffect(() => {
    const loadTaskDetails = async () => {
      try {
        const res = await api.get(`/tasks/${taskId}`);
        if (res.data) {
          setTaskDetails(res.data);
        }
      } catch (err) {
        console.error('Failed to load task:', err);
      }
    };

    if (taskId) {
      loadTaskDetails();
    }
  }, [taskId]);

  /* ================= SUBMIT REVIEW ================= */

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    try {
      setLoading(true);

      await api.post('/api/reviews', {
        task_id: taskId,
        rating,
        comment: comment.trim() || null,
      });

      setSubmitted(true);

      setTimeout(() => {
        Alert.alert('Thank You!', 'Your review has been submitted successfully.', [
          { text: 'Close', onPress: () => router.back() },
        ]);
      }, 500);
    } catch (err: unknown) {
      console.error('Submit review error:', err);
      let errorMsg = 'Failed to submit review';
      const error = err as { response?: { data?: { message?: string } } };
      if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View className="flex-1 bg-[#E0F2FE]">
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <View
        className="pb-6 rounded-b-[40px] shadow-sm z-10"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between px-6">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center bg-white shadow-sm border border-gray-100"
          >
            <ArrowLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="text-xl font-heading tracking-tight text-clay-text">Feedback</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pt-2 pb-8">
          <Text className="text-3xl font-heading text-center mb-2 text-clay-text">
            Rate Your Experience
          </Text>
          <Text className="text-clay-secondary text-center font-body text-sm">
            How was the car wash service?
          </Text>
        </View>

        {/* TASK DETAILS */}
        {taskDetails && (
          <View className="clay-card p-6 mb-8 bg-white border border-white/60">
            <View className="flex-row justify-between mb-3 border-b border-gray-100 pb-3">
              <Text className="text-clay-secondary/80 text-[10px] font-label uppercase tracking-widest">
                Vehicle
              </Text>
              <Text className="font-heading text-sm text-clay-text">
                {taskDetails.car_model} ({taskDetails.car_type})
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-clay-secondary/80 text-[10px] font-label uppercase tracking-widest">
                Service Date
              </Text>
              <Text className="font-heading text-sm text-clay-text">
                {new Date(taskDetails.completed_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {/* STAR RATING */}
        <View className="clay-card p-8 items-center mb-8 bg-white border border-white/60 shadow-xl">
          <Text className="font-heading mb-6 text-sm text-clay-text">Select Rating</Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => !submitted && setRating(star)}
                disabled={submitted}
                className="transform active:scale-90 transition-transform"
              >
                <Star
                  size={42}
                  color={star <= rating ? '#F59E0B' : '#E2E8F0'}
                  fill={star <= rating ? '#F59E0B' : 'transparent'}
                  strokeWidth={1.5}
                />
              </Pressable>
            ))}
          </View>

          <Text className="mt-4 text-clay-secondary font-heading text-lg h-8">
            {rating === 5 && 'Excellent! ⭐'}
            {rating === 4 && 'Great! 👍'}
            {rating === 3 && 'Good 👌'}
            {rating === 2 && 'Fair 😐'}
            {rating === 1 && 'Poor 😞'}
          </Text>
        </View>

        {/* COMMENT */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3 ml-1">
            <MessageSquare size={16} color="#64748B" />
            <Text className="font-heading text-xs ml-2 text-clay-secondary">
              Additional Comments (Optional)
            </Text>
          </View>

          <TextInput
            className="bg-white rounded-2xl p-4 min-h-[120px] text-base font-body text-clay-text border border-gray-100 shadow-sm"
            placeholder="Share your feedback about the service..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
            editable={!submitted}
            style={{ elevation: 2 }}
          />
        </View>

        {/* SUCCESS MESSAGE */}
        {submitted && (
          <View className="bg-[#ECFDF5] border border-[#10B981]/20 rounded-2xl p-4 flex-row items-center mb-6">
            <CheckCircle size={24} color="#10B981" />
            <Text className="text-[#065F46] font-heading text-sm ml-3">
              Review submitted successfully!
            </Text>
          </View>
        )}

        {/* SUBMIT BUTTON */}
        <Pressable
          className={`h-[64px] rounded-[24px] justify-center items-center mb-10 shadow-lg shadow-blue-200 clay-button ${loading || submitted ? 'bg-gray-300 opacity-70' : 'bg-[#0EA5E9]'
            }`}
          disabled={loading || submitted}
          onPress={handleSubmit}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-sm font-heading uppercase tracking-widest">
              {submitted ? 'Review Submitted ✓' : 'Submit Review'}
            </Text>
          )}
        </Pressable>

        <Text className="text-[10px] text-clay-secondary/50 text-center mb-10 font-bold uppercase tracking-widest">
          Your feedback helps us improve our service quality
        </Text>
      </ScrollView>
    </View>
  );
}
