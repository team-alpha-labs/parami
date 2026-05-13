# 외부 API 가이드

---

## ⚠️ 가장 중요한 것

**KMA(기상청) 키는 `apihub.kma.go.kr`에서 발급받은 거예요. `data.go.kr` 아님.**

두 시스템은 별도라 키 호환 안 됨. URL과 파라미터 이름도 다름:

| API | URL 도메인 | 파라미터 이름 |
| --- | --- | --- |
| KMA (기상청) | `apihub.kma.go.kr` | `authKey=` |
| 에어코리아 (미세먼지) | `apis.data.go.kr` | `serviceKey=` |

---

## 사용 중인 엔드포인트

**KMA — 초단기실황**
```
https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getUltraSrtNcst
```
서울: `nx=60`, `ny=127` · `base_time`은 정시(`0500` 등), **40분 이후 갱신**

**에어코리아 — 시도별 측정**
```
https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty
```
`sidoName=서울` 사용

---

## 트리거 판정에 쓰는 값

| 트리거 | API | 응답 필드 |
| --- | --- | --- |
| rain / good_weather.rain | KMA | `RN1` (mm) |
| heat / cold | KMA | `T1H` (°C) |
| wind | KMA | `WSD` (m/s) |
| snow | KMA | `PTY` ∈ {2, 3, 6, 7} |
| dust | 에어코리아 | `pm25Value` |

---

## 키 확인 (테스트)

dev 서버 띄운 뒤:
```
http://localhost:3000/api/weather/test
```

KMA + 에어코리아 응답 둘 다 잘 뜨면 OK.

---

## 안 될 때

| 증상 | 원인 |
| --- | --- |
| `Unauthorized` | KMA 키를 data.go.kr URL에 넣었거나 그 반대 |
| 응답 비어있음 | `base_time`이 너무 최근 (40분 안 지남) |
| `SERVICE_KEY_IS_NOT_REGISTERED` | 키 복사할 때 글자 누락 |
| `.env.local` 수정해도 그대로 | dev 서버 재시작 안 함 |
