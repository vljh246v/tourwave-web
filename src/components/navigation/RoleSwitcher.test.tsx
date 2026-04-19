import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoleSwitcher } from "./RoleSwitcher";

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const baseUser = {
  isAuthenticated: true,
  user: { id: 1, displayName: "테스트", email: "test@test.com" },
  memberships: [],
  logout: mockLogout,
  loading: false,
  error: null,
};

describe("RoleSwitcher", () => {
  it("아바타 클릭 시 드롭다운 열림", () => {
    mockUseAuth.mockReturnValue(baseUser);
    render(<RoleSwitcher mode="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /계정 메뉴/i }));
    expect(screen.getByText("로그아웃")).toBeInTheDocument();
  });

  it("운영자 역할 없는 사용자는 운영자 전환 옵션 미노출", () => {
    mockUseAuth.mockReturnValue({
      ...baseUser,
      memberships: [{ status: "ACTIVE", roles: [] }],
    });
    render(<RoleSwitcher mode="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /계정 메뉴/i }));
    expect(screen.queryByText(/운영자 모드/i)).not.toBeInTheDocument();
  });

  it("운영자 역할 있는 사용자는 운영자 전환 옵션 노출", () => {
    mockUseAuth.mockReturnValue({
      ...baseUser,
      memberships: [{ status: "ACTIVE", roles: ["ORG_MEMBER"] }],
    });
    render(<RoleSwitcher mode="customer" />);
    fireEvent.click(screen.getByRole("button", { name: /계정 메뉴/i }));
    expect(screen.getByText(/운영자 모드로 전환/i)).toBeInTheDocument();
  });
});
