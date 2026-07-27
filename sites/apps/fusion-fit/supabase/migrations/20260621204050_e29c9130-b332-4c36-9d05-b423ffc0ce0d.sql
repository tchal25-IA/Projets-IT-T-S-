
ALTER VIEW public.checkins SET (security_invoker = true);
ALTER VIEW public.athlete_stats SET (security_invoker = true);
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM authenticated;
