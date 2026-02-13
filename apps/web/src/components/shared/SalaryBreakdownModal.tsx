import React, { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';

interface BreakdownItem {
  type: 'Incentive' | 'Penalty';
  description: string;
  amount: number;
}

interface Props {
  salaryId: string;
  onClose: () => void;
}

const SalaryBreakdownModal: React.FC<Props> = ({ salaryId, onClose }) => {
  const [data, setData] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBreakdown = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/salary/breakdown/${salaryId}`);
        setData(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch breakdown', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [salaryId]);

  const incentives = data.filter((d) => d.type === 'Incentive');
  const penalties = data.filter((d) => d.type === 'Penalty');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Salary Breakdown</h2>
          <button onClick={onClose} className="text-gray-500 text-sm">
            Close
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <>
            {/* Incentives */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-green-700 mb-2">Incentives</h3>
              {incentives.length === 0 ? (
                <p className="text-sm text-gray-500">No incentives</p>
              ) : (
                incentives.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.description}</span>
                    <span className="text-green-600">₹{item.amount}</span>
                  </div>
                ))
              )}
            </div>

            {/* Penalties */}
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">Penalties</h3>
              {penalties.length === 0 ? (
                <p className="text-sm text-gray-500">No penalties</p>
              ) : (
                penalties.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.description}</span>
                    <span className="text-red-600">₹{item.amount}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalaryBreakdownModal;
