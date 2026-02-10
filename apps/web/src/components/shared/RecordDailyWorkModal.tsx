// // components/RecordDailyWorkModal.tsx
// import { useState, useEffect } from 'react';

// type RecordDailyWorkModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   cleanerId: string;
//   cleanerName: string;
//   incentiveTarget: IncentiveTarget | null;
//   onSave: (record: Omit<DailyWorkRecord, 'id'>) => void;
// };

// const RecordDailyWorkModal: React.FC<RecordDailyWorkModalProps> = ({
//   isOpen,
//   onClose,
//   cleanerId,
//   cleanerName,
//   incentiveTarget,
//   onSave
// }) => {
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [tasksCompleted, setTasksCompleted] = useState('');
//   const [notes, setNotes] = useState('');
//   const [calculatedIncentive, setCalculatedIncentive] = useState(0);

//   useEffect(() => {
//     if (incentiveTarget && tasksCompleted) {
//       const completed = parseInt(tasksCompleted);
//       const target = incentiveTarget.target_tasks;
//       const baseAmount = incentiveTarget.incentive_amount;

//       let incentive = 0;

//       if (completed >= target) {
//         // Base incentive for meeting target
//         incentive = baseAmount;

//         // Bonus for exceeding target (50% of base per extra task)
//         const extraTasks = completed - target;
//         if (extraTasks > 0) {
//           incentive += (baseAmount * 0.5) * extraTasks;
//         }
//       }

//       setCalculatedIncentive(incentive);
//     } else {
//       setCalculatedIncentive(0);
//     }
//   }, [tasksCompleted, incentiveTarget]);

//   const handleSubmit = () => {
//     if (!tasksCompleted || !date) {
//       alert('Please fill all required fields');
//       return;
//     }

//     const record = {
//       cleaner_id: cleanerId,
//       date,
//       tasks_completed: parseInt(tasksCompleted),
//       incentive_earned: calculatedIncentive,
//       notes,
//     };

//     onSave(record);
//     handleReset();
//     onClose();
//   };

//   const handleReset = () => {
//     setDate(new Date().toISOString().split('T')[0]);
//     setTasksCompleted('');
//     setNotes('');
//     setCalculatedIncentive(0);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//       <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
//         {/* Header */}
//         <div className="mb-4 flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold">Record Daily Work</h2>
//             <p className="text-sm text-gray-600">{cleanerName}</p>
//           </div>
//           <button onClick={onClose} className="text-gray-400 hover:text-black">
//             ✕
//           </button>
//         </div>

//         {/* Current Target Info */}
//         {incentiveTarget && (
//           <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
//             <p className="text-sm font-semibold text-gray-800 mb-2">Current Target:</p>
//             <div className="grid grid-cols-2 gap-2 text-sm">
//               <div>
//                 <span className="text-gray-600">Daily Tasks:</span>
//                 <span className="ml-2 font-semibold">{incentiveTarget.target_tasks}</span>
//               </div>
//               <div>
//                 <span className="text-gray-600">Base Incentive:</span>
//                 <span className="ml-2 font-semibold text-green-600">
//                   ${incentiveTarget.incentive_amount.toFixed(2)}
//                 </span>
//               </div>
//             </div>
//             <p className="text-xs text-gray-500 mt-2">{incentiveTarget.reason}</p>
//           </div>
//         )}

//         {/* Date */}
//         <div className="mb-4">
//           <label className="mb-1 block text-sm font-medium">
//             Date <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             max={new Date().toISOString().split('T')[0]}
//             className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
//           />
//         </div>

//         {/* Tasks Completed */}
//         <div className="mb-4">
//           <label className="mb-1 block text-sm font-medium">
//             Tasks Completed <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="number"
//             value={tasksCompleted}
//             onChange={(e) => setTasksCompleted(e.target.value)}
//             placeholder="0"
//             min="0"
//             className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
//           />
//         </div>

//         {/* Calculated Incentive */}
//         <div className="mb-4">
//           <label className="mb-1 block text-sm font-medium">
//             Incentive Earned
//           </label>
//           <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
//             <p className="text-2xl font-bold text-green-600">
//               ${calculatedIncentive.toFixed(2)}
//             </p>
//             {tasksCompleted && incentiveTarget && (
//               <p className="text-xs text-gray-600 mt-1">
//                 {parseInt(tasksCompleted) >= incentiveTarget.target_tasks
//                   ? parseInt(tasksCompleted) > incentiveTarget.target_tasks
//                     ? `Target exceeded by ${parseInt(tasksCompleted) - incentiveTarget.target_tasks} task(s)! 🎉`
//                     : 'Target met! ✓'
//                   : `${incentiveTarget.target_tasks - parseInt(tasksCompleted)} task(s) short of target`}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Notes */}
//         <div className="mb-6">
//           <label className="mb-1 block text-sm font-medium">Notes</label>
//           <textarea
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//             placeholder="Optional notes about today's work"
//             rows={2}
//             className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-3">
//           <button
//             onClick={handleSubmit}
//             className="flex-1 rounded-lg bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-700"
//           >
//             Save Record
//           </button>
//           <button
//             onClick={onClose}
//             className="flex-1 rounded-lg border border-gray-300 py-2.5 text-gray-700 font-semibold hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RecordDailyWorkModal;
