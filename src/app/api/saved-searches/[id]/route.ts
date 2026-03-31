import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { deleteSavedSearch } from "@/lib/data/saved-searches";
import { toErrorResponse } from "@/lib/errors";

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
