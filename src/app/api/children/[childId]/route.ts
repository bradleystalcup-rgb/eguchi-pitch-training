import {
  getChildProfileForParent,
  updateChildPracticeSettingsForParent,
} from "@/lib/training/persistence";
import { getCurrentUser } from "@/lib/session";
import { errorResponse, validateChildId } from "../_utils";

export async function GET(
  _request: Request,
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

  try {
    const child = await getChildProfileForParent(user.id, validChildId);

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
    console.error("Failed to read child profile", error);
    return errorResponse("internal_error", "Unable to read child profile.", 500);
  }
}

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

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return errorResponse("bad_request", "Request body must be a JSON object.", 400);
  }

  const showColorAccessibilityKeys = (payload as Record<string, unknown>).showColorAccessibilityKeys;
  const warmUpChordsEnabled = (payload as Record<string, unknown>).warmUpChordsEnabled;

  if (showColorAccessibilityKeys !== undefined && typeof showColorAccessibilityKeys !== "boolean") {
    return errorResponse("bad_request", "showColorAccessibilityKeys must be a boolean.", 400);
  }

  if (
    warmUpChordsEnabled !== undefined &&
    warmUpChordsEnabled !== null &&
    typeof warmUpChordsEnabled !== "boolean"
  ) {
    return errorResponse("bad_request", "warmUpChordsEnabled must be a boolean or null.", 400);
  }

  if (showColorAccessibilityKeys === undefined && warmUpChordsEnabled === undefined) {
    return errorResponse("bad_request", "At least one child setting is required.", 400);
  }

  try {
    const child = await updateChildPracticeSettingsForParent({
      parentUserId: user.id,
      childProfileId: validChildId,
      showColorAccessibilityKeys:
        typeof showColorAccessibilityKeys === "boolean" ? showColorAccessibilityKeys : undefined,
      warmUpChordsEnabled:
        typeof warmUpChordsEnabled === "boolean" || warmUpChordsEnabled === null
          ? warmUpChordsEnabled
          : undefined,
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
    console.error("Failed to update child practice settings", error);
    return errorResponse("internal_error", "Unable to update child practice settings.", 500);
  }
}
