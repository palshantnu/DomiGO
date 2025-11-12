import axiosinstance from '../axios/axiosinstance'
import EndPoints from './EndPoints'

export const checkEmailOrMobileIsExistOrNotService = (data) => 
  axiosinstance.post(EndPoints.checkEmailOrMobileIsExistOrNot, data)

export const logoutService = () => 
  axiosinstance.post(EndPoints.logout)

export const getUserPersonalInfoService = (token) => 
  axiosinstance.get(`${EndPoints.getUserPersonalInfo}/${token}`)

export const getFamilyMemberService = (token) => 
  axiosinstance.get(`${EndPoints.getFamilyMember}/${token}`)