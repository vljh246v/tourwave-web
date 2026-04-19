import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomTabBar } from "./BottomTabBar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("BottomTabBar", () => {
  it("4개 탭 렌더링", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<BottomTabBar />);
    expect(screen.getByText("홈")).toBeInTheDocument();
    expect(screen.getByText("탐색")).toBeInTheDocument();
    expect(screen.getByText("예약")).toBeInTheDocument();
    expect(screen.getByText("마이")).toBeInTheDocument();
  });

  it("현재 경로 탭이 활성 색상 적용", () => {
    vi.mocked(usePathname).mockReturnValue("/explore");
    render(<BottomTabBar />);
    const exploreLink = screen.getByRole("link", { name: /탐색/i });
    expect(exploreLink).toHaveAttribute("aria-current", "page");
  });

  it("루트(/) 경로에서 홈만 활성", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<BottomTabBar />);
    const homeLink = screen.getByRole("link", { name: /홈/i });
    expect(homeLink).toHaveAttribute("aria-current", "page");
    const exploreLink = screen.getByRole("link", { name: /탐색/i });
    expect(exploreLink).not.toHaveAttribute("aria-current", "page");
  });
});
