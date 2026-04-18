"use client";

/**
 * SignupForm.tsx — 회원가입 폼 컴포넌트
 *
 * - 이메일 / 비밀번호 / 표시명 입력 + 약관동의 체크박스
 * - 유효성 검사: 이메일 형식, 비밀번호 최소 8자 / 공백 불가, 표시명 공백 불가, 약관동의 필수
 * - 로딩 상태 UI (버튼 비활성화 + 스피너)
 * - 에러 처리: 409(이메일 중복), 422(검증 실패)
 * - 비밀번호 보이기/숨기기 토글
 * - 회원가입 성공 후 리다이렉트는 부모 페이지에서 처리
 */

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth/useAuth";
import type { components } from "@/lib/api/schema";
import { ApiError } from "@/lib/api/errors";

type SignupRequest = components["schemas"]["SignupRequest"];

export interface SignupFormProps {
  /** 회원가입 성공 후 호출되는 콜백 (리다이렉트 등 상위에서 처리) */
  onSuccess?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
  displayName?: string;
  terms?: string;
}

function validateForm(
  email: string,
  password: string,
  displayName: string,
  termsAccepted: boolean,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = "이메일을 입력하세요.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "올바른 이메일 형식이 아닙니다.";
  }

  if (!password) {
    errors.password = "비밀번호를 입력하세요.";
  } else if (password.trim() === "") {
    errors.password = "비밀번호에 공백만 입력할 수 없습니다.";
  } else if (password.length < 8) {
    errors.password = "비밀번호는 최소 8자 이상이어야 합니다.";
  }

  if (!displayName.trim()) {
    errors.displayName = "표시명을 입력하세요.";
  }

  if (!termsAccepted) {
    errors.terms = "이용약관에 동의해야 합니다.";
  }

  return errors;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateForm(email, password, displayName, termsAccepted);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);

    const data: SignupRequest = {
      email: email.trim(),
      password,
      displayName: displayName.trim(),
    };

    try {
      await signup(data);
      onSuccess?.();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setSubmitError("이미 가입된 이메일입니다.");
        } else if (err.status === 422) {
          setSubmitError("입력값이 유효하지 않습니다.");
        } else {
          setSubmitError(
            err.message || "회원가입에 실패했습니다. 다시 시도하세요.",
          );
        }
      } else if (err instanceof Error) {
        setSubmitError(
          err.message || "회원가입에 실패했습니다. 다시 시도하세요.",
        );
      } else {
        setSubmitError("회원가입에 실패했습니다. 다시 시도하세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* 전체 에러 메시지 */}
      {submitError ? (
        <div
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      ) : null}

      {/* 이메일 */}
      <Input
        type="email"
        label="이메일"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (fieldErrors.email) {
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }
        }}
        error={fieldErrors.email}
        disabled={isLoading}
        autoComplete="email"
        required
      />

      {/* 비밀번호 */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="비밀번호"
            placeholder="비밀번호를 입력하세요 (8자 이상)"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={fieldErrors.password}
            disabled={isLoading}
            autoComplete="new-password"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-8 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            tabIndex={0}
          >
            {showPassword ? (
              /* 눈 닫힘 아이콘 */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.96 9.96 0 015.657 1.757M15 12a3 3 0 11-6 0 3 3 0 016 0zm5.656-5.656L4.344 19.656"
                />
              </svg>
            ) : (
              /* 눈 열림 아이콘 */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 표시명 */}
      <Input
        type="text"
        label="표시명"
        placeholder="표시명을 입력하세요"
        value={displayName}
        onChange={(e) => {
          setDisplayName(e.target.value);
          if (fieldErrors.displayName) {
            setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
          }
        }}
        error={fieldErrors.displayName}
        disabled={isLoading}
        autoComplete="name"
        required
      />

      {/* 약관동의 */}
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (fieldErrors.terms) {
                setFieldErrors((prev) => ({ ...prev, terms: undefined }));
              }
            }}
            disabled={isLoading}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label="이용약관 동의"
          />
          <span className="text-sm text-gray-700">
            이용약관에 동의합니다
          </span>
        </label>
        {fieldErrors.terms ? (
          <p className="text-sm text-red-600" role="alert">
            {fieldErrors.terms}
          </p>
        ) : null}
      </div>

      {/* 제출 버튼 */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "가입 중..." : "회원가입"}
      </Button>
    </form>
  );
}
