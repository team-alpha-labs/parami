// TODO: 기상청 API 응답 파싱 구현
// TODO: .env.local에 KMA_API_KEY, AIRKOREA_API_KEY 설정 필요

export type WeatherData = {
  rain: number
  temperature: number
  pm25: number
  windSpeed: number
  ptyCode: number
}

export async function fetchWeather(): Promise<WeatherData> {
  throw new Error('Not implemented')
}
