import { getCurrentUser } from "@/lib/session";
import { getPracticeSessionDetailForParent } from "@/lib/training/persistence";
import { errorResponse } from "../../children/_utils";

export async function GET(
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
    const session = await getPracticeSessionDetailForParent({
      parentUserId: user.id,
      sessionId,
    });

    if (!session) {
      return errorResponse("not_found", "Practice session was not found.", 404);
    }

    return Response.json({ session });
  } catch (error) {
    console.error("Failed to read practice session", error);
    return errorResponse("internal_error", "Unable to read practice session.", 500);
  }
}
