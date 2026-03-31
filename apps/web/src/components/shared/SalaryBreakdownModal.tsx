import React, { useEffect, useState } from 'react';
import { useAlert } from '../../context/AlertContext';
import { errMsg } from '../../utils/errorUtils';
import { getSalaryBreakdown } from '../../services/allAPI';

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
  const { showToast } = useAlert();

  useEffect(() => {
    const fetchBreakdown = async () => {
      setLoading(true);
      try {
        const res = await getSalaryBreakdown(salaryId);
        // Backend returns the array directly
        setData(res || []);
      } catch (err) {
        showToast(errMsg(err), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [salaryId]);

  const incentives = data.filter((d) => d.type === 'Incentive');
  const penalties = data.filter((d) => d.type === 'Penalty');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Salary Breakdown</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              Verified Calculation Log
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Retrieving Log...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-2">📜</div>
              <p className="text-gray-500 font-medium">No specialized adjustments found.</p>
              <p className="text-[10px] text-gray-400 mt-1">
                This user received their standard base salary.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Incentives */}
              {incentives.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Earnings & Bonuses
                  </h3>
                  <div className="space-y-2">
                    {incentives.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm p-3 bg-green-50/50 rounded-xl border border-green-100/50"
                      >
                        <span className="text-gray-700 font-medium">{item.description}</span>
                        <span className="text-green-700 font-black">
                          +₹{Number(item.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Penalties */}
              {penalties.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Deductions & Penalties
                  </h3>
                  <div className="space-y-2">
                    {penalties.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm p-3 bg-red-50/50 rounded-xl border border-red-100/50"
                      >
                        <span className="text-gray-700 font-medium">{item.description}</span>
                        <span className="text-red-700 font-black">
                          -₹{Number(item.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-black transition shadow-lg shadow-gray-200"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalaryBreakdownModal;
