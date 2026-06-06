import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminRoute } from "./AdminRoute";
import { useAuth } from "@/context/AuthContext";

const setLocationMock = vi.fn();

vi.mock("wouter", () => ({
  Route: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ["/admin/listings/pending", setLocationMock],
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = vi.mocked(useAuth);

function StubAdminPage() {
  return <div>Admin content</div>;
}

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while auth is resolving", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: false,
      isLoading: true,
      isAdmin: false,
    } as ReturnType<typeof useAuth>);

    render(<AdminRoute path="/admin/*?" component={StubAdminPage} />);
    expect(screen.getByText("Đang tải…")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: false,
      isLoading: false,
      isAdmin: false,
    } as ReturnType<typeof useAuth>);

    const { container } = render(<AdminRoute path="/admin/*?" component={StubAdminPage} />);
    expect(container).toBeEmptyDOMElement();
    expect(setLocationMock).toHaveBeenCalled();
  });

  it("blocks non-admin users with 403 view", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: false,
    } as ReturnType<typeof useAuth>);

    render(<AdminRoute path="/admin/*?" component={StubAdminPage} />);
    expect(screen.getByText("Không có quyền truy cập")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  it("renders admin page for admin users", () => {
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      isAdmin: true,
    } as ReturnType<typeof useAuth>);

    render(<AdminRoute path="/admin/*?" component={StubAdminPage} />);
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
