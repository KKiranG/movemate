import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import {
  createSavedSearch,
  listUserSavedSearches,
} from "@/lib/data/saved-searches";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const savedSearches = await listUserSavedSearches(user.id);

    return NextResponse.json({ savedSearches });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as {
      fromSuburb: string;
      fromPostcode?: string;
      toSuburb: string;
      toPostcode?: string;
      itemCategory?: string;
      dateFrom?: string;
      dateTo?: string;
      notifyEmail?: string;
    };
    const savedSearch = await createSavedSearch(user.id, {
      ...body,
      notifyEmail: body.notifyEmail ?? user.email ?? "",
    });

    return NextResponse.json({ savedSearch });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
