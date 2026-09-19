import axiosinstance from '../axios/axiosinstance'
import EndPoints from './EndPoints'

export const checkEmailOrMobileIsExistOrNotService = (data) => 
  axiosinstance.post(EndPoints.checkEmailOrMobileIsExistOrNot, data)

export const logoutService = () =>
  axiosinstance.post(EndPoints.logout)

export const deleteAccountService = () =>
  axiosinstance.delete(EndPoints.deleteAccount)

export const getUserPersonalInfoService = (token) => 
  axiosinstance.get(`${EndPoints.getUserPersonalInfo}`)
// export const updateUserPersonalInfoService = (data) => axiosinstance.put('users/v1/profile', data)
export const updateUserPersonalInfoService = (data) =>
  axiosinstance.put(
    'users/v1/profile',
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
    }
  );

export const changePasswordService = (data) => axiosinstance.patch(EndPoints.changePassword, data)

export const getFamilyMemberService = (token) => 
  axiosinstance.get(`${EndPoints.getFamilyMember}/${token}`)

export const getTripService = () => 
  axiosinstance.get(`${EndPoints.tripList}`)