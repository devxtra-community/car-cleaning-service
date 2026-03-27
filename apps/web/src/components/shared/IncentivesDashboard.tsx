// src/pages/Incentives/IncentivesManagement.tsx
import { useCallback, useEffect, useState, Fragment } from 'react';
import { api } from '../../services/commonAPI';
import AddEditTypeModal from './AddEditTypeModal';
import AddEditRuleModal from './AddEditRuleModal';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import Toast from './Toast';

interface IncentiveType {
  id: string;
  name: string;
  category: string;
  calculation_type: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface IncentiveRule {
  id: string;
  incentive_type_id: string;
  rule_name: string;
  base_amount: number;
  criteria: Record<string, string | number | boolean>;
  priority: number;
  active: boolean;
  incentive_type_name?: string;
  incentive_category?: string;
  created_at: string;
  updated_at: string;
}

type ViewFilter = 'all' | 'active' | 'inactive';

const IncentivesManagement = () => {
  const [incentiveTypes, setIncentiveTypes] = useState<IncentiveType[]>([]);
  const [allRules, setAllRules] = useState<IncentiveRule[]>([]);
  const [selectedType, setSelectedType] = useState<IncentiveType | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('active');

  // Modals
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editTypeData, setEditTypeData] = useState<IncentiveType | null>(null);
  const [editRuleData, setEditRuleData] = useState<IncentiveRule | null>(null);

  // Delete
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [typesRes, rulesRes] = await Promise.all([
        api.get('/api/incentives/types'),
        api.get('/api/incentives/rules'),
      ]);

      const types = typesRes.data?.data || [];
      const rules = rulesRes.data?.data || [];

      setIncentiveTypes(types);
      setAllRules(rules);

      if (!selectedType) {
        const firstActiveType = types.find((t: IncentiveType) => t.active);
        if (firstActiveType) {
          setSelectedType(firstActiveType);
        } else if (types.length > 0) {
          setSelectedType(types[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setToast({ message: 'Failed to load incentives', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getFilteredTypes = () => {
    switch (viewFilter) {
      case 'active':
        return incentiveTypes.filter((t) => t.active);
      case 'inactive':
        return incentiveTypes.filter((t) => !t.active);
      default:
        return incentiveTypes;
    }
  };

  const getTypeRules = (typeId: string) => {
    return allRules.filter((rule) => rule.incentive_type_id === typeId);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      performance: '🎯',
      attendance: '📅',
      quality: '⭐',
      overtime: '⏰',
      milestone: '🏆',
    };
    return icons[category] || '💰';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: { bg: string; text: string; badge: string; border: string } } = {
      performance: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        badge: 'bg-blue-100',
        border: 'border-blue-200',
      },
      attendance: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        badge: 'bg-green-100',
        border: 'border-green-200',
      },
      quality: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        badge: 'bg-amber-100',
        border: 'border-amber-200',
      },
      overtime: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        badge: 'bg-purple-100',
        border: 'border-purple-200',
      },
      milestone: {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        badge: 'bg-rose-100',
        border: 'border-rose-200',
      },
    };
    return (
      colors[category] || {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        badge: 'bg-slate-100',
        border: 'border-slate-200',
      }
    );
  };

  // Type handlers
  const handleAddType = () => {
    setEditTypeData(null);
    setShowTypeModal(true);
  };

  const handleEditType = (type: IncentiveType) => {
    setEditTypeData(type);
    setShowTypeModal(true);
  };

  const handleDeleteType = (id: string) => {
    setDeleteTypeId(id);
  };

  const confirmDeleteType = async () => {
    if (!deleteTypeId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/incentives/types/${deleteTypeId}`);
      setDeleteTypeId(null);
      if (selectedType?.id === deleteTypeId) {
        setSelectedType(null);
      }
      fetchData();
      setToast({ message: 'Incentive type deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to delete type:', error);
      setToast({ message: 'Failed to delete type', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleTypeStatus = async (type: IncentiveType) => {
    try {
      await api.put(`/api/incentives/types/${type.id}`, {
        active: !type.active,
      });
      fetchData();
      setToast({
        message: `Incentive type ${!type.active ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  // Rule handlers
  const handleAddRule = () => {
    if (!selectedType) {
      setToast({ message: 'Please select an incentive type first', type: 'error' });
      return;
    }
    setEditRuleData(null);
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: IncentiveRule) => {
    setEditRuleData(rule);
    setShowRuleModal(true);
  };

  const handleDeleteRule = (id: string) => {
    setDeleteRuleId(id);
  };

  const confirmDeleteRule = async () => {
    if (!deleteRuleId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/incentives/rules/${deleteRuleId}`);
      setDeleteRuleId(null);
      fetchData();
      setToast({ message: 'Rule deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to delete rule:', error);
      setToast({ message: 'Failed to delete rule', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleRuleStatus = async (rule: IncentiveRule) => {
    try {
      await api.put(`/api/incentives/rules/${rule.id}`, {
        active: !rule.active,
      });
      fetchData();
      setToast({
        message: `Rule ${!rule.active ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to update rule status:', error);
      setToast({ message: 'Failed to update rule status', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading incentives...</p>
        </div>
      </div>
    );
  }

  const filteredTypes = getFilteredTypes();
  const selectedTypeRules = selectedType
    ? getTypeRules(selectedType.id).sort((a, b) => a.priority - b.priority)
    : [];
  const stats = {
    total_types: incentiveTypes.length,
    active_types: incentiveTypes.filter((t) => t.active).length,
    inactive_types: incentiveTypes.filter((t) => !t.active).length,
    total_rules: allRules.length,
    active_rules: allRules.filter((r) => r.active).length,
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Incentive Management</h1>
            <p className="text-slate-600 mt-1">
              Configure and manage all incentive types and rules
            </p>
          </div>
          <button
            onClick={handleAddType}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Incentive Type
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200 w-fit">
          <button
            onClick={() => setViewFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              viewFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All ({stats.total_types})
          </button>
          <button
            onClick={() => setViewFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              viewFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Active ({stats.active_types})
          </button>
          <button
            onClick={() => setViewFilter('inactive')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              viewFilter === 'inactive'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Inactive ({stats.inactive_types})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">{stats.total_types}</p>
          <p className="text-sm text-slate-500">Total Types</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mb-1">{stats.active_types}</p>
          <p className="text-sm text-slate-500">Active Types</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">{stats.total_rules}</p>
          <p className="text-sm text-slate-500">Total Rules</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mb-1">{stats.active_rules}</p>
          <p className="text-sm text-slate-500">Active Rules</p>
        </div>
      </div>

      {/* Incentive Types Cards */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Incentive Types</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              {viewFilter === 'all' && 'All incentive types'}
              {viewFilter === 'active' && 'Currently active types'}
              {viewFilter === 'inactive' && 'Inactive/Historical types'}
            </p>
          </div>

          {filteredTypes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {viewFilter === 'inactive' ? 'No Inactive Types' : 'No Types Found'}
              </h3>
              <p className="text-slate-600 mb-6">
                {viewFilter === 'inactive'
                  ? 'All types are currently active'
                  : 'Create your first incentive type to get started'}
              </p>
              {viewFilter !== 'inactive' && (
                <button
                  onClick={handleAddType}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Create First Type
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">Type Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Description</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Category</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Rules</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTypes.map((type) => {
                    const colors = getCategoryColor(type.category);
                    const isSelected = selectedType?.id === type.id;
                    const ruleCount = getTypeRules(type.id).length;
                    const activeRuleCount = getTypeRules(type.id).filter((r) => r.active).length;

                    return (
                      <Fragment key={type.id}>
                      <tr 
                        onClick={() => setSelectedType(isSelected ? null : type)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0 border ${colors.border}`}>
                              {getCategoryIcon(type.category)}
                            </div>
                            <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>{type.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-normal max-w-xs">
                          <span className="text-slate-600 line-clamp-1" title={type.description || 'No description provided'}>
                            {type.description || 'No description provided'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${colors.badge} ${colors.text}`}>
                            {type.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            {activeRuleCount} / {ruleCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {type.active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTypeStatus(type);
                              }}
                              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                                type.active
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              {type.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditType(type);
                              }}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteType(type.id);
                              }}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isSelected && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/80 border-b border-slate-300 p-0 shadow-inner">
                            <div className="p-6">
                              {/* rules section header */}
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    Configured Rules
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">Manage conditions for {type.name}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddRule();
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add Rule
                                </button>
                              </div>

                              {selectedTypeRules.length === 0 ? (
                                <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-medium text-slate-600 mb-1">No rules defined</p>
                                  <p className="text-xs text-slate-400">Add conditions to start calculating incentives</p>
                                </div>
                              ) : (
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                  <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                      <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-600">Rule Name</th>
                                        <th className="px-4 py-3 font-semibold text-slate-600 text-right">Base Amount</th>
                                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">Priority</th>
                                        <th className="px-4 py-3 font-semibold text-slate-600">Criteria Details</th>
                                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">Status</th>
                                        <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {selectedTypeRules.map((rule) => (
                                        <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-4 py-3"><span className="font-semibold text-slate-900">{rule.rule_name}</span></td>
                                          <td className="px-4 py-3 text-right"><span className="font-semibold text-emerald-600">{rule.base_amount} AED</span></td>
                                          <td className="px-4 py-3 text-center"><span className="font-semibold text-slate-900">{rule.priority}</span></td>
                                          <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5 max-w-xs whitespace-normal">
                                              {Object.entries(rule.criteria).map(([key, value]) => (
                                                <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 border border-slate-200 text-slate-600">
                                                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                                  <span className="font-bold text-slate-900">{String(value)}</span>
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            {rule.active ? (
                                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">Active</span>
                                            ) : (
                                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">Inactive</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                              <button onClick={(e) => { e.stopPropagation(); toggleRuleStatus(rule); }} className={`px-2 py-1 text-[10px] rounded uppercase font-bold transition ${rule.active ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                                {rule.active ? 'Disable' : 'Enable'}
                                              </button>
                                              <button onClick={(e) => { e.stopPropagation(); handleEditRule(rule); }} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Edit">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                              </button>
                                              <button onClick={(e) => { e.stopPropagation(); handleDeleteRule(rule.id); }} className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTypeModal && (
        <AddEditTypeModal
          onClose={() => {
            setShowTypeModal(false);
            setEditTypeData(null);
          }}
          onSuccess={(message, type) => {
            setToast({ message, type });
            fetchData();
          }}
          editData={editTypeData}
        />
      )}

      {showRuleModal && selectedType && (
        <AddEditRuleModal
          incentiveTypeId={selectedType.id}
          categoryType={selectedType.category}
          onClose={() => {
            setShowRuleModal(false);
            setEditRuleData(null);
          }}
          onSuccess={(message, type) => {
            setToast({ message, type });
            fetchData();
          }}
          editData={editRuleData}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTypeId}
        title="Delete Incentive Type"
        message="Are you sure you want to delete this incentive type? All associated rules will also be deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        onConfirm={confirmDeleteType}
        onCancel={() => setDeleteTypeId(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteRuleId}
        title="Delete Incentive Rule"
        message="Are you sure you want to delete this rule? This action cannot be undone and may affect incentive calculations."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        onConfirm={confirmDeleteRule}
        onCancel={() => setDeleteRuleId(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default IncentivesManagement;
