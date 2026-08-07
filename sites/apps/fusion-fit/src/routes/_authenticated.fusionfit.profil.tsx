import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AthleteProfil } from "@/components/profil/athlete-profil";
import { CoachProfil } from "@/components/profil/coach-profil";

export const Route = createFileRoute("/_authenticated/fusionfit/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const { role } = useAuth();
  return role === "coach" ? <CoachProfil /> : <AthleteProfil />;
}
