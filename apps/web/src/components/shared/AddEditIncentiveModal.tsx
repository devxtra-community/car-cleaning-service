// import { useEffect, useState } from "react";
// import { api } from "../../services/commonAPI";
// import { IncentiveTarget } from "./AddIncentiveTarget";

// interface Props {
//   onClose: () => void;
//   onSuccess: () => void;
//   editData?: IncentiveTarget | null;
// }

// const AddEditIncentiveModal = ({ onClose, onSuccess, editData }: Props) => {
//   const [form, setForm] = useState({
//     target_tasks: "",
//     incentive_amount: "",
//     reason: "",
//     active: true,
//   });

//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (editData) {
//       setForm({
//         target_tasks: String(editData.target_tasks),
//         incentive_amount: String(editData.incentive_amount),
//         reason: editData.reason,
//         active: editData.active,
//       });
//     }
//   }, [editData]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       if (editData) {
//         await api.put(`/api/incentives/targets/${editData.id}`, {
//           ...form,
//           target_tasks: Number(form.target_tasks),
//           incentive_amount: Number(form.incentive_amount),
//         });
//       } else {
//         await api.post("/api/incentives/targets", {
//           target_tasks: Number(form.target_tasks),
//           incentive_amount: Number(form.incentive_amount),
//           reason: form.reason,
//         });
//       }

//       onSuccess();
//       onClose();
//     } catch (err) {
//       alert("Operation failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//       <div className="bg-white w-full max-w-md p-6 rounded-xl">
//         <h3 className="text-lg font-semibold mb-4">
//           {editData ? "Edit Incentive" : "Add Incentive"}
//         </h3>

//         <form onSubmit={handleSubmit} className="space-y-3">
//           <input
//             type="number"
//             placeholder="Target Tasks"
//             value={form.target_tasks}
//             onChange={(e) =>
//               setForm({ ...form, target_tasks: e.target.value })
//             }
//             required
//             className="w-full border px-3 py-2 rounded"
//           />

//           <input
//             type="number"
//             placeholder="Incentive Amount"
//             value={form.incentive_amount}
//             onChange={(e) =>
//               setForm({ ...form, incentive_amount: e.target.value })
//             }
//             required
//             className="w-full border px-3 py-2 rounded"
//           />

//           <textarea
//             placeholder="Reason"
//             value={form.reason}
//             onChange={(e) =>
//               setForm({ ...form, reason: e.target.value })
//             }
//             className="w-full border px-3 py-2 rounded"
//           />

//           {editData && (
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 checked={form.active}
//                 onChange={(e) =>
//                   setForm({ ...form, active: e.target.checked })
//                 }
//               />
//               Active
//             </label>
//           )}

//           <div className="flex justify-end gap-2">
//             <button type="button" onClick={onClose}>
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-blue-600 text-white px-4 py-2 rounded"
//             >
//               {loading ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddEditIncentiveModal;
