import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/fusionfit/")({
  component: FusionfitIndex,
});

function FusionfitIndex() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    navigate({
      to: role === "coach" ? "/fusionfit/escouade" : "/fusionfit/routine",
      replace: true,
    });
  }, [role, loading, navigate]);
  return null;
}
