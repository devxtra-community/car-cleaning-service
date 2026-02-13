import { useEffect, useState } from 'react';
import { api } from '../../services/commonAPI';
import AddEditIncentiveModal from './AddEditIncentiveModal';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import Toast from './Toast';

export interface IncentiveTarget {
  id: string; // ✅ FIXED (UUID is string)
  target_tasks: number;
  incentive_amount: number;
  reason: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

const IncentivesPage = () => {
  const [incentives, setIncentives] = useState<IncentiveTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<IncentiveTarget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const fetchIncentives = async () => {
    try {
      setLoading(true);

      const res = await api.get('/api/incentives/targets');

      console.log(res.data);

      // ✅ Correct access
      const incentivesArray = res.data?.data || [];

      setIncentives(incentivesArray);
    } catch (error) {
      console.error('Failed to fetch incentives:', error);
      alert('Failed to load incentives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncentives();
  }, []);

  // Handle add new incentive
  const handleAddNew = () => {
    setEditData(null);
    setShowModal(true);
  };

  // Handle edit incentive
  const handleEdit = (incentive: IncentiveTarget) => {
    setEditData(incentive);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleteLoading(true);

      await api.delete(`/api/incentives/targets/${deleteId}`);

      setDeleteId(null);
      fetchIncentives();
    } catch (error) {
      console.error('Failed to delete incentive:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // // Handle modal success
  // const handleSuccess = () => {
  //   fetchIncentives();
  //   setShowModal(false);
  //   setEditData(null);
  // };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Incentive Targets</h1>
          <p className="text-gray-600 text-sm mt-1">Manage incentive targets for cleaners</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Incentive
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading incentives...</p>
        </div>
      ) : incentives.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No incentives found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first incentive target</p>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add First Incentive
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incentive Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {incentives.map((incentive) => (
                <tr key={incentive.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {incentive.target_tasks} tasks
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {incentive.incentive_amount} AED
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {incentive.reason || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        incentive.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {incentive.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(incentive)}
                        className="text-blue-600 hover:text-blue-900 transition p-1"
                        title="Edit"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(incentive.id)}
                        className="text-red-600 hover:text-red-900 transition p-1"
                        title="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <DeleteConfirmModal
            isOpen={!!deleteId}
            title="Delete Incentive"
            message="Are you sure you want to delete this incentive target? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            loading={deleteLoading}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteId(null)}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddEditIncentiveModal
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSuccess={(message, type) => {
            setToast({ message, type });
            fetchIncentives();
          }}
          editData={editData}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default IncentivesPage;
