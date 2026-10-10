-- RPC d'attribution Atelier : copie profonde template → N instances athlète
-- Idempotent via atelier_assignment_requests.idempotency_key

CREATE OR REPLACE FUNCTION public.assign_atelier_template(
  p_template_id uuid,
  p_athlete_ids uuid[],
  p_idempotency_key text,
  p_scheduled_for date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach uuid := auth.uid();
  v_batch uuid := gen_random_uuid();
  v_existing public.atelier_assignment_requests%ROWTYPE;
  v_tpl public.atelier_sessions%ROWTYPE;
  v_athlete uuid;
  v_new_session uuid;
  v_old_block uuid;
  v_new_block uuid;
  v_ok uuid[] := '{}';
  v_fail jsonb := '[]'::jsonb;
  v_item public.atelier_session_items%ROWTYPE;
  v_snap jsonb;
  v_lib public.library_items%ROWTYPE;
  r_block record;
BEGIN
  IF v_coach IS NULL OR NOT public.has_role(v_coach, 'coach') THEN
    RAISE EXCEPTION 'Réservé au coach';
  END IF;

  SELECT * INTO v_existing
  FROM public.atelier_assignment_requests
  WHERE coach_id = v_coach AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_existing.result;
  END IF;

  SELECT * INTO v_tpl FROM public.atelier_sessions
  WHERE id = p_template_id AND coach_id = v_coach AND kind = 'template';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modèle introuvable';
  END IF;

  FOREACH v_athlete IN ARRAY p_athlete_ids LOOP
    BEGIN
      IF NOT public.is_coach_of(v_coach, v_athlete) THEN
        v_fail := v_fail || jsonb_build_array(jsonb_build_object('athlete_id', v_athlete, 'error', 'not_assigned'));
        CONTINUE;
      END IF;

      v_new_session := gen_random_uuid();
      INSERT INTO public.atelier_sessions (
        id, coach_id, kind, athlete_id, source_session_id, source_version,
        batch_id, title, objectif, scheduled_for, status, customized, version, created_by
      ) VALUES (
        v_new_session, v_coach, 'instance', v_athlete, v_tpl.id, v_tpl.version,
        v_batch, v_tpl.title, v_tpl.objectif, p_scheduled_for, 'assigned', false, 1, v_coach
      );

      FOR r_block IN
        SELECT id FROM public.atelier_session_blocks WHERE session_id = v_tpl.id
      LOOP
        v_old_block := r_block.id;
        v_new_block := gen_random_uuid();
        INSERT INTO public.atelier_session_blocks (id, session_id, phase, block_type, position, config)
        SELECT v_new_block, v_new_session, phase, block_type, position, config
        FROM public.atelier_session_blocks WHERE id = v_old_block;

        FOR v_item IN
          SELECT * FROM public.atelier_session_items WHERE block_id = v_old_block
        LOOP
          v_snap := v_item.exercise_snapshot;
          IF v_item.library_item_id IS NOT NULL THEN
            SELECT * INTO v_lib FROM public.library_items WHERE id = v_item.library_item_id;
            IF FOUND THEN
              v_snap := jsonb_build_object(
                'code', v_lib.code,
                'nom_fr', v_lib.nom_fr,
                'nom_en', v_lib.nom_en,
                'categorie', v_lib.categorie,
                'materiel', v_lib.materiel,
                'muscles_principaux', v_lib.muscles_principaux,
                'respiration', v_lib.respiration,
                'coach_tip', v_lib.coach_tip,
                'niveau', CASE v_item.level
                  WHEN 1 THEN v_lib.niveau_1
                  WHEN 2 THEN v_lib.niveau_2
                  WHEN 3 THEN v_lib.niveau_3
                  ELSE coalesce(v_lib.niveau_2, v_lib.niveau_1)
                END,
                'library_item_revision', v_lib.revision
              );
            END IF;
          END IF;

          INSERT INTO public.atelier_session_items (
            block_id, library_item_id, library_item_revision, exercise_snapshot,
            position, level, sets, reps, duration_s, load, tempo, rest_s, rpe, note
          ) VALUES (
            v_new_block, v_item.library_item_id, coalesce((v_snap->>'library_item_revision')::int, v_item.library_item_revision),
            coalesce(v_snap, '{}'::jsonb),
            v_item.position, v_item.level, v_item.sets, v_item.reps, v_item.duration_s,
            v_item.load, v_item.tempo, v_item.rest_s, v_item.rpe, v_item.note
          );
        END LOOP;
      END LOOP;

      INSERT INTO public.atelier_session_audits (session_id, actor_id, action, detail)
      VALUES (v_new_session, v_coach, 'assigned', jsonb_build_object('from_template', v_tpl.id, 'batch_id', v_batch));

      v_ok := array_append(v_ok, v_new_session);
    EXCEPTION WHEN OTHERS THEN
      v_fail := v_fail || jsonb_build_array(jsonb_build_object('athlete_id', v_athlete, 'error', SQLERRM));
    END;
  END LOOP;

  INSERT INTO public.atelier_assignment_requests (
    coach_id, template_id, idempotency_key, athlete_ids, batch_id, result
  ) VALUES (
    v_coach, p_template_id, p_idempotency_key, p_athlete_ids, v_batch,
    jsonb_build_object(
      'batch_id', v_batch,
      'ok_count', coalesce(array_length(v_ok, 1), 0),
      'instance_ids', to_jsonb(v_ok),
      'failures', v_fail
    )
  );

  RETURN (
    SELECT result FROM public.atelier_assignment_requests
    WHERE coach_id = v_coach AND idempotency_key = p_idempotency_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_atelier_template(uuid, uuid[], text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_atelier_template(uuid, uuid[], text, date) TO authenticated;

COMMENT ON FUNCTION public.assign_atelier_template IS
  'Attribution Atelier : deep-copy template → instances athlète (idempotent)';
