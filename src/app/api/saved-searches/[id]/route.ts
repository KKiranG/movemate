// Compatibility alias — prefer /api/alerts/[id] for new work.
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { deleteSavedSearch, updateSavedSearch } from "@/lib/data/saved-searches";
import { toErrorResponse } from "@/lib/errors";

const savedSearchPatchSchema = z.object({
  fromSuburb: z.string().trim().min(2).max(120).optional(),
  fromPostcode: z.string().trim().min(3).max(8).optional(),
  toSuburb: z.string().trim().min(2).max(120).optional(),
  toPostcode: z.string().trim().min(3).max(8).optional(),
  itemCategory: z.string().trim().min(1).max(40).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional(),
  notifyEmail: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    await deleteSavedSearch(params.id, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const payload = savedSearchPatchSchema.parse(await request.json());

    const savedSearch = await updateSavedSearch(params.id, user.id, payload);
    return NextResponse.json({ savedSearch });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
