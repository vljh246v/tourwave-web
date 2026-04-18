export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// HTTP status → fallback user message
const STATUS_MESSAGES: Record<number, string> = {
  400: "잘못된 요청입니다.",
  401: "인증 필요. 다시 로그인하세요.",
  403: "접근 권한이 없습니다.",
  404: "요청한 리소스를 찾을 수 없습니다.",
  409: "현재 상태에서 처리할 수 없는 요청입니다.",
  422: "입력값이 유효하지 않습니다.",
  500: "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.",
};

// Backend domain error codes → user message (openapi.yaml §ErrorCode)
const DOMAIN_MESSAGES: Record<string, string> = {
  INVALID_STATE_TRANSITION: "예약 상태를 변경할 수 없습니다.",
  BOOKING_TERMINAL_STATE: "이미 종료된 예약입니다.",
  OFFER_EXPIRED: "오퍼가 만료되었습니다.",
  OFFER_NOT_ACTIVE: "오퍼가 활성 상태가 아닙니다.",
  CAPACITY_EXCEEDED: "잔여 좌석이 없습니다.",
  PARTY_SIZE_INCREASE_NOT_ALLOWED: "인원 추가는 허용되지 않습니다.",
  WAITLIST_PROMOTION_NOT_POSSIBLE: "대기열 승격이 불가합니다.",
  DUPLICATE_REVIEW: "이미 리뷰를 작성했습니다.",
  INQUIRY_ALREADY_EXISTS: "이미 문의가 존재합니다.",
  PAYMENT_ALREADY_REFUNDED: "이미 환불된 결제입니다.",
  BOOKING_SCOPE_MISMATCH: "예약 범위가 맞지 않습니다.",
  INVITE_WINDOW_CLOSED: "초대 가능 시간이 지났습니다.",
  ATTENDANCE_NOT_ELIGIBLE: "출석 처리 대상이 아닙니다.",
  INVALID_PARTICIPANT_STATUS: "참가자 상태가 유효하지 않습니다.",
  OFFER_EXPIRY_INVALID: "오퍼 만료 시각이 유효하지 않습니다.",
  PARTY_SIZE_OUT_OF_RANGE: "인원 수가 허용 범위를 벗어났습니다.",
  REQUIRED_FIELD_MISSING: "필수 항목이 누락되었습니다.",
  VALIDATION_ERROR: "입력값이 유효하지 않습니다.",
  IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD: "동일한 키로 다른 내용을 요청할 수 없습니다.",
  IDEMPOTENCY_IN_PROGRESS: "동일한 요청이 처리 중입니다. 잠시 후 다시 시도하세요.",
};

export function mapErrorMessage(status: number, code: string): string {
  return DOMAIN_MESSAGES[code] ?? STATUS_MESSAGES[status] ?? "알 수 없는 오류가 발생했습니다.";
}
