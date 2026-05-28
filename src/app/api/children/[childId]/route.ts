import {
  getChildProfileForParent,
  updateChildColorAccessibilityForParent,
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

  if (typeof showColorAccessibilityKeys !== "boolean") {
    return errorResponse("bad_request", "showColorAccessibilityKeys must be a boolean.", 400);
  }

  try {
    const child = await updateChildColorAccessibilityForParent({
      parentUserId: user.id,
      childProfileId: validChildId,
      showColorAccessibilityKeys,
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
        progress: child.progress,
      },
    });
  } catch (error) {
    console.error("Failed to update child accessibility settings", error);
    return errorResponse("internal_error", "Unable to update child accessibility settings.", 500);
  }
}
