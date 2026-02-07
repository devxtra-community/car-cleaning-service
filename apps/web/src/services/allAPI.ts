import { api, setAccessToken } from './commonAPI';

interface LoginPayload {
  email: string;
  password: string;
}

export const login = async ({ email, password }: LoginPayload) => {
  const response = await api.post('/api/auth/login', {
    email,
    password,
    client_type: 'web',
  });

  setAccessToken(response.data.accessToken);

  return response;
};

export const getAllSupervisors = async () => {
  const response = await api.get('/api/auth/supervisors');
  return response.data.data;
};

export const getCleanersBySupervisor = async (supervisorId: string) => {
  const response = await api.get(`/api/auth/supervisors/${supervisorId}/cleaners`);
  return response.data.data;
};
export const createBuilding = (data: {
  building_name: string;
  location: string;
  floors: {
    floor_number: number;
    floor_name: string;
    notes?: string;
  }[];
}) => {
  return api.post("/api/buildings", data);
};