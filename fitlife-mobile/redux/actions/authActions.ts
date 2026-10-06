import { authService } from "@/services/authService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { loginSuccess, logout } from "../slices/authSlice"
import { AppDispatch } from "../store"


export const loginUser = (email: string, motDePasse: string) => async (dispatch: AppDispatch) => {
  const response = await authService.login(email, motDePasse)
  await AsyncStorage.setItem("authToken", response.token)
  dispatch(
    loginSuccess({
      user: { ...response.user, profilePhoto: response.user.profilePhoto ?? "" },
      token: response.token,
    })
  )
}

export const registerUser = (userData: any) => async (dispatch: AppDispatch) => {
  const response = await authService.register(userData)
  await AsyncStorage.setItem("authToken", response.token)
  dispatch(
    loginSuccess({
      user: { ...response.user, profilePhoto: response.user.profilePhoto ?? "" },
      token: response.token,
    })
  )
}

export const logoutUser = () => async (dispatch: AppDispatch) => {
  await AsyncStorage.removeItem("authToken")
  dispatch(logout())
}
