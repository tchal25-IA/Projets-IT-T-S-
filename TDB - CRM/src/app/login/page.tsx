import { Suspense } from "react";
import LoginPage from "./login-client";

export default function Page() {
  const showDemo =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SHOW_DEMO_LOGIN === "true";

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f2f2c]" />}>
      <LoginPage showDemo={showDemo} />
    </Suspense>
  );
}
