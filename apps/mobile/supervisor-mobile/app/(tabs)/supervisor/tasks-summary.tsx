import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import api from '@/src/api/api';

/* ---------------- TYPES ---------------- */

interface Task {
  id: string;
  car_type: string;
  worker_name: string;
  completed_at: string;
}

/* ---------------- CONSTANTS ---------------- */

const DAILY_TARGET = 12;

/* ---------------- SCREEN ---------------- */

export default function DailyTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const completed = tasks.length;
  const remaining = Math.max(DAILY_TARGET - completed, 0);
  const progressPercent = (completed / DAILY_TARGET) * 100;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await api.get('/api/supervisor/tasks?period=daily');
        if (isMounted) {
          setTasks(res.data.data);
        }
      } catch (err) {
        console.log('Failed to load daily tasks', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* DAILY TASK PROGRESS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DAILY TASK PROGRESS</Text>

          <View style={styles.circleWrapper}>
            <View style={styles.circleOuter}>
              <View style={styles.circleProgress} />
              <View style={styles.circleInner}>
                <Text style={styles.circleValue}>
                  {completed}/{DAILY_TARGET}
                </Text>
                <Text style={styles.circleSub}>Cars Cleaned</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat label="Completed" value={String(completed)} />
            <Stat label="Remaining" value={String(remaining)} />
            <Stat label="Target" value={String(DAILY_TARGET)} />
          </View>
        </View>

        {/* DAILY TARGET */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily Task Target</Text>
          <Text style={styles.subText}>Clean {remaining} more cars to reach today’s target</Text>

          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#3DA2CE', '#8ED6F8']}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>

          <Text style={styles.targetText}>Target: {DAILY_TARGET} cars</Text>
        </View>

        {/* PENALTY (OPTIONAL UI) */}
        <View style={[styles.card, styles.penaltyCard]}>
          <View style={styles.row}>
            <AlertCircle size={18} color="#EF4444" />
            <Text style={styles.penaltyTitle}>Late Arrival Penalty</Text>
          </View>
          <Text style={styles.penaltySub}>Applied today at 9:15 AM</Text>
          <Text style={styles.penaltyAmount}>-1 Task Count</Text>
        </View>

        {/* TODAY TASKS */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Today’s Tasks</Text>
            <Text style={styles.date}>{new Date().toDateString()}</Text>
          </View>

          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                worker={task.worker_name}
                car={task.car_type}
                time={task.completed_at}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No tasks completed today</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TaskItem = ({ worker, car, time }: { worker: string; car: string; time: string }) => (
  <View style={styles.taskItem}>
    <View style={styles.avatar}>
      <User size={16} color="#3DA2CE" />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.taskName}>{worker}</Text>
      <Text style={styles.taskSub}>{car}</Text>
      <Text style={styles.taskTime}>Done at {new Date(time).toLocaleTimeString()}</Text>
    </View>

    <Text style={styles.completedBadge}>Completed</Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  circleWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },

  circleOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E6F4FB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  circleProgress: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 10,
    borderColor: '#3DA2CE',
    borderTopColor: 'transparent',
    transform: [{ rotate: '-60deg' }],
  },

  circleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  circleValue: {
    fontSize: 22,
    fontWeight: '700',
  },

  circleSub: {
    fontSize: 12,
    color: '#6B7280',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3DA2CE',
  },

  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },

  subText: {
    fontSize: 12,
    color: '#6B7280',
    marginVertical: 6,
  },

  progressBar: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginTop: 6,
  },

  progressFill: {
    height: '100%',
    borderRadius: 6,
  },

  targetText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },

  penaltyCard: {
    backgroundColor: '#FEF2F2',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  penaltyTitle: {
    fontWeight: '600',
    color: '#B91C1C',
  },

  penaltySub: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 4,
  },

  penaltyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 6,
  },

  date: {
    fontSize: 11,
    color: '#6B7280',
  },

  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
    fontSize: 14,
  },

  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  taskName: {
    fontWeight: '600',
  },

  taskSub: {
    fontSize: 12,
    color: '#6B7280',
  },

  taskTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  completedBadge: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
});
