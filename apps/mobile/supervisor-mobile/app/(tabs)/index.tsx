import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { User, UserCog, Calendar, Wallet, AlertCircle, QrCode } from 'lucide-react-native';
import { router } from 'expo-router';

/* -------------------- ACTION CARD COMPONENT -------------------- */
const ActionCard = ({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) => (
  <Pressable
    style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}
    onPress={onPress}
  >
    <View style={styles.actionIconContainer}>{icon}</View>
    <Text style={styles.actionItemTitle}>{title}</Text>
    <Text style={styles.actionItemSubtitle}>{subtitle}</Text>
  </Pressable>
);

/* -------------------- MAIN SCREEN -------------------- */
export default function HomePage() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#5AB9E0" />

      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={['#5AB9E0', '#3DA2CE']} style={styles.gradient}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* PROFILE HEADER */}
            <View style={styles.profileSection}>
              <View style={styles.profileIcon}>
                <User size={26} color="#3DA2CE" />
              </View>
              <View>
                <Text style={styles.greeting}>Hi, Mahesh Babu</Text>
                <Text style={styles.phoneNumber}>Supervisor</Text>
              </View>
            </View>

            {/* EARNINGS CARD */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Today's Earnings</Text>
              <View style={styles.earningsRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.earningsAmount}>5,580</Text>
                <Text style={styles.earningsCents}>.31</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>30 jobs completed today</Text>
              </View>
            </View>

            {/* TOP ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push('/supervisor/workers')}
              >
                <Text style={styles.actionButtonText}>View Workers</Text>
              </Pressable>

              <Pressable style={styles.actionButton}>
                <QrCode size={20} color="#3DA2CE" />
                <Text style={styles.actionButtonText}>Scan Vehicle</Text>
              </Pressable>
            </View>

            {/* QUICK ACTIONS */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>

              <View style={styles.actionsGrid}>
                <ActionCard
                  icon={<UserCog size={24} color="#3DA2CE" />}
                  title="Live Workers"
                  subtitle="Current Status"
                />

                <ActionCard
                  icon={<Calendar size={24} color="#3DA2CE" />}
                  title="Attendance"
                  subtitle="Clock In / Out"
                />

                <ActionCard
                  icon={<Wallet size={24} color="#3DA2CE" />}
                  title="Earnings"
                  subtitle="Daily Summary"
                />

                <ActionCard
                  icon={<AlertCircle size={24} color="#3DA2CE" />}
                  title="Report Issue"
                  subtitle="Get Help"
                />
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5AB9E0',
  },

  gradient: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },

  /* PROFILE */
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },

  phoneNumber: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },

  /* EARNINGS */
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },

  earningsLabel: {
    color: '#FFF',
    marginBottom: 6,
    fontWeight: '500',
  },

  earningsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  currencySymbol: {
    fontSize: 26,
    color: '#FFF',
    marginTop: 6,
  },

  earningsAmount: {
    fontSize: 46,
    fontWeight: '700',
    color: '#FFF',
  },

  earningsCents: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
  },

  badge: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
  },

  badgeText: {
    fontSize: 12,
    color: '#3DA2CE',
    fontWeight: '600',
  },

  /* TOP BUTTONS */
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  actionButtonText: {
    fontWeight: '600',
    color: '#2C2C2C',
  },

  /* QUICK ACTIONS */
  quickActionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
  },

  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionItem: {
    flexBasis: '48%',
    backgroundColor: '#F8FAFB',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },

  actionItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  actionItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },

  actionItemSubtitle: {
    fontSize: 11,
    color: '#7A7A7A',
  },
});
