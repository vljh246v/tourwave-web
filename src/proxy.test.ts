import { describe, it, expect } from "vitest";
import { proxy } from "./proxy";
import { NextRequest } from "next/server";

function makeRequest(path: string, hasCookie = false) {
  const url = `http://localhost${path}`;
  const req = new NextRequest(url);
  if (hasCookie) {
    req.cookies.set("access_token", "mock-token");
  }
  return req;
}

describe("proxy (route guard)", () => {
  it("미인증 요청은 /login으로 리다이렉트", () => {
    const res = proxy(makeRequest("/bookings"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("/login 접근은 리다이렉트 없음", () => {
    const res = proxy(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("/ 공개 경로 — 미인증도 통과", () => {
    const res = proxy(makeRequest("/"));
    expect(res.status).toBe(200);
  });

  it("인증된 요청은 통과", () => {
    const res = proxy(makeRequest("/bookings", true));
    expect(res.status).toBe(200);
  });

  it("/operator 미인증 접근 → /login 리다이렉트", () => {
    const res = proxy(makeRequest("/operator"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("/explore 미인증도 통과", () => {
    const res = proxy(makeRequest("/explore"));
    expect(res.status).toBe(200);
  });

  it("/explore/제주-서핑 미인증도 통과", () => {
    const res = proxy(makeRequest("/explore/제주-서핑"));
    expect(res.status).toBe(200);
  });
});
