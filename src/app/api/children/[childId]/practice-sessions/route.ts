import { getCurrentUser } from "@/lib/session";
import { getActiveChordsForLevel } from "@/lib/training/protocol";
import {
  isValidLearnerLevel,
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

  if (level !== undefined && !isValidLearnerLevel(level)) {
    return errorResponse("bad_request", "level must be an integer between 2 and 15.", 400);
  }

  try {
    const session = await startTrainingSession({
      parentUserId: user.id,
      childProfileId: validChildId,
      level,
    });
    const chords = getActiveChordsForLevel(session.level);
    const choices = chords.map((chord) => ({
      id: chord.slug,
      label: chord.answerLabel,
      helper: chord.phase === "white-keys" ? "Color flag" : chord.notes.join(" "),
      colorHex: chord.colorHex,
      textClass: chord.textClass,
      colorClass: colorClassForHex(chord.colorHex),
    }));
    const trials = Array.from({ length: session.totalTrials }, (_, index) => {
      const chord = chords[index % chords.length];

      return {
        trialIndex: index,
        promptChordSlug: chord.slug,
        prompt: chord.phase === "white-keys" ? "Choose the color flag." : "Choose the chord name.",
        toneNotes: chord.toneNotes,
        correctChoiceId: chord.slug,
      };
    });

    return Response.json(
      {
        session: {
          id: session.id,
          level: session.level,
          totalTrials: session.totalTrials,
          choices,
          trials,
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
