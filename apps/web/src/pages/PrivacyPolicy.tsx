import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Terms of Service & Privacy Policy
          </h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              1. Purpose of the Application
            </h2>
            <div className="prose text-gray-600">
              <p>
                This application is an internal management system used by the car
                cleaning business to manage operations such as staff management,
                vehicle records, building assignments, and financial tracking.
              </p>

              <p>
                The system is intended only for authorized personnel including
                administrators, supervisors, cleaners, and accountants.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              2. Authorized Access
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-4 text-gray-600">
                <li className="flex gap-3">
                  <span>
                    Only authorized users such as Admin, Super Admin, Supervisor,
                    Cleaner, and Accountant are allowed to access this system.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span>
                    Users must maintain the confidentiality of their login credentials.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span>
                    Any unauthorized use, sharing of credentials, or misuse of the
                    platform may result in suspension of access.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              3. Data Usage
            </h2>
            <div className="prose text-gray-600">
              <p>
                The application may store operational data such as employee details,
                vehicle information, work assignments, and financial records necessary
                for managing the car cleaning business.
              </p>

              <p>
                This information is used strictly for internal operational purposes and
                is not shared with external parties except where required for system
                maintenance or legal compliance.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              4. Security
            </h2>
            <div className="prose text-gray-600">
              <p>
                We take appropriate measures to protect system data and user access.
                Users must log out after completing their work and must not access the
                system from unauthorized devices.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              5. Policy Updates
            </h2>
            <div className="prose text-gray-600">
              <p>
                These terms may be updated periodically to reflect operational or
                security changes. Continued use of the application implies acceptance
                of the updated policies.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              6. Contact
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
              <p className="text-gray-600">
                For questions regarding system usage or policies:
              </p>

              <a
                href="mailto:carCleaning@gmail.com"
                className="inline-flex items-center text-blue-600 hover:text-blue-500"
              >
                carCleaning@gmail.com
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;