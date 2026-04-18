/**
 * SignupForm.test.tsx — 회원가입 폼 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 컴포넌트 렌더링 (이메일/비밀번호/표시명 입력, 약관동의 체크박스, 제출 버튼)
 * - 필수 필드 공란 시 제출 불가
 * - 폼 제출 시 useAuth().signup() 호출 확인
 * - 이메일 중복(409) 응답 시 에러 메시지 표시
 * - 422 응답 시 에러 메시지 표시
 * - 비밀번호 show/hide 토글
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignupForm } from "./SignupForm";
import { ApiError } from "@/lib/api/errors";

// useAuth 모듈 mock
vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/lib/auth/useAuth";

const mockUseAuth = vi.mocked(useAuth);

describe("SignupForm", () => {
  const mockSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      org: null,
      memberships: [],
      loading: false,
      error: null,
      login: vi.fn(),
      signup: mockSignup,
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });
  });

  function fillValidForm() {
    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("비밀번호를 입력하세요 (8자 이상)"),
      { target: { value: "password123" } },
    );
    fireEvent.change(screen.getByPlaceholderText("표시명을 입력하세요"), {
      target: { value: "홍길동" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /이용약관 동의/i }));
  }

  it("이메일, 비밀번호, 표시명 입력 필드와 약관동의 체크박스, 제출 버튼을 렌더링한다", () => {
    render(<SignupForm />);

    expect(
      screen.getByPlaceholderText("example@email.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("비밀번호를 입력하세요 (8자 이상)"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("표시명을 입력하세요"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /이용약관 동의/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /회원가입/i }),
    ).toBeInTheDocument();
  });

  it("폼 필드에 값을 입력할 수 있다", () => {
    render(<SignupForm />);

    const emailInput = screen.getByPlaceholderText("example@email.com");
    const passwordInput = screen.getByPlaceholderText(
      "비밀번호를 입력하세요 (8자 이상)",
    );
    const displayNameInput = screen.getByPlaceholderText("표시명을 입력하세요");
    const checkbox = screen.getByRole("checkbox", { name: /이용약관 동의/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(displayNameInput, { target: { value: "홍길동" } });
    fireEvent.click(checkbox);

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
    expect(displayNameInput).toHaveValue("홍길동");
    expect(checkbox).toBeChecked();
  });

  it("폼 제출 시 signup()을 올바른 데이터와 함께 호출한다", async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    render(<SignupForm />);

    fillValidForm();

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledOnce();
      expect(mockSignup).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        displayName: "홍길동",
      });
    });
  });

  it("회원가입 성공 시 onSuccess 콜백을 호출한다", async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    const onSuccess = vi.fn();
    render(<SignupForm onSuccess={onSuccess} />);

    fillValidForm();

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("이메일 공란이면 필드 에러를 표시한다", async () => {
    render(<SignupForm />);

    fireEvent.change(
      screen.getByPlaceholderText("비밀번호를 입력하세요 (8자 이상)"),
      { target: { value: "password123" } },
    );
    fireEvent.change(screen.getByPlaceholderText("표시명을 입력하세요"), {
      target: { value: "홍길동" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /이용약관 동의/i }));

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(screen.getByText(/이메일을 입력하세요/i)).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("이메일 형식이 올바르지 않으면 필드 에러를 표시한다", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("비밀번호를 입력하세요 (8자 이상)"),
      { target: { value: "password123" } },
    );
    fireEvent.change(screen.getByPlaceholderText("표시명을 입력하세요"), {
      target: { value: "홍길동" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /이용약관 동의/i }));

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/올바른 이메일 형식이 아닙니다/i),
      ).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("비밀번호가 8자 미만이면 필드 에러를 표시한다", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("비밀번호를 입력하세요 (8자 이상)"),
      { target: { value: "short" } },
    );
    fireEvent.change(screen.getByPlaceholderText("표시명을 입력하세요"), {
      target: { value: "홍길동" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /이용약관 동의/i }));

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/비밀번호는 최소 8자 이상이어야 합니다/i),
      ).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("표시명이 공란이면 필드 에러를 표시한다", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("비밀번호를 입력하세요 (8자 이상)"),
      { target: { value: "password123" } },
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /이용약관 동의/i }));

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(screen.getByText(/표시명을 입력하세요/i)).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("약관동의 미체크 시 에러를 표시한다", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByPlaceholderText("example@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("비밀번호를 입력하세요 (8자 이상)"),
      { target: { value: "password123" } },
    );
    fireEvent.change(screen.getByPlaceholderText("표시명을 입력하세요"), {
      target: { value: "홍길동" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/이용약관에 동의해야 합니다/i),
      ).toBeInTheDocument();
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("409 에러 응답 시 이메일 중복 메시지를 표시한다", async () => {
    mockSignup.mockRejectedValueOnce(
      new ApiError(409, "DUPLICATE_EMAIL", "Conflict"),
    );
    render(<SignupForm />);

    fillValidForm();

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/이미 가입된 이메일입니다/i),
      ).toBeInTheDocument();
    });
  });

  it("422 에러 응답 시 유효성 오류 메시지를 표시한다", async () => {
    mockSignup.mockRejectedValueOnce(
      new ApiError(422, "VALIDATION_ERROR", "Validation Error"),
    );
    render(<SignupForm />);

    fillValidForm();

    fireEvent.submit(
      screen.getByRole("button", { name: /회원가입/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/입력값이 유효하지 않습니다/i),
      ).toBeInTheDocument();
    });
  });

  it("비밀번호 show/hide 토글 버튼이 렌더링된다", () => {
    render(<SignupForm />);

    const toggleButton = screen.getByRole("button", { name: /비밀번호 보기/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it("비밀번호 토글 시 input type이 변경된다", () => {
    render(<SignupForm />);

    const passwordInput = screen.getByPlaceholderText(
      "비밀번호를 입력하세요 (8자 이상)",
    );
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: /비밀번호 보기/i });
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
