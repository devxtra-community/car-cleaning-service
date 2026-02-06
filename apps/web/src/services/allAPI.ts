import { api } from './commonAPI';

export const getAllSupervisors = async () => {
  const res = await api.get('/api/member/allsupervisors');
  return res.data.supervisors;
};
