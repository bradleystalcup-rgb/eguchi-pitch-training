import { getCurrentUser } from "@/lib/session";
import { getActiveChordsForLevel } from "@/lib/training/protocol";
import {
  isValidLearnerLevel,
  isValidChordSelectionAlgorithm,
  startTrainingSession,
} from "@/lib/training/persistence";
import { errorResponse, validateChildId } from "../../_utils";

function colorClassForHex(hex: string) {
  return hex === "#f8fafc" ? "bg-slate-50" : "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("unauthorized", "Authentication is required.", 401);
  }

  const { childId } = await params;
  const validChildId = validateChildId(childId);

  if (!validChildId) {
    return errorResponse("bad_request", "childId is required.", 400);
  }

  let payload: unknown = {};

  try {
    payload = await request.json();
  } catch {
    return errorResponse("bad_request", "Request body must be valid JSON.", 400);
  }

  const level =
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).level
      : undefined;
  const selectionAlgorithm =
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).selectionAlgorithm
      : undefined;

  if (level !== undefined && !isValidLearnerLevel(level)) {
    return errorResponse("bad_request", "level must be an integer between 2 and 15.", 400);
  }

  if (
    selectionAlgorithm !== undefined &&
    !isValidChordSelectionAlgorithm(selectionAlgorithm)
  ) {
    return errorResponse("bad_request", "selectionAlgorithm must be random or adaptive.", 400);
  }

  try {
    const session = await startTrainingSession({
      parentUserId: user.id,
      childProfileId: validChildId,
      level,
      selectionAlgorithm,
    });
    const chords = getActiveChordsForLevel(session.level);
    const chordsBySlug = new Map(chords.map((chord) => [chord.slug, chord]));
    const firstTrial = session.trialPlan[0];
    const choices = chords.map((chord) => ({
      id: chord.slug,
      label: chord.answerLabel,
      helper: chord.phase === "white-keys" ? "Color flag" : chord.notes.join(" "),
      colorHex: chord.colorHex,
      textClass: chord.textClass,
      colorAddKey: chord.colorAddKey,
      colorClass: colorClassForHex(chord.colorHex),
    }));

    if (!firstTrial) {
      throw new Error("Session is missing its first trial.");
    }

    const firstChord = chordsBySlug.get(firstTrial.promptChordSlug);

    if (!firstChord) {
      throw new Error(`Session references unknown chord: ${firstTrial.promptChordSlug}`);
    }

    const currentTrial = {
      trialIndex: firstTrial.trialIndex,
      taskType: firstTrial.taskType,
      answerMode: firstTrial.answerMode,
      promptChordSlug: firstChord.slug,
      prompt: firstChord.phase === "white-keys" ? "Choose the color flag." : "Choose the chord name.",
      toneNotes: firstChord.toneNotes,
      isolatedToneNote: firstTrial.isolatedToneNote,
      correctChoiceId: firstChord.slug,
    };

    return Response.json(
      {
        session: {
          id: session.id,
          level: session.level,
          trainingPhase: session.trainingPhase,
          selectionAlgorithm: session.selectionAlgorithm,
          totalTrials: session.totalTrials,
          choices,
          currentTrial,
          trials: [currentTrial],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Child profile not found")) {
      return errorResponse("not_found", "Child profile was not found.", 404);
    }

    console.error("Failed to start practice session", error);
    return errorResponse("internal_error", "Unable to start practice session.", 500);
  }
}
