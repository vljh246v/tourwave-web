/**
 * LoginForm.test.tsx — 로그인 폼 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 컴포넌트 렌더링 (이메일/비밀번호 입력, 제출 버튼)
 * - 폼 제출 시 useAuth().login() 호출 확인
 * - 에러 응답 시 에러 메시지 표시 확인
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./LoginForm";
import { ApiError } from "@/lib/api/errors";

// useAuth 모듈 mock
vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/lib/auth/useAuth";

const mockUseAuth = vi.mocked(useAuth);

describe("LoginForm", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      org: null,
      memberships: [],
      loading: false,
      error: null,
      login: mockLogin,
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });
  });

  // 비밀번호 입력 필드를 label로 찾는 헬퍼 (toggle 버튼의 aria-label과 구분)
  function getPasswordInput() {
    return screen.getByRole("textbox", { name: /이메일/i })
      ? screen.getByPlaceholderText("비밀번호를 입력하세요")
      : screen.getByPlaceholderText("비밀번호를 입력하세요");
  }

  it("이메일, 비밀번호 입력 필드와 제출 버튼을 렌더링한다", () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText("example@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("비밀번호를 입력하세요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /로그인/i })).toBeInTheDocument();
  });

  it("이메일과 비밀번호를 입력할 수 있다", () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText("example@email.com");
    const passwordInput = getPasswordInput();

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("폼 제출 시 login()을 이메일/비밀번호와 함께 호출한다", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: "password123" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /로그인/i }).closest("form")!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledOnce();
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("로그인 성공 시 onSuccess 콜백을 호출한다", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: "password123" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /로그인/i }).closest("form")!);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("이메일 형식이 올바르지 않으면 필드 에러를 표시한다", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: "password123" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /로그인/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/올바른 이메일 형식이 아닙니다/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("비밀번호가 공백만이면 필드 에러를 표시한다", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: "   " },
    });

    fireEvent.submit(screen.getByRole("button", { name: /로그인/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/비밀번호를 입력하세요/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("401 에러 응답 시 인증 오류 메시지를 표시한다", async () => {
    mockLogin.mockRejectedValueOnce(
      new ApiError(401, "UNAUTHORIZED", "Unauthorized")
    );
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: "wrongpassword" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /로그인/i }).closest("form")!);

    await waitFor(() => {
      expect(
        screen.getByText(/이메일 또는 비밀번호가 올바르지 않습니다/i)
      ).toBeInTheDocument();
    });
  });

  it("422 에러 응답 시 유효성 오류 메시지를 표시한다", async () => {
    mockLogin.mockRejectedValueOnce(
      new ApiError(422, "VALIDATION_ERROR", "Validation Error")
    );
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: "password123" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /로그인/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/입력값이 유효하지 않습니다/i)).toBeInTheDocument();
    });
  });

  it("비밀번호 show/hide 토글 버튼이 렌더링된다", () => {
    render(<LoginForm />);

    const toggleButton = screen.getByRole("button", { name: /비밀번호 보기/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("비밀번호 토글 시 input type이 변경된다", () => {
    render(<LoginForm />);

    const passwordInput = getPasswordInput();
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /비밀번호 보기/i });
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
