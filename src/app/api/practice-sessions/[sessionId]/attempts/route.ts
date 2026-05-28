import { getCurrentUser } from "@/lib/session";
import { getActiveChordsForLevel } from "@/lib/training/protocol";
import { recordTrainingAttempt } from "@/lib/training/persistence";
import { errorResponse, isUniqueConstraintError } from "../../../children/_utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("unauthorized", "Authentication is required.", 401);
  }

  const { sessionId } = await params;

  if (!sessionId.trim()) {
    return errorResponse("bad_request", "sessionId is required.", 400);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse("bad_request", "Request body must be valid JSON.", 400);
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return errorResponse("bad_request", "Request body must be a JSON object.", 400);
  }

  const body = payload as Record<string, unknown>;
  const trialIndex = body.trialIndex;
  const promptChordSlug = body.promptChordSlug ?? body.chordSlug;
  const selectedChordSlug = body.selectedChordSlug ?? body.selectedChoiceId;
  const selectedNotes = body.selectedNotes;
  const selectedToneNote = body.selectedToneNote;
  const responseMs = body.responseMs;
  const validTrialIndex =
    typeof trialIndex === "number" && Number.isInteger(trialIndex) ? trialIndex : null;
  const validResponseMs =
    typeof responseMs === "number" && Number.isInteger(responseMs) ? responseMs : null;
  const validSelectedNotes =
    Array.isArray(selectedNotes) &&
    selectedNotes.length > 0 &&
    selectedNotes.length <= 8 &&
    selectedNotes.every((note) => typeof note === "string" && note.trim().length > 0 && note.length <= 8)
      ? selectedNotes.map((note) => note.trim())
      : null;

  if (
    validTrialIndex === null ||
    typeof promptChordSlug !== "string" ||
    (selectedChordSlug !== undefined && typeof selectedChordSlug !== "string") ||
    (selectedNotes !== undefined && validSelectedNotes === null) ||
    (selectedToneNote !== undefined &&
      (typeof selectedToneNote !== "string" || !selectedToneNote.trim() || selectedToneNote.length > 8)) ||
    validResponseMs === null ||
    validResponseMs < 0 ||
    validResponseMs > 300_000
  ) {
    return errorResponse("bad_request", "Attempt payload is invalid.", 400);
  }

  try {
    const result = await recordTrainingAttempt({
      parentUserId: user.id,
      sessionId,
      trialIndex: validTrialIndex,
      promptChordSlug,
      selectedChordSlug: typeof selectedChordSlug === "string" ? selectedChordSlug : null,
      selectedNotes: validSelectedNotes,
      selectedToneNote: typeof selectedToneNote === "string" ? selectedToneNote.trim() : null,
      responseMs: validResponseMs,
    });

    if (result.status === "not_found") {
      return errorResponse("not_found", "Practice session was not found.", 404);
    }

    if (result.status === "not_active") {
      return errorResponse("conflict", "Practice session is not active.", 409);
    }

    if (result.status === "invalid_attempt") {
      return errorResponse("bad_request", "Attempt payload is invalid for this session.", 400);
    }

    const chords = getActiveChordsForLevel(result.session.level);
    const nextChord = result.nextTrial
      ? chords.find((chord) => chord.slug === result.nextTrial?.promptChordSlug)
      : undefined;

    if (result.nextTrial && !nextChord) {
      return errorResponse("internal_error", "Practice session referenced an unknown chord.", 500);
    }

    return Response.json(
      {
        attempt: {
          id: result.trial.id,
          trialIndex: result.trial.trialIndex,
          promptChordSlug: result.trial.promptChordSlug,
          selectedChordSlug: result.trial.selectedChordSlug,
          selectedNotes: result.trial.selectedNotes,
          selectedToneNote: result.trial.selectedToneNote,
          isCorrect: result.trial.isCorrect,
          responseMs: result.trial.responseMs,
        },
        nextTrial:
          result.nextTrial && nextChord
            ? {
                trialIndex: result.nextTrial.trialIndex,
                taskType: result.nextTrial.taskType,
                answerMode: result.nextTrial.answerMode,
                promptChordSlug: nextChord.slug,
                prompt: nextChord.phase === "white-keys" ? "Choose the color flag." : "Choose the chord name.",
                toneNotes: nextChord.toneNotes,
                isolatedToneNote: result.nextTrial.isolatedToneNote,
                correctChoiceId: nextChord.slug,
              }
            : null,
        session: {
          status: result.nextTrial ? "active" : "ready_to_complete",
          trainingPhase: result.session.trainingPhase,
          answeredTrials: result.trial.trialIndex + 1,
          totalTrials: result.session.totalTrials,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return errorResponse("conflict", "This trial already has an attempt.", 409);
    }

    console.error("Failed to record practice attempt", error);
    return errorResponse("internal_error", "Unable to record practice attempt.", 500);
  }
}
