import { UserRole } from 'src/database/schema/usersSchema';

type StaffDetails = {
  employee_id: string;
  salary: number;
};

type CleanerDetails = {
  supervisor_id: string;
  work_location_id: string;
};

type CreateUserBody = {
  email: string;
  password: string;
  role: UserRole;
  full_name: string;
  document_id: string;
  age: number;
  nationality: string;
  building_id: string;

  staff?: StaffDetails;
  cleaner?: CleanerDetails;
};

export const validateCreateUser = (body: CreateUserBody) => {
  const {
    email,
    password,
    role,
    full_name,
    document_id,
    age,
    nationality,
    building_id,
    staff,
    cleaner,
  } = body;

  if (
    !email ||
    !password ||
    !role ||
    !full_name ||
    !document_id ||
    !age ||
    !nationality ||
    !building_id
  ) {
    throw new Error('MISSING_REQUIRED_FIELDS');
  }

  if (password.length < 8) {
    throw new Error('WEAK_PASSWORD');
  }

  switch (role) {
    case 'admin':
    case 'super_admin':
    case 'accountant':
      if (!staff?.employee_id || !staff?.salary) {
        throw new Error('STAFF_FIELDS_REQUIRED');
      }
      break;

    case 'supervisor':
      // optional fields → no hard validation
      break;

    case 'cleaner':
      if (!cleaner?.supervisor_id || !cleaner?.work_location_id) {
        throw new Error('CLEANER_FIELDS_REQUIRED');
      }
      break;

    default:
      throw new Error('INVALID_ROLE');
  }
};
