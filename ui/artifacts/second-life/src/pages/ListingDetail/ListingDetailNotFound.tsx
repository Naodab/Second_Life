import { useLocation } from "wouter";
import { NotFoundErrorView } from "@/components/errors";

export function ListingDetailNotFound() {
  const [, setLocation] = useLocation();

  return (
    <NotFoundErrorView
      variant="embedded"
      title="Không tìm thấy tin đăng"
      message="Tin có thể đã ngừng hiển thị hoặc đường dẫn không đúng. Thử quay lại trang chủ hoặc tìm kiếm."
      onBack={() => {
        if (window.history.length > 1) window.history.back();
        else setLocation("/");
      }}
      homeHref="/search"
      homeLabel="Tìm kiếm"
    />
  );
}
