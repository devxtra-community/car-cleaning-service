import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { CloudOff } from 'lucide-react-native';
import { syncQueue } from '../src/api/offlineQueue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OfflineBanner() {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [slideAnim] = useState(new Animated.Value(-100)); // Start hidden off-screen
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: any) => {
            const currentlyConnected = state.isConnected && state.isInternetReachable;

            if (isConnected === false && currentlyConnected === true) {
                // App just came back online. Trigger a sync.
                console.log('[Network] Back online! Triggering sync queue.');
                syncQueue().then((res: any) => {
                    if (res.synced > 0) {
                        console.log(`[OfflineQueue] Successfully synced ${res.synced} items.`);
                    }
                });
            }

            setIsConnected(!!currentlyConnected);
        });

        return () => unsubscribe();
    }, [isConnected]);

    useEffect(() => {
        if (isConnected === false) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 0,
                speed: 12
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isConnected, slideAnim]);

    if (isConnected === true) return null;

    return (
        <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }], top: insets.top }]}>
            <CloudOff color="#fff" size={18} />
            <Text style={styles.text}>
                You're offline. Changes will save locally and sync when connected.
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#DC2626', // Red-600
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    text: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        flexShrink: 1,
    },
});
