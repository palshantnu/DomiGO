import axios from 'axios';
import { store } from '../redux/store';
// import Config from 'react-native-config';

export const baseURL = 'https://stage.mydomigo.com/api/';
// export const baseURL = `${Config.BASE_URL}/api/`;
export const IMAGE_URL = 'https://stage.mydomigo.com/api/';

console.log('baseURL',baseURL);

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