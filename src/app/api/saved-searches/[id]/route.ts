import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { deleteSavedSearch, updateSavedSearch } from "@/lib/data/saved-searches";
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireSessionUser();
    const payload = (await request.json()) as {
      fromSuburb?: string;
      fromPostcode?: string;
      toSuburb?: string;
      toPostcode?: string;
      itemCategory?: string;
      dateFrom?: string;
      dateTo?: string;
      notifyEmail?: string;
      isActive?: boolean;
    };

    const savedSearch = await updateSavedSearch(params.id, user.id, payload);
    return NextResponse.json({ savedSearch });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
