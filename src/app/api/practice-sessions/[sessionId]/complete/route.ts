import { getCurrentUser } from "@/lib/session";
import { completeTrainingSessionFromSavedAttempts } from "@/lib/training/persistence";
import { errorResponse } from "../../../children/_utils";

export async function POST(
  _request: Request,
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

  try {
    const result = await completeTrainingSessionFromSavedAttempts({
      parentUserId: user.id,
      sessionId,
    });

    if (result.status === "not_found") {
      return errorResponse("not_found", "Practice session was not found.", 404);
    }

    if (result.status === "not_active") {
      return errorResponse("conflict", "Practice session is not active.", 409);
    }

    if (result.status === "empty") {
      return errorResponse("bad_request", "Practice session has no attempts.", 400);
    }

    return Response.json({
      summary: {
        sessionId: result.sessionId,
        childId: result.childProfileId,
        correct: result.correctTrials,
        total: result.totalTrials,
        recentAccuracy: result.decision.recentAccuracy,
        nextLevel: result.decision.nextLevel,
        promoted: result.decision.promoted,
      },
    });
  } catch (error) {
    console.error("Failed to complete practice session", error);
    return errorResponse("internal_error", "Unable to complete practice session.", 500);
  }
}
