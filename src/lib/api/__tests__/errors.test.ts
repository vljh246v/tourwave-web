import { describe, it, expect } from "vitest";
import { ApiError, mapErrorMessage } from "../errors";

describe("ApiError", () => {
  it("status, code, message를 올바르게 저장한다", () => {
    const err = new ApiError(404, "NOT_FOUND", "리소스를 찾을 수 없습니다.");
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("리소스를 찾을 수 없습니다.");
    expect(err.name).toBe("ApiError");
  });

  it("instanceof Error를 만족한다", () => {
    const err = new ApiError(500, "SERVER_ERROR", "서버 오류");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});

describe("mapErrorMessage", () => {
  it("알려진 도메인 에러 코드를 반환한다", () => {
    expect(mapErrorMessage(409, "INVALID_STATE_TRANSITION")).toBe(
      "예약 상태를 변경할 수 없습니다."
    );
  });

  it("도메인 코드가 HTTP status보다 우선한다", () => {
    // status 422의 기본 메시지는 "입력값이 유효하지 않습니다."
    // 도메인 코드 CAPACITY_EXCEEDED가 있으면 더 구체적인 메시지 반환
    const msg = mapErrorMessage(422, "CAPACITY_EXCEEDED");
    expect(msg).toBe("잔여 좌석이 없습니다.");
  });

  it("알 수 없는 도메인 코드면 HTTP status 메시지를 반환한다", () => {
    expect(mapErrorMessage(400, "UNKNOWN_DOMAIN_CODE")).toBe("잘못된 요청입니다.");
  });

  it("알 수 없는 status + 알 수 없는 코드면 기본 메시지를 반환한다", () => {
    expect(mapErrorMessage(599, "TOTALLY_UNKNOWN")).toBe(
      "알 수 없는 오류가 발생했습니다."
    );
  });

  it("IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD 코드를 처리한다", () => {
    const msg = mapErrorMessage(422, "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD");
    expect(msg).toBe("동일한 키로 다른 내용을 요청할 수 없습니다.");
  });

  it("OFFER_EXPIRED 코드를 처리한다", () => {
    expect(mapErrorMessage(409, "OFFER_EXPIRED")).toBe("오퍼가 만료되었습니다.");
  });

  it("401 status 기본 메시지를 반환한다", () => {
    expect(mapErrorMessage(401, "UNAUTHORIZED")).toBe(
      "인증 필요. 다시 로그인하세요."
    );
  });
});
