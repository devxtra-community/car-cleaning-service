import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBuildingDetails } from '../../services/allAPI';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  UserIcon,
  PencilIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface Floor {
  id: string;
  floor_number: number;
  floor_name: string;
  notes: string | null;
  created_at: string;
}

interface Supervisor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
}

interface Cleaner {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  floor_name: string | null;
  total_tasks: number;
}

interface Statistics {
  totalEmployees: number;
  totalCleaners: number;
  totalSupervisors: number;
  totalTasks: number;
  totalRevenue: number;
  totalTaskAmount: number;
}

interface RevenueTrend {
  month: string;
  revenue: number;
}

interface BuildingDetails {
  id: string;
  building_name: string;
  location: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  created_at: string;
  floors: Floor[];
  supervisors: Supervisor[];
  statistics: Statistics;
  cleaners: Cleaner[];
  revenueTrend: RevenueTrend[];
}

const BuildingDetailsPage = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<BuildingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Replace the entire fetchBuildingDetails section with this:

  const fetchBuildingDetails = useCallback(async () => {
    if (!buildingId) return;

    try {
      setLoading(true);
      const response = await getBuildingDetails(buildingId);

      const buildingData = response.data;

      setData({
        ...buildingData,
        supervisor:
          buildingData.supervisors && buildingData.supervisors.length > 0
            ? buildingData.supervisors[0]
            : null,
      });
    } catch (error) {
      console.error('Error fetching building details:', error);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);
  useEffect(() => {
    fetchBuildingDetails();
  }, [fetchBuildingDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading building details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Building not found</p>
          <button
            onClick={() => navigate('/admin/buildings')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Back to Buildings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/buildings')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{data.building_name}</h1>
                <div className="flex items-center gap-2 mt-1 text-gray-500">
                  <MapPinIcon className="w-4 h-4" />
                  <p>{data.location || 'No location specified'}</p>
                </div>
              </div>
            </div>

            <Link to={`/admin/buildings/${buildingId}/edit`}>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
                <PencilIcon className="w-4 h-4" />
                Edit Building
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Employees"
            value={data.statistics.totalEmployees}
            icon={<UserGroupIcon className="w-6 h-6" />}
            color="blue"
          />
          <SummaryCard
            title="Total Tasks"
            value={data.statistics.totalTasks}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="green"
          />
          <SummaryCard
            title="Total Revenue"
            value={`$${data.statistics.totalRevenue}`}
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            color="emerald"
          />
          <SummaryCard
            title="Floors"
            value={data.floors.length}
            icon={<BuildingOfficeIcon className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'cleaners'}
              onClick={() => setActiveTab('cleaners')}
              label={`Cleaners (${data.cleaners.length})`}
            />
            <TabButton
              active={activeTab === 'floors'}
              onClick={() => setActiveTab('floors')}
              label={`Floors (${data.floors.length})`}
            />
            <TabButton
              active={activeTab === 'revenue'}
              onClick={() => setActiveTab('revenue')}
              label="Revenue Trend"
            />
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'cleaners' && <CleanersTab cleaners={data.cleaners} />}
            {activeTab === 'floors' && <FloorsTab floors={data.floors} />}
            {activeTab === 'revenue' && <RevenueTrendTab trend={data.revenueTrend} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${
      active ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
  </button>
);

const OverviewTab = ({ data }: { data: BuildingDetails }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Building Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
          Building Information
        </h3>
        <InfoRow
          icon={<BuildingOfficeIcon className="w-4 h-4" />}
          label="Building Name"
          value={data.building_name}
        />
        <InfoRow
          icon={<MapPinIcon className="w-4 h-4" />}
          label="Location"
          value={data.location || 'N/A'}
        />
        <InfoRow
          icon={<MapPinIcon className="w-4 h-4" />}
          label="Coordinates"
          value={`${data.latitude}, ${data.longitude}`}
        />
        <InfoRow
          icon={<BuildingOfficeIcon className="w-4 h-4" />}
          label="Radius"
          value={`${data.radius}m`}
        />
        <InfoRow
          icon={<BuildingOfficeIcon className="w-4 h-4" />}
          label="Total Floors"
          value={data.floors.length.toString()}
        />
      </div>

      {/* Supervisor Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-600" />
          Supervisors
        </h3>

        {data.supervisors && data.supervisors.length > 0 ? (
          <div className="space-y-4">
            {data.supervisors.map((supervisor) => (
              <div
                key={supervisor.id}
                className="p-4 bg-white border-blue -50 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  {supervisor.profile_image ? (
                    <img
                      src={supervisor.profile_image}
                      alt={supervisor.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {supervisor.full_name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-gray-900">{supervisor.full_name}</p>
                    <p className="text-sm text-gray-500">{supervisor.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No supervisor assigned</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="text-gray-400 mt-0.5">{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-500 mb-0.5">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  </div>
);

const CleanersTab = ({ cleaners }: { cleaners: Cleaner[] }) => {
  if (cleaners.length === 0) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No cleaners assigned to this building</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cleaners.map((cleaner) => (
        <Link
          key={cleaner.id}
          to={`/admin/cleaners/${cleaner.id}`}
          className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all bg-white hover:border-blue-300"
        >
          <div className="flex items-center gap-4">
            {cleaner.profile_image ? (
              <img
                src={cleaner.profile_image}
                alt={cleaner.full_name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {cleaner.full_name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{cleaner.full_name}</h4>
              <p className="text-sm text-gray-500">{cleaner.floor_name || 'No floor assigned'}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-500">
                  <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                  {cleaner.total_tasks} tasks
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const FloorsTab = ({ floors }: { floors: Floor[] }) => {
  if (floors.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No floors configured</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {floors.map((floor) => (
        <div
          key={floor.id}
          className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all bg-white"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">{floor.floor_number}</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{floor.floor_name}</h4>
              <p className="text-xs text-gray-500">Floor {floor.floor_number}</p>
            </div>
          </div>
          {floor.notes && <p className="text-sm text-gray-600 mt-2">{floor.notes}</p>}
        </div>
      ))}
    </div>
  );
};

const RevenueTrendTab = ({ trend }: { trend: RevenueTrend[] }) => {
  if (trend.length === 0) {
    return (
      <div className="text-center py-12">
        <CurrencyDollarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No revenue data available</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...trend.map((t) => t.revenue));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Last 6 Months Revenue</h3>
      {trend.map((item) => {
        const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

        return (
          <div key={item.month} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{item.month}</span>
              <span className="text-sm font-bold text-blue-600">${item.revenue}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-linear-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BuildingDetailsPage;
