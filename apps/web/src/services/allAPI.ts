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
