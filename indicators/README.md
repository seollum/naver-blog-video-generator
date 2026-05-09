# Volume S/R Diamond Signals

영상 [Alex Gonzalez 지지/저항 매매법](https://www.youtube.com/watch?v=iG_Bh9D9-64) 원리에 기반한 근사 재구현 Pine Script v6 지표.

## 영상 vs 이 지표

영상에서는 알고리즘 세부 수식이 공개되지 않았기에, 영상에서 설명한 **원리**를 표준 기술적 분석 기법으로 구현했습니다:

| 영상 컨셉 | 이 지표 구현 |
|---|---|
| 거래량 집중 구간 박스 | 거래량 스파이크가 동반된 피벗 고/저점에 ATR 기반 박스 |
| 박스 색상 농도 = 거래량 강도 | `volume / volMA` 비율로 투명도 동적 조정 |
| 다이아몬드 (압력 소화 + 반전) | 박스 도달 + 사전 추세 압력 + 강한 반전 캔들 + 거래량 스파이크 |
| BREAK 라벨 (플립) | 박스 종가 돌파 시 ▲/▼ 라벨, 해당 박스는 비활성화 |
| SL/TP (R:R 1.5) | SL=박스 반대편, TP=손절 거리 × 1.5 자동 라인 |

## 적용 방법

1. TradingView 웹 (https://www.tradingview.com) 접속, 차트 열기
2. 하단 **Pine 편집기** 탭 클릭
3. `Volume_SR_Diamond.pine` 내용 전체 복사 → 편집기에 붙여넣기 (기존 코드 삭제)
4. **저장** (Ctrl+S) → 이름 입력 (예: `Volume SR Diamond`)
5. **차트에 추가**
6. 타임프레임은 차트 변경 시 자동 적용 (별도 설정 불필요)

## 입력값 설정

### Structure (박스 구조)
| 항목 | 기본값 | 설명 |
|---|---|---|
| Pivot Lookback | 10 | 피벗 고/저점 검출 양쪽 바 수. 클수록 큰 구조만 잡음 |
| Max Active S/R Boxes | 8 | 한 번에 유지할 최대 박스 수 |
| Box Extend Bars | 80 | 박스가 우측으로 그려지는 바 수 |
| ATR Length | 14 | 박스 폭 계산용 ATR 길이 |
| Box Width × ATR | 0.4 | 박스 폭 = ATR × 이 값. 클수록 박스 두꺼움 |

### Volume
| 항목 | 기본값 | 설명 |
|---|---|---|
| Volume MA Length | 20 | 거래량 평균 길이 |
| Volume Spike × MA | 1.5 | 거래량 평균의 N배 이상이면 스파이크. 높일수록 박스 적게 생김 |

### Diamond Signal
| 항목 | 기본값 | 설명 |
|---|---|---|
| Pressure Absorption Bars | 5 | 직전 N바 동안의 추세 강도 측정 구간 |
| Require Pressure Absorption | true | 끄면 단순 박스 도달 + 반전 캔들로 신호 발생 (신호 ↑, 정확도 ↓) |
| Reversal Candle Body % | 0.55 | 반전 캔들 몸통이 전체 범위에서 차지할 최소 비율 |

### Trade Plan
| 항목 | 기본값 | 설명 |
|---|---|---|
| Show SL/TP Lines | true | 신호 발생 시 손절/익절 라인 표시 |
| Risk : Reward Ratio | 1.5 | 영상의 1.5R 기본값. 본인 전략에 맞게 조정 |
| SL/TP Line Length | 30 | 라인이 우측으로 그려지는 바 수 |

## 알람 설정

신호별로 알람 4종 분리 설정 가능:

1. 차트 우측 상단 **알람** 아이콘 (시계) 클릭 → **+ 알람 만들기**
2. **조건**: `Volume S/R Diamond Signals` 선택
3. 다음 중 선택:
   - `Long Diamond` — 롱 진입 신호
   - `Short Diamond` — 숏 진입 신호
   - `Resistance Break` — 저항 돌파 (롱 추세 전환)
   - `Support Break` — 지지 이탈 (숏 추세 전환)
4. **옵션**: `Once Per Bar Close` (마감 확정 후 알람) 권장
5. 알람 메시지에 `{{ticker}}`, `{{interval}}`, `{{close}}` 자동 치환됨

## 사용 시 주의사항 (영상 강조 부분)

1. **같은 박스 다회 테스트는 약화**: 처음 1~2번 반응이 가장 정확. 박스 안에서 박스 안에서 가격이 여러 번 왕복 후 발생한 신호는 무시
2. **욕심 금지**: TP 도달 후 추가 수익 노리지 말고 청산. "확정된 수익이 진짜 수익"
3. **추세 필터 권장**: 1H/4H 추세에 역행하는 신호는 보수적으로 (이 지표는 추세 필터 미포함 — 별도 EMA로 보조)
4. **영상의 원본 지표가 아님**: 정확한 알고리즘이 비공개라 근사 구현. 백테스트로 본인 시장에 맞춰 파라미터 튜닝 필요

## 권장 백테스트 파라미터 시작점 (BTCUSDT.P)

| 타임프레임 | Pivot Lookback | Volume Spike | Body % |
|---|---|---|---|
| 5m | 8 | 1.8 | 0.6 |
| 15m | 10 | 1.5 | 0.55 |
| 1h | 12 | 1.4 | 0.5 |
| 4h | 15 | 1.3 | 0.5 |
