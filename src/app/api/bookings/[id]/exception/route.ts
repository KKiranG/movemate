import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import {
  getBookingActorRoleForUser,
  logBookingExceptionForActor,
} from "@/lib/data/bookings";
import { toErrorResponse, AppError } from "@/lib/errors";
import { isOwnedStoragePath } from "@/lib/storage";
import type { BookingExceptionCode } from "@/types/booking";

const bookingExceptionCodeValues = [
  "damage",
  "no_show",
  "late",
  "wrong_item",
  "overcharge",
  "other",
] satisfies Exclude<BookingExceptionCode, "none">[];

const bookingExceptionSchema = z.object({
  code: z.enum(bookingExceptionCodeValues),
  note: z.string().trim().min(1),
  photoUrls: z.array(z.string().min(1)).default([]),
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const payload = bookingExceptionSchema.parse(await request.json());
    const user = await requireSessionUser();

    if (payload.photoUrls.some((url) => !isOwnedStoragePath(user.id, url))) {
      throw new AppError("Proof photo must be uploaded by the acting user.", 403, "proof_path_not_owned");
    }

    const actorRole = await getBookingActorRoleForUser(user.id, params.id);
    const exception = await logBookingExceptionForActor({
      userId: user.id,
      bookingId: params.id,
      actorRole,
      code: payload.code,
      note: payload.note,
      photoUrls: payload.photoUrls,
    });

    return NextResponse.json({ exception });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
