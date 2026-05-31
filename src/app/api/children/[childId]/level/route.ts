import { getCurrentUser } from "@/lib/session";
import {
  isValidLearnerLevel,
  updateChildLevelForParent,
} from "@/lib/training/persistence";
import { errorResponse, validateChildId } from "../../_utils";

export async function PATCH(
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

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse("bad_request", "Request body must be valid JSON.", 400);
  }

  const level =
    typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).level
      : undefined;

  if (!isValidLearnerLevel(level)) {
    return errorResponse("bad_request", "level must be an integer between 1 and 15.", 400);
  }

  try {
    const child = await updateChildLevelForParent({
      parentUserId: user.id,
      childProfileId: validChildId,
      level,
    });

    if (!child) {
      return errorResponse("not_found", "Child profile was not found.", 404);
    }

    return Response.json({
      child: {
        id: child.id,
        name: child.displayName,
        displayName: child.displayName,
        birthYear: child.birthYear,
        level: child.currentLevel,
        currentLevel: child.currentLevel,
        showColorAccessibilityKeys: child.showColorAccessibilityKeys,
        warmUpChordsEnabled: child.warmUpChordsEnabled,
        progress: child.progress,
      },
    });
  } catch (error) {
    console.error("Failed to update child level", error);
    return errorResponse("internal_error", "Unable to update child level.", 500);
  }
}
