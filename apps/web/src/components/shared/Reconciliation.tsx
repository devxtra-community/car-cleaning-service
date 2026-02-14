import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/commonAPI';
import Toast from './Toast';

interface BuildingRow {
  id: string;
  building_name: string;
  expected_collection: number;
  actual_collection: number;
  variance: number;
  status: string;
}

interface Summary {
  totalExpected: number;
  totalActual: number;
  totalSalary: number;
  profit: number;
}

const Reconciliation: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();

  const [rows, setRows] = useState<BuildingRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  /* =========================
     Fetch Data
     ========================= */
  const fetchData = useCallback(async () => {
    if (!cycleId) return;

    setLoading(true);
    try {
      const [buildingsRes, summaryRes] = await Promise.all([
        api.get(`/reconciliation/${cycleId}`),
        api.get(`/reconciliation/summary/${cycleId}`),
      ]);

      setRows(buildingsRes.data.data || []);
      setSummary(summaryRes.data.data);
    } catch {
      setToast({ message: 'Failed to load reconciliation', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* =========================
     Render
     ========================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Collection Reconciliation</h1>
        <p className="text-sm text-gray-600 mt-1">Compare expected vs actual collections</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Stat
            title="EXPECTED"
            value={`₹${summary.totalExpected.toLocaleString('en-IN')}`}
            color="blue"
          />
          <Stat
            title="ACTUAL"
            value={`₹${summary.totalActual.toLocaleString('en-IN')}`}
            color="green"
          />
          <Stat
            title="SALARY EXPENSE"
            value={`₹${summary.totalSalary.toLocaleString('en-IN')}`}
            color="purple"
          />
          <Stat
            title="PROFIT / LOSS"
            value={`₹${summary.profit.toLocaleString('en-IN')}`}
            color={summary.profit >= 0 ? 'green' : 'red'}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left">Building</th>
              <th className="p-4 text-right">Expected</th>
              <th className="p-4 text-right">Actual</th>
              <th className="p-4 text-right">Variance</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{row.building_name}</td>
                  <td className="p-4 text-right">₹{row.expected_collection}</td>
                  <td className="p-4 text-right">₹{row.actual_collection}</td>
                  <td
                    className={`p-4 text-right font-medium ${
                      row.variance < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    ₹{row.variance}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Reconciliation;

/* =========================
   Stat Component
   ========================= */
function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}) {
  const map = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    red: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className={`border rounded-lg p-5 ${map[color]}`}>
      <p className="text-xs font-semibold uppercase text-gray-600">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

/* =========================
   Status Badge
   ========================= */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Matched: 'bg-green-100 text-green-700',
    Variance: 'bg-yellow-100 text-yellow-700',
    Critical: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>
  );
}
