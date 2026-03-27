import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCleanerFullDetails } from '../../services/allAPI';
import { useAlert } from '../../context/AlertContext';
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  UserIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  TrophyIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  PhotoIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface CleanerTask {
  id: string;
  vehicle_type: string | null;
  car_number: string | null;
  car_model: string | null;
  car_color: string | null;
  car_type: string | null;
  building_name: string | null;
  building_location: string | null;
  floor_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  task_amount: string;
  final_price: string | null;
  status: string;
  before_photo_url: string | null;
  after_photo_url: string | null;
  after_wash_image_url: string | null;
  car_image_url: string | null;
  rating: number | null;
  comment: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  payment_method: string | null;
  created_at: string;
}

interface CleanerIncentive {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

interface CleanerPenalty {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

interface AssignedVehicle {
  id: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string;
}

interface AssignmentHistory {
  id: string;
  assignment_type: 'supervisor' | 'floor';
  previous_value: string | null;
  new_value: string | null;
  changed_by_name: string | null;
  prev_supervisor_name: string | null;
  current_supervisor_name: string | null;
  prev_floor_name: string | null;
  current_floor_name: string | null;
  created_at: string;
}

interface CleanerDetailsResponse {
  cleanerId: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  nationality: string | null;
  documentId: string | null;
  baseSalary: number;
  profileImage: string | null;
  joiningDate: string | null;
  buildingName: string | null;
  buildingLocation: string | null;
  floorName: string | null;
  supervisorName: string | null;
  summary: {
    totalTasks: number;
    totalTaskAmount: number;
    totalIncentives: number;
    totalPenalties: number;
    netEarning: number;
  };
  tasks: CleanerTask[];
  incentives: CleanerIncentive[];
  penalties: CleanerPenalty[];
  assignedVehicles: AssignedVehicle[];
  assignmentHistory: AssignmentHistory[];
}

const CleanerDetails = () => {
  const { cleanerId } = useParams<{ cleanerId: string }>();
  const [data, setData] = useState<CleanerDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CleanerTask | null>(null);

  const fetchData = useCallback(async () => {
    if (!cleanerId) return;

    try {
      setLoading(true);
      const response = await getCleanerFullDetails(cleanerId, {
        date: selectedDate || undefined,
      });
      console.log(response);
      setData(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      console.log('ERROR RESPONSE:', err.response?.data);
    } finally {
      setLoading(false);
    }
  }, [cleanerId, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearFilter = () => {
    setSelectedDate('');
    setTimeout(fetchData, 0);
  };

  const openImageModal = (task: CleanerTask) => {
    setSelectedTask(task);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading cleaner details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">No Data Found</p>
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
              {data.profileImage ? (
                <img
                  src={data.profileImage}
                  alt={data.fullName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-100">
                  {data.fullName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{data.fullName}</h1>
                <p className="text-gray-500 mt-1">ID: {data.cleanerId.slice(0, 8)}...</p>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
              <CalendarIcon className="w-5 h-5 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1 text-gray-700"
              />
              <button
                onClick={fetchData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                Apply
              </button>
              {selectedDate && (
                <button
                  onClick={handleClearFilter}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <SummaryCard
            title="Total Tasks"
            value={data.summary.totalTasks}
            icon={<CheckCircleIcon className="w-6 h-6" />}
            color="blue"
          />
          <SummaryCard
            title="Task Amount"
            value={`$${data.summary.totalTaskAmount.toFixed(2)}`}
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
            color="green"
          />
          <SummaryCard
            title="Incentives"
            value={`$${data.summary.totalIncentives.toFixed(2)}`}
            icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
            color="emerald"
          />
          <SummaryCard
            title="Penalties"
            value={`$${data.summary.totalPenalties.toFixed(2)}`}
            icon={<ArrowTrendingDownIcon className="w-6 h-6" />}
            color="red"
          />
          <SummaryCard
            title="Net Earning"
            value={`$${data.summary.netEarning.toFixed(2)}`}
            icon={<TrophyIcon className="w-6 h-6" />}
            color={data.summary.netEarning >= 0 ? 'purple' : 'red'}
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
              active={activeTab === 'tasks'}
              onClick={() => setActiveTab('tasks')}
              label={`Tasks (${data.tasks.length})`}
            />
            <TabButton
              active={activeTab === 'incentives'}
              onClick={() => setActiveTab('incentives')}
              label={`Incentives (${data.incentives.length})`}
            />
            <TabButton
              active={activeTab === 'penalties'}
              onClick={() => setActiveTab('penalties')}
              label={`Penalties (${data.penalties.length})`}
            />
            <TabButton
              active={activeTab === 'vehicles'}
              onClick={() => setActiveTab('vehicles')}
              label={`Vehicles (${data.assignedVehicles.length})`}
            />
            <TabButton
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              label="History"
            />
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <Overview data={data} />}
            {activeTab === 'tasks' && <TasksTab tasks={data.tasks} onViewImages={openImageModal} />}
            {activeTab === 'incentives' && <IncentivesTab incentives={data.incentives} />}
            {activeTab === 'penalties' && <PenaltiesTab penalties={data.penalties} />}
            {activeTab === 'vehicles' && (
              <VehiclesTab
                cleanerId={data.cleanerId}
                vehicles={data.assignedVehicles}
                onRefresh={fetchData}
              />
            )}
            {activeTab === 'history' && <HistoryTab history={data.assignmentHistory} />}
          </div>
        </div>
      </div>

      {/* Image Verification Modal */}
      {imageModalOpen && selectedTask && (
        <ImageVerificationModal task={selectedTask} onClose={closeImageModal} />
      )}
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
    red: 'bg-red-50 text-red-600 border-red-100',
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
    className={`px-6 py-4 font-medium transition-colors relative whitespace-nowrap ${active ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
  </button>
);

const Overview = ({ data }: { data: CleanerDetailsResponse }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-600" />
          Personal Information
        </h3>
        <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Full Name" value={data.fullName} />
        <InfoRow icon={<EnvelopeIcon className="w-4 h-4" />} label="Email" value={data.email} />
        <InfoRow
          icon={<PhoneIcon className="w-4 h-4" />}
          label="Phone"
          value={data.phone || 'N/A'}
        />
        <InfoRow
          icon={<UserIcon className="w-4 h-4" />}
          label="Age"
          value={data.age?.toString() || 'N/A'}
        />
        <InfoRow
          icon={<MapPinIcon className="w-4 h-4" />}
          label="Nationality"
          value={data.nationality || 'N/A'}
        />
        <InfoRow
          icon={<UserIcon className="w-4 h-4" />}
          label="Document ID"
          value={data.documentId || 'N/A'}
        />
        <InfoRow
          icon={<CurrencyDollarIcon className="w-4 h-4" />}
          label="Base Salary"
          value={`$${data.baseSalary}`}
        />
        <InfoRow
          icon={<CalendarIcon className="w-4 h-4" />}
          label="Joining Date"
          value={data.joiningDate ? new Date(data.joiningDate).toLocaleDateString() : 'N/A'}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
          Work Assignment
        </h3>
        <InfoRow
          icon={<BuildingOfficeIcon className="w-4 h-4" />}
          label="Building"
          value={data.buildingName || 'N/A'}
        />
        <InfoRow
          icon={<MapPinIcon className="w-4 h-4" />}
          label="Location"
          value={data.buildingLocation || 'N/A'}
        />
        <InfoRow
          icon={<BuildingOfficeIcon className="w-4 h-4" />}
          label="Floor"
          value={data.floorName || 'N/A'}
        />
        <InfoRow
          icon={<UserIcon className="w-4 h-4" />}
          label="Supervisor"
          value={data.supervisorName || 'N/A'}
        />
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

const TasksTab = ({
  tasks,
  onViewImages,
}: {
  tasks: CleanerTask[];
  onViewImages: (task: CleanerTask) => void;
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const beforeImage = task.before_photo_url || task.car_image_url;
        const afterImage = task.after_photo_url || task.after_wash_image_url;

        return (
          <div
            key={task.id}
            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all bg-white"
          >
            {/* Task Header */}
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${task.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : task.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-700'
                        : task.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {task.status}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4" />
                    {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Final Price</p>
                    <p className="text-xl font-bold text-blue-600">
                      ${task.final_price || task.task_amount || '0'}
                    </p>
                  </div>
                  {(beforeImage || afterImage) && (
                    <button
                      onClick={() => onViewImages(task)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <PhotoIcon className="w-4 h-4" />
                      Verify Images
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Task Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Vehicle Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
                    Vehicle Details
                  </h4>
                  <DetailItem label="Car Type" value={task.car_type || 'N/A'} />
                  <DetailItem label="Model" value={task.car_model || 'N/A'} />
                  <DetailItem label="Number" value={task.car_number || 'N/A'} />
                  <DetailItem label="Color" value={task.car_color || 'N/A'} />
                </div>

                {/* Owner Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
                    Owner Details
                  </h4>
                  <DetailItem label="Name" value={task.owner_name || 'N/A'} />
                  <DetailItem label="Phone" value={task.owner_phone || 'N/A'} />
                  <DetailItem label="Payment" value={task.payment_method || 'N/A'} />
                </div>

                {/* Location & Time */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
                    Location & Time
                  </h4>
                  <DetailItem label="Building" value={task.building_name || 'N/A'} />
                  <DetailItem label="Floor" value={task.floor_name || 'N/A'} />
                  {task.completed_at && (
                    <DetailItem
                      label="Completed"
                      value={new Date(task.completed_at).toLocaleString()}
                    />
                  )}
                </div>
              </div>

              {/* Rating Section */}
              {task.rating && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={
                              i < task.rating! ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{task.rating}/5</span>
                    </div>
                    {task.comment && (
                      <p className="text-sm text-gray-600 italic flex-1">"{task.comment}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

const IncentivesTab = ({ incentives }: { incentives: CleanerIncentive[] }) => {
  if (incentives.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowTrendingUpIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No incentives found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incentives.map((incentive) => (
        <div
          key={incentive.id}
          className="flex items-center justify-between p-5 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{incentive.reason || 'Incentive'}</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(incentive.created_at).toLocaleDateString()} at{' '}
                {new Date(incentive.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">+${incentive.amount}</p>
        </div>
      ))}
    </div>
  );
};

const PenaltiesTab = ({ penalties }: { penalties: CleanerPenalty[] }) => {
  if (penalties.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowTrendingDownIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No penalties found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {penalties.map((penalty) => (
        <div
          key={penalty.id}
          className="flex items-center justify-between p-5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{penalty.reason || 'Penalty'}</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(penalty.created_at).toLocaleDateString()} at{' '}
                {new Date(penalty.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">-${penalty.amount}</p>
        </div>
      ))}
    </div>
  );
};

const ImageVerificationModal = ({ task, onClose }: { task: CleanerTask; onClose: () => void }) => {
  const beforeImage = task.before_photo_url || task.car_image_url;
  const afterImage = task.after_photo_url || task.after_wash_image_url;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Task Image Verification</h2>
            <p className="text-blue-100 text-sm mt-1">Task ID: {task.id.slice(0, 8)}...</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Task Info Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Vehicle</p>
                <p className="font-semibold text-gray-900">{task.car_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Car Number</p>
                <p className="font-semibold text-gray-900">{task.car_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Owner</p>
                <p className="font-semibold text-gray-900">{task.owner_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="font-semibold text-blue-600">
                  ${task.final_price || task.task_amount}
                </p>
              </div>
            </div>
          </div>

          {/* Image Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before Image */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Before Cleaning</h3>
                {!beforeImage && <span className="text-sm text-red-500">No image available</span>}
              </div>
              {beforeImage ? (
                <div className="relative group">
                  <img
                    src={beforeImage}
                    alt="Before"
                    className="w-full h-96 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No before image</p>
                  </div>
                </div>
              )}
            </div>

            {/* After Image */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">After Cleaning</h3>
                {!afterImage && <span className="text-sm text-red-500">No image available</span>}
              </div>
              {afterImage ? (
                <div className="relative group">
                  <img
                    src={afterImage}
                    alt="After"
                    className="w-full h-96 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No after image</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const VehiclesTab = ({ cleanerId, vehicles, onRefresh }: { cleanerId: string, vehicles: AssignedVehicle[], onRefresh: () => void }) => {
  const { showAlert, showConfirm, showToast } = useAlert();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    car_number: '',
    car_model: '',
    car_type: 'Sedan',
    car_color: '',
    owner_name: '',
    owner_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const { assignVehicle } = await import('../../services/allAPI');
      await assignVehicle({ ...form, cleaner_id: cleanerId });
      setShowForm(false);
      setForm({ car_number: '', car_model: '', car_type: 'Sedan', car_color: '', owner_name: '', owner_phone: '' });
      onRefresh();
    } catch (err) {
      showToast('Failed to assign vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to unassign this vehicle?'))) return;
    try {
      const { unassignVehicle } = await import('../../services/allAPI');
      await unassignVehicle(id);
      onRefresh();
    } catch (err) {
      showToast('Failed to unassign vehicle', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Permanent Vehicle Assignments</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Car Number*</label>
            <input
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={form.car_number}
              onChange={e => setForm({ ...form, car_number: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Model*</label>
            <input
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={form.car_model}
              onChange={e => setForm({ ...form, car_model: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Type*</label>
            <select
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={form.car_type}
              onChange={e => setForm({ ...form, car_type: e.target.value })}
            >
              <option>Sedan</option>
              <option>SUV</option>
              <option>Luxury</option>
              <option>Hatchback</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-3 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Assign Vehicle'}
          </button>
        </form>
      )}

      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">No permanent vehicles assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm">
              <div>
                <p className="font-bold text-gray-900">{v.car_number}</p>
                <p className="text-sm text-gray-500">{v.car_model} ({v.car_type})</p>
                {v.owner_name && <p className="text-xs text-gray-400 mt-1">Owner: {v.owner_name}</p>}
              </div>
              <button
                onClick={() => handleUnassign(v.id)}
                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryTab = ({ history }: { history: AssignmentHistory[] }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No assignment history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((h) => (
        <div key={h.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.assignment_type === 'supervisor' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {h.assignment_type} Change
            </span>
            <span className="text-xs text-gray-400">
              {new Date(h.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-700">
            Changed from <span className="font-semibold text-gray-900">{h.assignment_type === 'supervisor' ? (h.prev_supervisor_name || 'None') : (h.prev_floor_name || 'None')}</span> to <span className="font-semibold text-gray-900">{h.assignment_type === 'supervisor' ? h.current_supervisor_name : h.current_floor_name}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            By: {h.changed_by_name || 'System'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CleanerDetails;
