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
import { Star, MessageSquare, CheckCircle } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../src/api/api';

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
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response && response.data && response.data.message) {
          errorMsg = response.data.message;
        }
      }
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1 px-5">
        <View className="pt-6 pb-4">
          <Text className="text-3xl font-bold text-center mb-2">Rate Your Experience</Text>
          <Text className="text-gray-500 text-center">How was the car wash service?</Text>
        </View>

        {/* TASK DETAILS */}
        {taskDetails && (
          <View className="bg-[#f6f8fb] rounded-2xl p-4 mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 text-sm">Vehicle</Text>
              <Text className="font-semibold">
                {taskDetails.car_model} ({taskDetails.car_type})
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 text-sm">Service Date</Text>
              <Text className="font-semibold">
                {new Date(taskDetails.completed_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {/* STAR RATING */}
        <View className="items-center mb-8">
          <Text className="font-semibold mb-4 text-base">Select Rating</Text>
          <View className="flex-row gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => !submitted && setRating(star)}
                disabled={submitted}
              >
                <Star
                  size={48}
                  color={star <= rating ? '#FFB800' : '#D1D5DB'}
                  fill={star <= rating ? '#FFB800' : 'transparent'}
                />
              </Pressable>
            ))}
          </View>

          {rating > 0 && (
            <Text className="mt-3 text-gray-600">
              {rating === 5 && 'Excellent! ⭐'}
              {rating === 4 && 'Great! 👍'}
              {rating === 3 && 'Good 👌'}
              {rating === 2 && 'Fair 😐'}
              {rating === 1 && 'Poor 😞'}
            </Text>
          )}
        </View>

        {/* COMMENT */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <MessageSquare size={18} color="#666" />
            <Text className="font-semibold ml-2">Additional Comments (Optional)</Text>
          </View>

          <TextInput
            className="bg-[#f6f8fb] rounded-2xl p-4 min-h-[120px] text-base"
            placeholder="Share your feedback about the service..."
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
            editable={!submitted}
          />
        </View>

        {/* SUCCESS MESSAGE */}
        {submitted && (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center mb-6">
            <CheckCircle size={24} color="#10b981" />
            <Text className="text-green-700 font-semibold ml-3">
              Review submitted successfully!
            </Text>
          </View>
        )}

        {/* SUBMIT BUTTON */}
        <Pressable
          className={`h-[55px] rounded-xl justify-center items-center mb-8 ${
            loading || submitted ? 'bg-[#bbb]' : 'bg-[#1B86C6]'
          }`}
          disabled={loading || submitted}
          onPress={handleSubmit}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {submitted ? 'Review Submitted ✓' : 'Submit Review'}
            </Text>
          )}
        </Pressable>

        <Text className="text-xs text-gray-400 text-center mb-6">
          Your feedback helps us improve our service quality
        </Text>
      </ScrollView>
    </View>
  );
}
