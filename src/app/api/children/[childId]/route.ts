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
  const autoNextEnabled = (payload as Record<string, unknown>).autoNextEnabled;
  const hotkeyMode = (payload as Record<string, unknown>).hotkeyMode;
  const accidentalMode = (payload as Record<string, unknown>).accidentalMode;
  const chordSelectionAlgorithm = (payload as Record<string, unknown>).chordSelectionAlgorithm;
  const soundEngine = (payload as Record<string, unknown>).soundEngine;
  const dailySessionGoal = (payload as Record<string, unknown>).dailySessionGoal;

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
    if (
      autoNextEnabled === undefined &&
      hotkeyMode === undefined &&
      accidentalMode === undefined &&
      chordSelectionAlgorithm === undefined &&
      soundEngine === undefined &&
      dailySessionGoal === undefined
    ) {
      return errorResponse("bad_request", "At least one child setting is required.", 400);
    }
  }
  if (dailySessionGoal !== undefined) {
    if (
      !Number.isInteger(dailySessionGoal) ||
      typeof dailySessionGoal !== "number" ||
      dailySessionGoal < 1 ||
      dailySessionGoal > 12
    ) {
      return errorResponse("bad_request", "dailySessionGoal must be an integer between 1 and 12.", 400);
    }
  }
  if (autoNextEnabled !== undefined && typeof autoNextEnabled !== "boolean") {
    return errorResponse("bad_request", "autoNextEnabled must be a boolean.", 400);
  }
  if (hotkeyMode !== undefined && hotkeyMode !== "left" && hotkeyMode !== "right") {
    return errorResponse("bad_request", "hotkeyMode must be left or right.", 400);
  }
  if (accidentalMode !== undefined && accidentalMode !== "sharps" && accidentalMode !== "flats") {
    return errorResponse("bad_request", "accidentalMode must be sharps or flats.", 400);
  }
  if (chordSelectionAlgorithm !== undefined && chordSelectionAlgorithm !== "random" && chordSelectionAlgorithm !== "adaptive") {
    return errorResponse("bad_request", "chordSelectionAlgorithm must be random or adaptive.", 400);
  }
  if (soundEngine !== undefined && soundEngine !== "tone" && soundEngine !== "native-synth" && soundEngine !== "sampled") {
    return errorResponse("bad_request", "soundEngine must be tone, native-synth, or sampled.", 400);
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
      autoNextEnabled: typeof autoNextEnabled === "boolean" ? autoNextEnabled : undefined,
      dailySessionGoal: typeof dailySessionGoal === "number" ? dailySessionGoal : undefined,
      hotkeyMode: typeof hotkeyMode === "string" ? hotkeyMode : undefined,
      accidentalMode: typeof accidentalMode === "string" ? accidentalMode : undefined,
      chordSelectionAlgorithm: typeof chordSelectionAlgorithm === "string" ? chordSelectionAlgorithm : undefined,
      soundEngine: typeof soundEngine === "string" ? soundEngine : undefined,
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
      },
    });
  } catch (error) {
    console.error("Failed to update child practice settings", error);
    return errorResponse("internal_error", "Unable to update child practice settings.", 500);
  }
}
