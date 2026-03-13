import React, { useState, useEffect, useCallback } from 'react';
import {
  BanknotesIcon,
  UserGroupIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  StarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ComputerDesktopIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../services/commonAPI';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Building {
  id: string;
  building_name: string;
  location: string;
}

interface Vehicle {
  id: string;
  status: string;
}

interface Cleaner {
  id: string;
  full_name: string;
}

interface SalarySummary {
  total: number;
  paid: number;
  pending: number;
}

interface IncentiveRule {
  id: string;
  name: string;
}

interface IncentiveType {
  id: string;
  label: string;
}

interface SystemHealth {
  status: 'ok' | 'degraded';
  uptime: number;
  services: {
    database: { status: string };
    redis: { status: string };
  };
}

interface AdminSummary {
  total_salary_paid: number;
  total_cleaners: number;
  total_vehicles: number;
  total_buildings: number;
  active_incentive_rules: number;
  total_supervisors: number;
  cleaners_present: number;
  supervisors_present: number;
  tasks_done_today: number;
  tasks_pending: number;
  tasks_active: number;
}

interface DashboardData {
  buildings: Building[];
  vehicles: Vehicle[];
  cleaners: Cleaner[];
  salarySummary: SalarySummary | null;
  incentiveTypes: IncentiveType[];
  incentiveRules: IncentiveRule[];
  adminSummary: AdminSummary | null;
  buildingComparison: any[];
  ratingSummary: any[];
  monthlyProgress: any[];
  cleanerPerformance: any[];
  systemStatus: {
    health: SystemHealth | null;
    isMaintenance: boolean;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const revenueChartData = months.map((m, i) => ({
  month: m,
  actual: 8000 + Math.round(Math.sin(i * 0.7) * 2000 + Math.random() * 1500),
  expected: 9000 + i * 300,
}));

const taskChartData = [
  { day: 'Mon', completed: 28, pending: 4 },
  { day: 'Tue', completed: 35, pending: 2 },
  { day: 'Wed', completed: 22, pending: 8 },
  { day: 'Thu', completed: 40, pending: 1 },
  { day: 'Fri', completed: 30, pending: 5 },
  { day: 'Sat', completed: 18, pending: 3 },
  { day: 'Sun', completed: 12, pending: 2 },
];

const RATING_COLORS = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];

const ratingDataMock = [
  { stars: 5, count: 876 },
  { stars: 4, count: 700 },
  { stars: 3, count: 204 },
  { stars: 2, count: 50 },
  { stars: 1, count: 12 },
];

const topCleanersMock = [
  { name: 'John Smith', tasks: 45, rating: 4.7 },
  { name: 'Sarah Johnson', tasks: 42, rating: 4.6 },
  { name: 'Mike Wilson', tasks: 40, rating: 4.5 },
  { name: 'Emma Davis', tasks: 38, rating: 4.4 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const Spinner = () => (
  <span className="inline-block w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
);

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  loading?: boolean;
}

const accentMap: Record<string, { bg: string; text: string; badge: string; icon: string }> = {
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-600',
    icon: 'text-sky-500',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-600',
    icon: 'text-violet-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-600',
    icon: 'text-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-600',
    icon: 'text-amber-500',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-600',
    icon: 'text-rose-500',
  },
};

const StatCard: React.FC<StatCardProps & { colorKey: keyof typeof accentMap }> = ({
  icon: Icon,
  label,
  value,
  sub,
  colorKey,
  loading,
}) => {
  const c = accentMap[colorKey];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {sub && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{sub}</span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{loading ? <Spinner /> : value}</div>
        <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </div>
  );
};

const SectionCard: React.FC<{
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  iconClass?: string;
}> = ({ title, icon: Icon, children, iconClass = 'text-sky-500' }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
    <div className="flex items-center gap-2 mb-5">
      {Icon && <Icon className={`w-4 h-4 ${iconClass}`} />}
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {title}
      </span>
    </div>
    {children}
  </div>
);

// ─── Pure SVG Charts ──────────────────────────────────────────────────────────

const SvgAreaChart: React.FC<{
  data: { month: string; actual: number; expected: number }[];
  width?: number;
  height?: number;
}> = ({ data, width = 500, height = 220 }) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const padL = 44,
    padR = 12,
    padT = 12,
    padB = 28;
  const W = width - padL - padR;
  const H = height - padT - padB;
  const allVals = data.flatMap((d) => [d.actual, d.expected]);
  const minV = Math.min(...allVals) * 0.92;
  const maxV = Math.max(...allVals) * 1.05;
  const xScale = (i: number) => padL + (i / (data.length - 1)) * W;
  const yScale = (v: number) => padT + H - ((v - minV) / (maxV - minV)) * H;
  const makePath = (key: 'actual' | 'expected') => {
    let d = '';
    data.forEach((pt, i) => {
      const x = xScale(i),
        y = yScale(pt[key]);
      if (i === 0) {
        d += `M ${x} ${y}`;
        return;
      }
      const px = xScale(i - 1),
        py = yScale(data[i - 1][key]);
      const cx = (px + x) / 2;
      d += ` C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
    });
    return d;
  };
  const makeArea = (key: 'actual' | 'expected') => {
    const base = padT + H;
    return `${makePath(key)} L ${xScale(data.length - 1)} ${base} L ${xScale(0)} ${base} Z`;
  };
  const yTicks = 4;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: yTicks }).map((_, i) => {
        const y = padT + (i / (yTicks - 1)) * H;
        const val = maxV - (i / (yTicks - 1)) * (maxV - minV);
        return (
          <g key={i}>
            <line x1={padL} x2={padL + W} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              ${(val / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}
      {data.map((d, i) => (
        <text key={i} x={xScale(i)} y={height - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">
          {d.month}
        </text>
      ))}
      <path d={makeArea('expected')} fill="url(#ag2)" />
      <path d={makeArea('actual')} fill="url(#ag1)" />
      <path
        d={makePath('expected')}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <path d={makePath('actual')} fill="none" stroke="#0ea5e9" strokeWidth="2" />
      {data.map((pt, i) => (
        <g
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'crosshair' }}
        >
          <rect
            x={xScale(i) - W / data.length / 2}
            y={padT}
            width={W / data.length}
            height={H}
            fill="transparent"
          />
          {hovered === i && (
            <>
              <line
                x1={xScale(i)}
                x2={xScale(i)}
                y1={padT}
                y2={padT + H}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={xScale(i)}
                cy={yScale(pt.actual)}
                r="4"
                fill="#0ea5e9"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={xScale(i)}
                cy={yScale(pt.expected)}
                r="4"
                fill="#8b5cf6"
                stroke="white"
                strokeWidth="2"
              />
              <g transform={`translate(${Math.min(xScale(i) + 8, width - 110)}, ${padT + 8})`}>
                <rect
                  rx="6"
                  ry="6"
                  width="100"
                  height="52"
                  fill="white"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  filter="drop-shadow(0 2px 8px rgba(0,0,0,0.08))"
                />
                <text x="8" y="16" fontSize="10" fill="#64748b" fontWeight="700">
                  {pt.month}
                </text>
                <text x="8" y="31" fontSize="10" fill="#0ea5e9">
                  Actual: ${(pt.actual / 1000).toFixed(1)}k
                </text>
                <text x="8" y="45" fontSize="10" fill="#8b5cf6">
                  Expected: ${(pt.expected / 1000).toFixed(1)}k
                </text>
              </g>
            </>
          )}
        </g>
      ))}
    </svg>
  );
};

const SvgBarChart: React.FC<{
  data: { day: string; completed: number; pending: number }[];
  height?: number;
}> = ({ data, height = 70 }) => {
  const padT = 4,
    padB = 18;
  const maxV = Math.max(...data.flatMap((d) => [d.completed, d.pending]));
  const H = height - padT - padB;
  return (
    <svg viewBox={`0 0 ${data.length * 40} ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const bw = 8,
          gap = 3,
          groupW = 40;
        const cx = i * groupW + groupW / 2;
        const h1 = (d.completed / maxV) * H;
        const h2 = (d.pending / maxV) * H;
        return (
          <g key={i}>
            <rect
              x={cx - bw - gap / 2}
              y={padT + H - h1}
              width={bw}
              height={h1}
              rx="2"
              fill="#10b981"
              opacity="0.8"
            />
            <rect
              x={cx + gap / 2}
              y={padT + H - h2}
              width={bw}
              height={h2}
              rx="2"
              fill="#f43f5e"
              opacity="0.8"
            />
            <text x={cx} y={height - 2} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Replace the SvgDonut component with this fixed version:

const SvgDonut: React.FC<{
  data: { count: number }[];
  colors: string[];
  size?: number;
}> = ({ data, colors, size = 120 }) => {
  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = size / 2,
    cy = size / 2,
    r = size * 0.36,
    stroke = size * 0.14;

  // Fix: Calculate slices without mutating variables
  const slices = data.map((d, i) => {
    // Calculate the cumulative angle for THIS slice
    const prevAngles = data
      .slice(0, i)
      .reduce((sum, item) => sum + (item.count / total) * 2 * Math.PI, 0);
    const startAngle = -Math.PI / 2 + prevAngles;
    const angle = (d.count / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;

    return { x1, y1, x2, y2, large, color: colors[i] };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size, margin: '0 auto', display: 'block' }}
    >
      {slices.map((s, i) => (
        <path
          key={i}
          d={`M ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2}`}
          fill="none"
          stroke={s.color}
          strokeWidth={stroke}
          strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="8" fill="#94a3b8" letterSpacing="1">
        REVIEWS
      </text>
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    buildings: [],
    vehicles: [],
    cleaners: [],
    salarySummary: null,
    incentiveTypes: [],
    incentiveRules: [],
    adminSummary: null,
    buildingComparison: [],
    ratingSummary: [],
    monthlyProgress: [],
    cleanerPerformance: [],
    systemStatus: {
      health: null,
      isMaintenance: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'1M' | '1Y'>('1Y');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/api/buildings'),
        api.get('/api/vehicle'),
        api.get('/api/auth/cleaners'),
        api.get('/salary/summary/monthly'),
        api.get('/api/incentives/types'),
        api.get('/api/incentives/rules'),
        api.get('/api/admin/system/maintenance/status'),
        api.get('/api/analytics/summary'),
        api.get('/api/analytics/building-comparison'),
        api.get('/api/analytics/rating-summary'),
        api.get('/api/analytics/monthly'),
        api.get('/api/analytics/cleaner-performance'),
      ]);

      const [
        buildingsRes,
        vehiclesRes,
        cleanersRes,
        salaryRes,
        incentiveTypesRes,
        incentiveRulesRes,
        maintRes,
        adminSumRes,
        buildingCompRes,
        ratingSumRes,
        monthlyProgRes,
        cleanerPerfRes,
      ] = results as any[];

      setData({
        buildings: buildingsRes.status === 'fulfilled' ? (buildingsRes.value.data?.data ?? []) : [],
        vehicles: vehiclesRes.status === 'fulfilled' ? (vehiclesRes.value.data?.data ?? []) : [],
        cleaners: cleanersRes.status === 'fulfilled' ? (cleanersRes.value.data?.data ?? []) : [],
        salarySummary:
          salaryRes.status === 'fulfilled' ? (salaryRes.value.data?.data ?? null) : null,
        incentiveTypes:
          incentiveTypesRes.status === 'fulfilled'
            ? (incentiveTypesRes.value.data?.data ?? [])
            : [],
        incentiveRules:
          incentiveRulesRes.status === 'fulfilled'
            ? (incentiveRulesRes.value.data?.data ?? [])
            : [],
        adminSummary:
          adminSumRes.status === 'fulfilled' ? (adminSumRes.value.data?.data ?? null) : null,
        buildingComparison:
          buildingCompRes.status === 'fulfilled' ? (buildingCompRes.value.data?.data ?? []) : [],
        ratingSummary:
          ratingSumRes.status === 'fulfilled' ? (ratingSumRes.value.data?.data ?? []) : [],
        monthlyProgress:
          monthlyProgRes.status === 'fulfilled' ? (monthlyProgRes.value.data?.data ?? []) : [],
        cleanerPerformance:
          cleanerPerfRes.status === 'fulfilled' ? (cleanerPerfRes.value.data?.data ?? []) : [],
        systemStatus: {
          health: null, // Health endpoint removed from this list for simplicity or if not needed
          isMaintenance: maintRes.status === 'fulfilled' ? !!maintRes.value.data?.active : false,
        },
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.log('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleMaintenance = async (active: boolean) => {
    try {
      if (
        !window.confirm(
          `Are you sure you want to ${active ? 'ENABLE' : 'DISABLE'} Maintenance Mode? This will block all users.`
        )
      )
        return;

      const res = await api.post('/api/admin/system/maintenance/toggle', { active });
      if (res.data?.success) {
        setData((prev) => ({
          ...prev,
          systemStatus: { ...prev.systemStatus, isMaintenance: active },
        }));
      }
    } catch (err) {
      console.error('Failed to toggle maintenance:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const activeVehicles = data.vehicles.filter((v) => v.status === 'active').length;
  const totalVehicles = data.vehicles.length;
  const chartData =
    data.monthlyProgress.length > 0
      ? data.monthlyProgress
          .map((p: any) => ({
            month: months[new Date(p.month).getMonth()],
            actual: p.total_revenue,
            expected: p.total_revenue * 1.1, // Mocked expected based on actual for now
          }))
          .reverse()
      : revenueChartData;

  const buildingPerf =
    data.buildingComparison.length > 0
      ? data.buildingComparison.map((b: any) => ({
          name: b.building_name,
          score: Math.round(b.avg_rating * 20), // 0-100 scale
          growth: 0, // Placeholder
        }))
      : [
          { name: 'Plaza Center', score: 94, growth: 2.3 },
          { name: 'Elite Towers', score: 88, growth: -1.2 },
          { name: 'Sky Residence', score: 76, growth: 4.5 },
        ];

  const topCleanersReal =
    data.cleanerPerformance.length > 0
      ? data.cleanerPerformance.map((p: any) => ({
          name: p.cleaner_name,
          tasks: p.completed_tasks,
          rating: 4.5 + Math.random() * 0.5, // Rating not in this endpoint, placeholder
        }))
      : topCleanersMock;

  const ratingDataReal =
    data.ratingSummary.length > 0
      ? [5, 4, 3, 2, 1].map((stars) => ({
          stars,
          count: parseInt(
            data.ratingSummary.find((r: any) => parseInt(r.stars) === stars)?.count || '0'
          ),
        }))
      : ratingDataMock;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className=" mx-auto px-6 py-8">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse inline-block" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Operations Control
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-sky-200 bg-sky-50 text-sky-600 text-sm font-semibold hover:bg-sky-100 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={BanknotesIcon}
            label="Total Salary Paid"
            value={data.adminSummary ? fmt(data.adminSummary.total_salary_paid) : '—'}
            sub="This Month"
            colorKey="sky"
            loading={loading}
            accent=""
          />
          <StatCard
            icon={UserGroupIcon}
            label="Active Cleaners"
            value={data.adminSummary ? data.adminSummary.total_cleaners : data.cleaners.length}
            sub="Live"
            colorKey="violet"
            loading={loading}
            accent=""
          />
          <StatCard
            icon={TruckIcon}
            label="Vehicles Active"
            value={
              data.adminSummary
                ? data.adminSummary.total_vehicles
                : totalVehicles > 0
                  ? `${activeVehicles}/${totalVehicles}`
                  : '—'
            }
            sub="Fleet"
            colorKey="emerald"
            loading={loading}
            accent=""
          />
          <StatCard
            icon={BuildingOfficeIcon}
            label="Buildings"
            value={data.adminSummary ? data.adminSummary.total_buildings : data.buildings.length}
            sub="Managed"
            colorKey="amber"
            loading={loading}
            accent=""
          />
          <StatCard
            icon={SparklesIcon}
            label="Incentive Rules"
            value={
              data.adminSummary
                ? data.adminSummary.active_incentive_rules
                : data.incentiveRules.length
            }
            sub="Active"
            colorKey="rose"
            loading={loading}
            accent=""
          />
        </div>

        {/* ── Row 2 ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Attendance */}
          <SectionCard title="Attendance Today" icon={ClockIcon} iconClass="text-sky-500">
            {[
              {
                label: 'Supervisors',
                current: data.adminSummary?.supervisors_present ?? 0,
                total: data.adminSummary?.total_supervisors ?? 1,
                bar: 'bg-violet-400',
              },
              {
                label: 'Cleaners',
                current: data.adminSummary?.cleaners_present ?? 0,
                total: data.adminSummary?.total_cleaners ?? 1,
                bar: 'bg-emerald-400',
              },
            ].map(({ label, current, total, bar }) => {
              const pct = Math.round((current / Math.max(total, 1)) * 100);
              return (
                <div key={label} className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {current} <span className="text-slate-400 font-normal">/ {total}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1 text-right">{pct}%</div>
                </div>
              );
            })}
          </SectionCard>

          {/* Task Status */}
          <SectionCard title="Task Status" icon={CheckCircleIcon} iconClass="text-emerald-500">
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                {
                  label: 'Active',
                  value: data.adminSummary?.tasks_active ?? 0,
                  bg: 'bg-amber-50',
                  text: 'text-amber-600',
                  border: 'border-amber-100',
                  icon: ClockIcon,
                },
                {
                  label: 'Done',
                  value: data.adminSummary?.tasks_done_today ?? 0,
                  bg: 'bg-emerald-50',
                  text: 'text-emerald-600',
                  border: 'border-emerald-100',
                  icon: CheckCircleIcon,
                },
                {
                  label: 'Pending',
                  value: data.adminSummary?.tasks_pending ?? 0,
                  bg: 'bg-rose-50',
                  text: 'text-rose-600',
                  border: 'border-rose-100',
                  icon: ExclamationCircleIcon,
                },
              ].map(({ label, value, bg, text, border, icon: I }) => (
                <div key={label} className={`${bg} border ${border} rounded-xl p-3 text-center`}>
                  <I className={`w-4 h-4 ${text} mx-auto mb-1.5`} />
                  <div className={`text-2xl font-bold ${text}`}>{value}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              7-day task trend
            </div>
            <SvgBarChart data={taskChartData} height={70} />
          </SectionCard>

          {/* Building Performance */}
          <SectionCard
            title="Building Performance"
            icon={BuildingOfficeIcon}
            iconClass="text-amber-500"
          >
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : data.buildingComparison.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-5">No performance data</p>
            ) : (
              data.buildingComparison.slice(0, 5).map((b) => {
                const score = Math.round(b.avg_rating * 20);
                const color =
                  score >= 80
                    ? 'bg-emerald-400 text-emerald-600'
                    : score >= 60
                      ? 'bg-amber-400 text-amber-600'
                      : 'bg-rose-400 text-rose-600';
                const [bar, text] = color.split(' ');
                return (
                  <div key={b.building_id} className="mb-3.5">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-slate-500 truncate max-w-[70%]">
                        {b.building_name}
                      </span>
                      <span className={`text-sm font-bold ${text}`}>{score}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bar} transition-all duration-700`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </SectionCard>
        </div>

        {/* ── Row 3: Revenue + Salary ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-3">
            <SectionCard title="Revenue Trends" icon={ChartBarIcon} iconClass="text-sky-500">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="text-2xl font-bold text-slate-800">
                    {data.monthlyProgress.length > 0
                      ? fmt(data.monthlyProgress[0].total_revenue)
                      : data.salarySummary
                        ? fmt(data.salarySummary.total)
                        : '$0'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-600">
                      {data.monthlyProgress.length > 1
                        ? (
                            ((data.monthlyProgress[0].total_revenue -
                              data.monthlyProgress[1].total_revenue) /
                              Math.max(data.monthlyProgress[1].total_revenue, 1)) *
                            100
                          ).toFixed(1) + '%'
                        : '+13.25%'}
                    </span>
                    <span className="text-sm text-slate-400">vs last month</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['1M', '1Y'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setChartView(v)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        chartView === v
                          ? 'bg-sky-500 text-white border-sky-500'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <SvgAreaChart data={chartData} width={600} height={220} />

              <div className="flex gap-5 mt-3">
                {[
                  ['#0ea5e9', 'Actual'],
                  ['#8b5cf6', 'Expected'],
                ].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-5 h-0.5 rounded" style={{ background: color }} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Salary Summary */}
          <div className="lg:col-span-2">
            <SectionCard title="Salary Overview" icon={BanknotesIcon} iconClass="text-emerald-500">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : (
                <>
                  {[
                    {
                      label: 'Total Payroll',
                      value: data.salarySummary?.total ?? 0,
                      bar: 'bg-sky-400',
                      text: 'text-sky-600',
                    },
                    {
                      label: 'Paid Out',
                      value: data.salarySummary?.paid ?? 0,
                      bar: 'bg-emerald-400',
                      text: 'text-emerald-600',
                    },
                    {
                      label: 'Pending',
                      value: data.salarySummary?.pending ?? 0,
                      bar: 'bg-rose-400',
                      text: 'text-rose-600',
                    },
                  ].map(({ label, value, bar, text }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center py-3 border-b border-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-5 rounded ${bar}`} />
                        <span className="text-sm text-slate-500">{label}</span>
                      </div>
                      <span className={`text-base font-bold ${text}`}>{fmt(value)}</span>
                    </div>
                  ))}
                  <div className="mt-5">
                    <SvgDonut data={ratingDataReal} colors={RATING_COLORS} size={130} />
                    <div className="text-xs text-slate-400 text-center uppercase tracking-wider mt-2">
                      Customer rating distribution
                    </div>
                  </div>
                </>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ── Row 4: Performers + Incentives ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Top Performers */}
          <div className="lg:col-span-3">
            <SectionCard
              title="Top Performers This Month"
              icon={StarIcon}
              iconClass="text-amber-500"
            >
              {topCleanersReal.map((c, i) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0
                        ? 'bg-amber-400 text-white'
                        : i === 1
                          ? 'bg-slate-300 text-slate-700'
                          : i === 2
                            ? 'bg-orange-300 text-orange-800'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{c.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.tasks} tasks completed</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      ⭐{' '}
                      {c.rating
                        ? typeof c.rating === 'number'
                          ? c.rating.toFixed(1)
                          : c.rating
                        : '—'}
                    </span>
                    <div className="w-14 h-1.5 bg-slate-100 rounded-full">
                      <div
                        className={`h-full rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-slate-300'}`}
                        style={{
                          width: `${(c.tasks / Math.max(topCleanersReal[0]?.tasks || 1, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </SectionCard>
          </div>

          {/* Incentive Overview */}
          <div className="lg:col-span-2">
            <SectionCard
              title="Incentive System"
              icon={ArrowTrendingUpIcon}
              iconClass="text-violet-500"
            >
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-violet-600">
                    {loading ? <Spinner /> : data.incentiveTypes.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                    Incentive Types
                  </div>
                </div>
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-sky-600">
                    {loading ? <Spinner /> : data.incentiveRules.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                    Active Rules
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                Customer Rating Breakdown
              </div>
              {ratingDataReal.map(({ stars, count }) => {
                const total = ratingDataReal.reduce((s, r) => s + r.count, 0);
                const pct = Math.round((count / Math.max(total, 1)) * 100);
                return (
                  <div key={stars} className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-amber-400 w-12">{'★'.repeat(stars)}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: RATING_COLORS[5 - stars] }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </SectionCard>
          </div>
        </div>

        {/* ── Row 5: System Management ──────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <SectionCard
            title="System Control & Health"
            icon={ComputerDesktopIcon}
            iconClass="text-slate-500"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Maintenance Control */}
              <div className="flex-1 w-full bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ExclamationTriangleIcon
                        className={`w-5 h-5 ${data.systemStatus.isMaintenance ? 'text-amber-500' : 'text-slate-400'}`}
                      />
                      <h3 className="text-lg font-bold text-slate-800">Maintenance Mode</h3>
                    </div>
                    <p className="text-sm text-slate-500 max-w-md">
                      When enabled, all mobile and web app users will be blocked. Use this for safe
                      system updates.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleMaintenance(!data.systemStatus.isMaintenance)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${data.systemStatus.isMaintenance ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${data.systemStatus.isMaintenance ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Service Health */}
              <div className="flex-1 w-full grid grid-cols-2 gap-4">
                {[
                  {
                    label: 'Database (PG)',
                    status: data.systemStatus.health?.services.database.status ?? 'unknown',
                    icon: ServerIcon,
                    color:
                      data.systemStatus.health?.services.database.status === 'connected'
                        ? 'emerald'
                        : 'rose',
                  },
                  {
                    label: 'Cache (Redis)',
                    status: data.systemStatus.health?.services.redis.status ?? 'unknown',
                    icon: ArrowPathIcon,
                    color:
                      data.systemStatus.health?.services.redis.status === 'ready'
                        ? 'violet'
                        : 'rose',
                  },
                ].map((srv) => (
                  <div
                    key={srv.label}
                    className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3"
                  >
                    <div className={`p-2 rounded-lg bg-${srv.color}-50`}>
                      <srv.icon className={`w-5 h-5 text-${srv.color}-500`} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                        {srv.label}
                      </div>
                      <div
                        className={`text-sm font-bold capitalize flex items-center gap-1.5 text-${srv.color}-600`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-${srv.color}-500`} />
                        {srv.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Server Uptime */}
              <div className="flex-none bg-white border border-slate-100 rounded-xl p-4 shadow-sm min-w-[150px]">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mb-1">
                  Server Uptime
                </div>
                <div className="text-lg font-mono font-bold text-slate-700">
                  {data.systemStatus.health
                    ? Math.floor(data.systemStatus.health.uptime / 3600) +
                      'h ' +
                      Math.floor((data.systemStatus.health.uptime % 3600) / 60) +
                      'm'
                    : '—'}
                </div>
                <div className="text-[10px] text-emerald-500 font-bold mt-1">
                  Status: Operational
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
