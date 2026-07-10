export interface Radio {
  changeuuid: string
  stationuuid: string
  name: string
  url: string
  url_resolved: string
  homepage: string
  favicon: string
  tags: string
  country: string
  countrycode: string
  state: string
  language: string
  languagecodes: string
  votes: number
  codec: string
  bitrate: number
  clickcount: number
  clicktrend: number
  ssl_error: number
  geo_lat: null | number
  geo_long: null | number
  has_extended_info: boolean
  lastcheckok: number
}

export interface StationFilter {
  countrycode?: string
  tag?: string
  name?: string
  limit?: number
  offset?: number
  order?: string
  reverse?: boolean
}

export interface User {
  id: string
  username: string
  role: string
  createdAt: Date
  favorites: string[]
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark'
  defaultCountry: string
  autoPlay: boolean
  volume: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message: string
}

export type Theme = 'light' | 'dark'
