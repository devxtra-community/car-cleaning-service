import { PropsWithChildren, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ThemedView>
      <Pressable
        className="flex-row items-center gap-1.5 py-4"
        onPress={() => setIsOpen((value) => !value)}
      >
        <View className={isOpen ? 'rotate-90' : 'rotate-0'}>
          <ChevronRight size={18} color="#687076" />
        </View>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </Pressable>
      {isOpen && <View className="mt-1.5 ml-6">{children}</View>}
    </ThemedView>
  );
}
