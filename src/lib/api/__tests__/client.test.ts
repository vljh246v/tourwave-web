import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, setUnauthorizedHandler } from "../client";
import { ApiError } from "../errors";

// fetch를 모킹
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.stubGlobal("crypto", {
    randomUUID: () => "test-uuid-1234-5678-abcd-ef1234567890",
  });
  setUnauthorizedHandler(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

function makeResponse(
  status: number,
  body?: unknown,
  headers?: Record<string, string>
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
  } as unknown as Response;
}

describe("apiClient.get", () => {
  it("GET 요청 시 Idempotency-Key 헤더를 추가하지 않는다", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { id: 1 }));

    await apiClient.get("/test");

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers?.["Idempotency-Key"]).toBeUndefined();
  });

  it("성공 응답의 JSON을 반환한다", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { id: 42 }));

    const result = await apiClient.get<{ id: number }>("/items/42");

    expect(result).toEqual({ id: 42 });
  });
});

describe("apiClient.post", () => {
  it("POST 요청 시 Idempotency-Key 헤더를 자동 주입한다", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, { id: 1 }));

    await apiClient.post("/bookings", { partySize: 2 });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers?.["Idempotency-Key"]).toBe(
      "test-uuid-1234-5678-abcd-ef1234567890"
    );
  });

  it("요청 body를 JSON으로 직렬화한다", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, { ok: true }));

    await apiClient.post("/items", { name: "test", value: 42 });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBe(JSON.stringify({ name: "test", value: 42 }));
  });

  it("Content-Type: application/json 헤더를 포함한다", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(201, {}));

    await apiClient.post("/items", {});

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers?.["Content-Type"]).toBe("application/json");
  });
});

describe("apiClient.patch / put / delete — write 메서드 Idempotency-Key", () => {
  it("PATCH 요청에 Idempotency-Key 주입", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await apiClient.patch("/items/1", { name: "updated" });
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers?.["Idempotency-Key"]).toBeDefined();
  });

  it("PUT 요청에 Idempotency-Key 주입", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await apiClient.put("/items/1", { name: "replaced" });
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers?.["Idempotency-Key"]).toBeDefined();
  });

  it("DELETE 요청에 Idempotency-Key 주입", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204));
    await apiClient.delete("/items/1");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(options.headers?.["Idempotency-Key"]).toBeDefined();
  });
});

describe("204 No Content 처리", () => {
  it("204 응답 시 undefined를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(204));

    const result = await apiClient.delete("/items/1");

    expect(result).toBeUndefined();
  });
});

describe("에러 처리", () => {
  it("401 응답 시 ApiError(401, UNAUTHORIZED)를 throw한다", async () => {
    mockFetch.mockResolvedValue(makeResponse(401));

    let caught: unknown;
    try {
      await apiClient.get("/secure");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect(caught).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("401 발생 시 onUnauthorized 핸들러가 등록돼 있으면 호출한다", async () => {
    mockFetch.mockResolvedValue(makeResponse(401));
    const handler = vi.fn().mockResolvedValue(undefined);
    setUnauthorizedHandler(handler);

    await expect(apiClient.get("/secure")).rejects.toThrow(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("400 응답 시 백엔드 에러코드를 ApiError에 담아 throw한다", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(400, { error: { code: "REQUIRED_FIELD_MISSING", message: "필수 필드 누락" } })
    );

    await expect(apiClient.post("/items", {})).rejects.toMatchObject({
      status: 400,
      code: "REQUIRED_FIELD_MISSING",
    });
  });

  it("에러 응답 body 파싱 실패 시 UNKNOWN 코드로 폴백한다", async () => {
    const badResponse = {
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => { throw new Error("parse error"); },
    } as unknown as Response;
    mockFetch.mockResolvedValueOnce(badResponse);

    await expect(apiClient.get("/broken")).rejects.toMatchObject({
      status: 500,
      code: "UNKNOWN",
    });
  });

  it("422 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD 에러를 처리한다", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(422, {
        error: {
          code: "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
          message: "",
        },
      })
    );

    await expect(apiClient.post("/bookings", {})).rejects.toMatchObject({
      status: 422,
      code: "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
    });
  });
});

describe("credentials 포함", () => {
  it("모든 요청에 credentials: include를 포함한다", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

    await apiClient.get("/me");

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.credentials).toBe("include");
  });
});

describe("BASE_URL 사용", () => {
  it("경로 앞에 BASE_URL이 붙는다 (빈 문자열이면 그대로)", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));

    await apiClient.get("/test-path");

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/test-path$/);
  });
});
