import axios from 'axios';
import { store } from '../redux/store';

export const baseURL = 'https://api.example.com/api/';
export const IMAGE_URL = 'https://api.example.com/images/';

const axiosinstance = axios.create({
  baseURL,
  timeout: 30000,
});

const requestHandler = (request) => {
  const { loginToken } = store?.getState()?.auth || '';
  if (loginToken) {
    request.headers.Authorization = `Bearer ${loginToken}`;
  }
  return request;
};

axiosinstance.interceptors.request.use(requestHandler);
axiosinstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosinstance;