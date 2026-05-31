import {
  createChildProfile,
  listChildProfilesForParent,
  type ChildProfileSummary,
} from "@/lib/training/persistence";
import { getCurrentUser } from "@/lib/session";
import {
  errorResponse,
  isUniqueConstraintError,
  validateCreateChildPayload,
} from "./_utils";

function childResponse(child: ChildProfileSummary) {
  return {
    id: child.id,
    name: child.displayName,
    displayName: child.displayName,
    birthYear: child.birthYear,
    level: child.currentLevel,
    currentLevel: child.currentLevel,
    showColorAccessibilityKeys: child.showColorAccessibilityKeys,
    warmUpChordsEnabled: child.warmUpChordsEnabled,
    progress: child.progress,
  };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("unauthorized", "Authentication is required.", 401);
  }

  try {
    const children = await listChildProfilesForParent(user.id);
    return Response.json({ children: children.map(childResponse) });
  } catch (error) {
    console.error("Failed to list child profiles", error);
    return errorResponse("internal_error", "Unable to list child profiles.", 500);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse("unauthorized", "Authentication is required.", 401);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse("bad_request", "Request body must be valid JSON.", 400);
  }

  const validation = validateCreateChildPayload(payload);

  if (!validation.ok) {
    return errorResponse("bad_request", validation.message, 400);
  }

  try {
    const child = await createChildProfile({
      parentUserId: user.id,
      displayName: validation.value.displayName,
      birthYear: validation.value.birthYear,
    });

    return Response.json(
      {
        child: childResponse({
          id: child.id,
          displayName: child.displayName,
          birthYear: child.birthYear,
          currentLevel: child.currentLevel,
          showColorAccessibilityKeys: child.showColorAccessibilityKeys,
          warmUpChordsEnabled: child.warmUpChordsEnabled,
          progress: {
            currentLevel: child.currentLevel,
            trainingPhase: "chord_identification",
            sessionsCompleted: 0,
            trialsCompleted: 0,
            correctTrials: 0,
            recentAccuracy: 0,
          },
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return errorResponse(
        "conflict",
        "A child profile with this display name already exists.",
        409,
      );
    }

    console.error("Failed to create child profile", error);
    return errorResponse("internal_error", "Unable to create child profile.", 500);
  }
}
