import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, QrCode, Wallet, ClipboardCheck, AlertTriangle } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../src/api/api';

/* ================= TYPES ================= */

type Job = {
  id: string;
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_color: string;
  car_type: string;
  car_image_url?: string | null;
};

type Worker = {
  name: string;
  empId: string;
  jobsDone: number;
  totalRevenue: number;
};

interface AlertProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
}

interface QuickCardProps {
  icon: React.ReactNode;
  title: string;
}

interface JobItemProps {
  label: string;
  value: string;
}

/* ================= CUSTOM ALERT ================= */

function CustomAlert({ visible, onCancel, onConfirm }: AlertProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={alert.overlay}>
        <View style={alert.card}>
          <Text style={alert.title}>Complete Job</Text>
          <Text style={alert.message}>Mark this job as completed?</Text>

          <View style={alert.row}>
            <Pressable onPress={onCancel}>
              <Text style={alert.cancel}>Cancel</Text>
            </Pressable>

            <Pressable onPress={onConfirm} style={alert.okBtn}>
              <Text style={alert.okText}>Yes</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================= SCREEN ================= */

export default function HomeScreen() {
  const router = useRouter();

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [worker, setWorker] = useState<Worker>({
    name: '',
    empId: '',
    jobsDone: 0,
    totalRevenue: 0,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  /* ================= LOADERS (DECLARE FIRST) ================= */

  /* ================= LOADERS (DECLARE FIRST) ================= */
  const loadDashboard = async () => {
    try {
      const res = await api.get('/api/auth/profile'); // Assuming profile endpoint gives dashboard data
      if (res.data.success) {
        setWorker({
          name: res.data.data.full_name,
          empId: res.data.data.document_id,
          jobsDone: res.data.data.total_tasks || 0,
          totalRevenue: res.data.data.total_earning || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const loadJob = async () => {
    try {
      const res = await api.get('/api/tasks/my');
      setActiveJob(res.data?.[0] || null);
    } catch (error) {
      console.error('Failed to load job:', error);
    }
  };

  /* ================= FOCUS REFRESH ================= */

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        await Promise.all([loadJob(), loadDashboard()]);
      };
      fetch();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadJob(), loadDashboard()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#4FB3E8', '#3DA2CE']} style={styles.header}>
        <Text style={styles.hello}>Hi, {worker.name || 'Worker'} 👋</Text>
        <Text style={styles.id}>EMP ID: {worker.empId}</Text>

        <View style={styles.statsBox}>
          <View style={styles.statItem}>
            <Text style={styles.statsLabel}>Jobs Done</Text>
            <Text style={styles.statsValue}>{worker.jobsDone}</Text>
          </View>

          <View style={styles.statsDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statsLabel}>Revenue</Text>
            <Text style={styles.statsValue}>₹ {worker.totalRevenue}</Text>
          </View>
        </View>
      </LinearGradient>

      {!activeJob && (
        <View style={styles.actions}>
          <ActionCard
            icon={<Plus size={18} color="#fff" />}
            title="Add Job"
            onPress={() => router.push('/(tabs)/AddJob')}
          />
          <ActionCard icon={<QrCode size={18} color="#fff" />} title="Scan" />
        </View>
      )}

      {activeJob && (
        <View style={styles.jobCard}>
          {activeJob.car_image_url && (
            <Image source={{ uri: activeJob.car_image_url }} style={styles.jobImage} />
          )}

          <View style={styles.jobGrid}>
            <JobItem label="Owner" value={activeJob.owner_name} />
            <JobItem label="Phone" value={activeJob.owner_phone} />
            <JobItem label="Vehicle" value={activeJob.car_number} />
            <JobItem label="Model" value={activeJob.car_model} />
            <JobItem label="Color" value={activeJob.car_color} />
            <JobItem label="Type" value={activeJob.car_type} />
          </View>

          <Pressable style={styles.completeBtn} onPress={() => setShowAlert(true)}>
            <Text style={styles.completeText}>Mark Completed</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.quick}>
        <Text style={styles.quickTitle}>Quick Actions</Text>

        <View style={styles.grid}>
          <QuickCard icon={<Wallet />} title="Earnings" />
          <QuickCard icon={<ClipboardCheck />} title="Attendance" />
          <QuickCard icon={<AlertTriangle />} title="Report" />
        </View>
      </View>

      <CustomAlert
        visible={showAlert}
        onCancel={() => setShowAlert(false)}
        onConfirm={async () => {
          await api.patch(`/tasks/${activeJob?.id}/complete`);
          setActiveJob(null);
          // loadDashboard();
          setShowAlert(false);
        }}
      />

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

/* ================= SMALL COMPONENTS ================= */

const ActionCard = ({ icon, title, onPress }: ActionCardProps) => (
  <Pressable onPress={onPress} style={styles.actionWrap}>
    <LinearGradient colors={['#4FB3E8', '#1B86C6']} style={styles.actionCard}>
      {icon}
      <Text style={styles.actionText}>{title}</Text>
    </LinearGradient>
  </Pressable>
);

const QuickCard = ({ icon, title }: QuickCardProps) => (
  <View style={styles.quickCard}>
    {icon}
    <Text style={{ fontWeight: '600' }}>{title}</Text>
  </View>
);

const JobItem = ({ label, value }: JobItemProps) => (
  <View style={styles.jobItem}>
    <Text style={styles.jobLabel}>{label}</Text>
    <Text style={styles.jobValue}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fb' },

  header: {
    paddingTop: 60,
    paddingBottom: 34,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },

  hello: { color: '#fff', fontSize: 20, fontWeight: '700', paddingHorizontal: 24 },
  id: { color: '#eaf6ff', fontSize: 12, paddingHorizontal: 24, marginTop: 4 },

  statsBox: {
    marginTop: 24,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 26,
  },

  statItem: { alignItems: 'center' },
  statsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.4)' },
  statsLabel: { color: '#fff', fontSize: 12 },
  statsValue: { color: '#fff', fontSize: 24, fontWeight: '700' },

  actions: { flexDirection: 'row', marginHorizontal: 20, marginTop: 24 },
  actionWrap: { flex: 1 },

  actionCard: {
    marginHorizontal: 6,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  actionText: { color: '#fff', fontWeight: '600' },

  jobCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 22,
  },

  jobImage: { width: '100%', height: 200, borderRadius: 14, marginBottom: 12 },

  jobGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  jobItem: {
    width: '48%',
    backgroundColor: '#f7f9fc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  jobLabel: { fontSize: 11, color: '#888' },
  jobValue: { fontWeight: '600' },

  completeBtn: {
    backgroundColor: '#1B86C6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  completeText: { color: '#fff', fontWeight: '600' },

  quick: { paddingHorizontal: 20, marginTop: 30 },
  quickTitle: { fontWeight: '600', marginBottom: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  quickCard: {
    backgroundColor: '#fff',
    width: '48%',
    height: 90,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
});

/* ================= ALERT ================= */

const alert = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { width: '80%', backgroundColor: '#fff', borderRadius: 18, padding: 20 },
  title: { fontSize: 17, fontWeight: '700' },
  message: { color: '#666', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  cancel: { color: '#888', fontWeight: '600' },
  okBtn: {
    backgroundColor: '#1B86C6',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  okText: { color: '#fff', fontWeight: '600' },
});
