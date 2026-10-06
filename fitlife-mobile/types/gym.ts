export interface Gym {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  distance?: number
  phone?: string
  website?: string
  opening_hours?: string
  amenities?: string[]
  rating?: number
  tags?: { [key: string]: string }
}

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number | null
}

export interface SearchParams {
  latitude: number
  longitude: number
  radius?: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
