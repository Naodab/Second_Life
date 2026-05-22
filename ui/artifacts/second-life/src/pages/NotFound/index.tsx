import { useLocation } from "wouter";
import { NotFoundErrorView } from "@/components/errors";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  };

  return (
    <NotFoundErrorView
      variant="fullscreen"
      title="Trang không tồn tại"
      message="Đường dẫn không đúng hoặc trang đã được di chuyển. Hãy quay lại hoặc về trang chủ."
      onBack={handleBack}
      homeHref="/"
    />
  );
}
