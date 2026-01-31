import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, QrCode, Wallet, ClipboardCheck, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

/* ================= TYPES ================= */

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
};

type QuickCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
};

/* ================= SCREEN ================= */

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#4FB3E8', '#3DA2CE']} style={styles.header}>
        <Text style={styles.hello}>Hi, Rajesh!</Text>
        <Text style={styles.id}>EMP ID: W0678432</Text>

        {/* Stats Box */}
        <View style={styles.statsBox}>
          <View>
            <Text style={styles.statsLabel}>Today Earnings</Text>
            <Text style={styles.statsValue}>₹ 1,580</Text>
          </View>

          <View style={styles.divider} />

          <View>
            <Text style={styles.statsLabel}>Jobs Done</Text>
            <Text style={styles.statsValue}>20</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        <ActionCard
          icon={<Plus color="#1B86C6" />}
          title="Add New Job"
          onPress={() => router.push('/(tabs)/AddJob')}
        />

        <ActionCard icon={<QrCode color="#1B86C6" />} title="Scan Vehicle" />
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.quick}>
        <Text style={styles.quickTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          <QuickCard icon={<Wallet />} title="Incentives" subtitle="450 Pending" />
          <QuickCard icon={<ClipboardCheck />} title="Attendance" subtitle="Check in at 9:00" />
          <QuickCard icon={<Wallet />} title="Earnings" subtitle="450 Pending" />
          <QuickCard icon={<AlertTriangle />} title="Report Problem" />
        </View>
      </View>

      {/* SUPERVISOR FIXED */}
      <View style={styles.supervisorFixed}>
        <View>
          <Text style={{ fontWeight: '600' }}>Sahil Krishna</Text>
          <Text style={{ color: '#777' }}>Supervisor</Text>
        </View>

        <View style={styles.active}>
          <Text style={{ color: '#2ecc71', fontSize: 12 }}>Active</Text>
        </View>
      </View>
    </View>
  );
}

/* ================= COMPONENTS ================= */

function ActionCard({ icon, title, onPress }: ActionCardProps) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.actionText}>{title}</Text>
    </Pressable>
  );
}

function QuickCard({ icon, title, subtitle }: QuickCardProps) {
  return (
    <View style={styles.quickCard}>
      {icon}
      <Text style={{ fontWeight: '600' }}>{title}</Text>
      {subtitle && <Text style={{ color: '#777', fontSize: 12 }}>{subtitle}</Text>}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },

  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  hello: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  id: {
    color: '#eaf6ff',
    fontSize: 12,
  },

  statsBox: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: '80%',
    alignSelf: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
  },

  statsLabel: {
    color: '#eaf6ff',
    fontSize: 12,
    textAlign: 'center',
  },

  statsValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 30,
  },

  actionCard: {
    backgroundColor: '#fff',
    width: width / 2.2,
    height: 65,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1B86C6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B86C6',
  },

  quick: {
    padding: 20,
  },

  quickTitle: {
    fontWeight: '600',
    marginBottom: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  quickCard: {
    backgroundColor: '#fff',
    width: width / 2.3,
    height: 90,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },

  supervisorFixed: {
    position: 'absolute',
    bottom: 105,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },

  active: {
    backgroundColor: '#eafaf1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
});
