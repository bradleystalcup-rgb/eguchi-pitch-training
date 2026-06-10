import {
  createChildProfile,
  createEmptySkillMap,
  listChildProfilesForParent,
  type ChildProfileSummary,
} from "@/lib/training/persistence";
import { getCurrentUser } from "@/lib/session";
import { logServerError } from "@/lib/logging";
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
    dailySessionGoal: child.dailySessionGoal,
    dailySessionCounts: child.dailySessionCounts,
    showColorAccessibilityKeys: child.showColorAccessibilityKeys,
    warmUpChordsEnabled: child.warmUpChordsEnabled,
    autoNextEnabled: child.autoNextEnabled,
    hotkeyMode: child.hotkeyMode,
    accidentalMode: child.accidentalMode,
    chordSelectionAlgorithm: child.chordSelectionAlgorithm,
    soundEngine: child.soundEngine,
    progress: child.progress,
    skillMap: child.skillMap,
  };
}

function createEmptyDailySessionCounts() {
  const today = new Date();
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - 6 * 86_400_000;

  return Array.from({ length: 7 }, (_, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count: 0,
  }));
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
    logServerError("Failed to list child profiles", error);
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
      level: validation.value.level,
      dailySessionGoal: validation.value.dailySessionGoal,
    });

    return Response.json(
      {
        child: childResponse({
          id: child.id,
          displayName: child.displayName,
          birthYear: child.birthYear,
          currentLevel: child.currentLevel,
          dailySessionGoal: child.dailySessionGoal,
          dailySessionCounts: createEmptyDailySessionCounts(),
          showColorAccessibilityKeys: child.showColorAccessibilityKeys,
          warmUpChordsEnabled: child.warmUpChordsEnabled,
          autoNextEnabled: child.autoNextEnabled,
          hotkeyMode: child.hotkeyMode,
          accidentalMode: child.accidentalMode,
          chordSelectionAlgorithm: child.chordSelectionAlgorithm,
          soundEngine: child.soundEngine,
          progress: {
            currentLevel: child.currentLevel,
            trainingPhase: "chord_identification",
            sessionsCompleted: 0,
            trialsCompleted: 0,
            correctTrials: 0,
            recentAccuracy: 0,
          },
          skillMap: createEmptySkillMap(child.currentLevel),
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

    logServerError("Failed to create child profile", error);
    return errorResponse("internal_error", "Unable to create child profile.", 500);
  }
}
