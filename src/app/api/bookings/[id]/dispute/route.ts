import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { createDisputeForBooking } from "@/lib/data/feedback";
import { toErrorResponse, AppError } from "@/lib/errors";
import { isOwnedStoragePath } from "@/lib/storage";
import { disputeSchema } from "@/lib/validation/dispute";

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const payload = disputeSchema.parse(await request.json());

    if ((payload.photoUrls ?? []).some((url) => !isOwnedStoragePath(user.id, url))) {
      throw new AppError("Proof photo must be uploaded by the acting user.", 403, "proof_path_not_owned");
    }

    const dispute = await createDisputeForBooking(user.id, params.id, {
      category: payload.category,
      description: payload.description,
      photoUrls: payload.photoUrls ?? [],
    });

    return NextResponse.json({ dispute });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
