import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingPage from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseAuth = vi.fn();
vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("OnboardingPage", () => {
  it("두 역할 카드 렌더링 (운영자 포함)", () => {
    mockUseAuth.mockReturnValue({
      memberships: [{ status: "ACTIVE", roles: ["ORG_MEMBER"] }],
    });
    render(<OnboardingPage />);
    expect(screen.getByText("액티비티 즐기기")).toBeInTheDocument();
    expect(screen.getByText("투어 운영하기")).toBeInTheDocument();
  });

  it("운영자 역할 없는 사용자는 운영자 카드 미노출", () => {
    mockUseAuth.mockReturnValue({
      memberships: [{ status: "ACTIVE", roles: [] }],
    });
    render(<OnboardingPage />);
    expect(screen.queryByText("투어 운영하기")).not.toBeInTheDocument();
  });

  it("고객 카드 클릭 시 / 로 이동", () => {
    mockUseAuth.mockReturnValue({
      memberships: [{ status: "ACTIVE", roles: [] }],
    });
    render(<OnboardingPage />);
    fireEvent.click(screen.getByText("액티비티 즐기기"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
