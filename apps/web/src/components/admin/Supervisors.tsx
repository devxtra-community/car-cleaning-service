import React from 'react';
import profileImg from '../../assets/profileImg.png';
import { Link } from 'react-router-dom';
const Supervisors = () => {
  return (
    <>
      <div className="p-6 min-h-screen">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Supervisors</h1>
          <p className="text-sm text-gray-500">Overview and System Management</p>
        </div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Supervisors</h1>
          <Link to="/admin/supervisors/addSupervisor">
            <button className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm">+ Add</button>
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>

          {/* Card 2 */}
          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>

          {/* Card 3 */}
          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>

          {/* Card 4 */}
          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>

          {/* Card 5 */}
          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>
          {/* Selected Card */}
          <Link to="/admin/supervisors/cleaner">
            <div className="bg-blue-500 text-white rounded-xl p-4 flex items-center gap-4 relative">
              <img src={profileImg} className="w-12 h-12 rounded-full border-2 border-white" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs opacity-80">Dubai Marina</p>
              </div>
              <span className="absolute top-3 right-3 text-sm">🔔</span>
            </div>
          </Link>

          {/* More Cards */}
          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>

          <Link to="/admin/supervisors/cleaner">
            <div className="bg-white rounded-xl p-4 flex items-center gap-4">
              <img src={profileImg} className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-medium">Shemit Noah</p>
                <p className="text-xs text-gray-500">Dubai Marina</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-8 text-sm">
          <button className="border px-3 py-1.5 rounded">← Previous</button>

          <div className="flex gap-2">
            <span>1</span>
            <span>2</span>
            <span className="bg-blue-100 text-blue-600 px-2 rounded">3</span>
            <span>4</span>
            <span>…</span>
            <span>10</span>
          </div>

          <button className="border px-3 py-1.5 rounded">Next →</button>
        </div>
      </div>
    </>
  );
};

export default Supervisors;
