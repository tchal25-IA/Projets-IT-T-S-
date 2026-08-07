import { createFileRoute } from "@tanstack/react-router";
import { FF } from "@/lib/ff-colors";
import { useRoutineSession } from "@/hooks/use-routine-session";
import { CheckinForm } from "@/components/routine/checkin-form";
import { RoutinePlayer } from "@/components/routine/routine-player";

export const Route = createFileRoute("/_authenticated/fusionfit/routine")({
  component: RoutinePage,
});

function RoutinePage() {
  const session = useRoutineSession();

  if (session.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 animate-spin" style={{ borderColor: FF.cyan, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (session.step === "routine") {
    return (
      <RoutinePlayer
        source={session.source}
        coachSession={session.coachSession}
        sessionStartedAt={session.sessionStartedAt}
        sessionEnded={session.sessionEnded}
        elapsedSec={session.elapsedSec}
        serenite={session.serenite}
        total={session.total}
        done={session.done}
        routine={session.routine}
        exState={session.exState}
        expandedTips={session.expandedTips}
        expandedScaling={session.expandedScaling}
        isSaving={session.isSaving}
        ressentiScore={session.ressentiScore}
        ressentiNote={session.ressentiNote}
        onStart={session.startSession}
        onEnd={session.handleEndSession}
        onToggleExercise={session.toggleExercise}
        onToggleTip={session.toggleTip}
        onToggleScaling={session.toggleScaling}
        onSaveRessenti={session.handleSaveRessenti}
        onReset={session.reset}
      />
    );
  }

  return (
    <CheckinForm
      checkIn={session.checkIn}
      setCheckIn={session.setCheckIn}
      canGenerate={session.canGenerate}
      coachSession={session.coachSession}
      todayCheckin={session.todayCheckin}
      onGenerate={session.handleGenerate}
    />
  );
}
