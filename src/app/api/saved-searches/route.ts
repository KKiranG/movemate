// Compatibility alias — prefer /api/alerts for new work. This path retained for any legacy clients.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import {
  createSavedSearch,
  listUserSavedSearchesWithOptions,
} from "@/lib/data/saved-searches";
import { toErrorResponse } from "@/lib/errors";

const savedSearchCreateSchema = z.object({
  fromSuburb: z.string().trim().min(2).max(120),
  fromPostcode: z.string().trim().min(3).max(8).optional(),
  toSuburb: z.string().trim().min(2).max(120),
  toPostcode: z.string().trim().min(3).max(8).optional(),
  itemCategory: z.string().trim().min(1).max(40).optional(),
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional(),
  notifyEmail: z.string().email().optional(),
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const savedSearches = await listUserSavedSearchesWithOptions(user.id, {
      includeInactive: true,
    });

    return NextResponse.json({ savedSearches });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const body = savedSearchCreateSchema.parse(await request.json());
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
