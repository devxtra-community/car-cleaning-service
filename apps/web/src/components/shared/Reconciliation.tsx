import React from 'react';

const Reconciliation = () => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Accountant Dashboard</h1>
        <p className="text-sm text-gray-500">Finance & Salary Management</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat
          title="EXPECTED COLLECTION"
          value="$12,426"
          trend="+36%"
          trendColor="text-green-600"
        />
        <Stat title="ACTUAL COLLECTION" value="$2,38,485" trend="-18%" trendColor="text-red-500" />
        <Stat title="VARIANCE" value="84,382" trend="+36%" trendColor="text-green-600" />
        <Stat title="STATUS OVERVIEW" value="33,493" trend="+36%" trendColor="text-green-600" />
      </div>

      {/* Building Overview */}
      <div>
        <h2 className="text-sm font-semibold mb-4">BUILDING OVERVIEW</h2>

        <div className="space-y-4">
          {/* Building A */}
          <BuildingCard
            name="Building A"
            status="Matched"
            statusColor="bg-green-100 text-green-600"
            expected="$52,400"
            actual="$52,400"
            variance="+$0"
            progress="100%"
            bg="bg-white"
          />

          {/* Building B */}
          <BuildingCard
            name="Building B"
            status="Variance"
            statusColor="bg-yellow-100 text-yellow-600"
            expected="$48,900"
            actual="$47,200"
            variance="- $1,700"
            progress="96.5%"
            bg="bg-yellow-50"
          />

          {/* Building C */}
          <BuildingCard
            name="Building C"
            status="Matched"
            statusColor="bg-green-100 text-green-600"
            expected="$14,300"
            actual="$14,500"
            variance="+$200"
            progress="100%"
            bg="bg-white"
          />

          {/* Building D */}
          <BuildingCard
            name="Building D"
            status="Critical"
            statusColor="bg-red-100 text-red-600"
            expected="$51,200"
            actual="$47,800"
            variance="- $3,400"
            progress="100%"
            bg="bg-white"
            critical
          />
        </div>
      </div>
    </>
  );
};

export default Reconciliation;

function Stat({
  title,
  value,
  trend,
  trendColor,
}: {
  title: string;
  value: string;
  trend: string;
  trendColor: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className="text-lg font-semibold">{value}</p>
      <p className={`text-xs mt-1 ${trendColor}`}>{trend}</p>
    </div>
  );
}

function BuildingCard({
  name,
  status,
  statusColor,
  expected,
  actual,
  variance,
  progress,
  bg,
  critical,
}: {
  name: string;
  status: string;
  statusColor: string;
  expected: string;
  actual: string;
  variance: string;
  progress: string;
  bg: string;
  critical?: boolean;
}) {
  return (
    <div className={`${bg} border rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold flex items-center gap-2">
            {name}
            <span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>{status}</span>
          </p>
          <p className="text-xs text-gray-500">42 Cleaners assigned</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 text-sm mb-4">
        <div>
          <p className="text-gray-500">Expected Collection</p>
          <p className="font-semibold">{expected}</p>
        </div>
        <div>
          <p className="text-gray-500">Actual collection</p>
          <p className="font-semibold">{actual}</p>
        </div>
        <div>
          <p className="text-gray-500">Variance</p>
          <p className="font-semibold">{variance}</p>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-1">Collection Progress</div>
      <div className="h-2 bg-gray-200 rounded overflow-hidden mb-1">
        <div className="h-full bg-black w-full" />
      </div>
      <div className="text-xs text-right">{progress}</div>

      {critical && (
        <div className="mt-3 text-xs text-red-600 flex justify-between">
          <span>Critical variance requires immediate action</span>
          <button className="underline">Investigate</button>
        </div>
      )}
    </div>
  );
}
