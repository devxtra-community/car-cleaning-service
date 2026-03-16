import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-white">
      <Text className="text-2xl font-antigravity-bold text-clay-text">This is a modal</Text>
      <Link href="/" dismissTo className="mt-4 py-4">
        <Text className="text-clay-primary font-antigravity-medium">Go to home screen</Text>
      </Link>
    </View>
  );
}
