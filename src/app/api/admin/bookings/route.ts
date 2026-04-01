import { NextResponse, type NextRequest } from "next/server";

import { requireAdminUser } from "@/lib/auth";
import { listAdminBookingsPageData } from "@/lib/data/bookings";
import { toErrorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser();
    const searchParams = new URL(request.url).searchParams;
    const page = Number(searchParams.get("page") ?? "1");
    const query = searchParams.get("q") ?? undefined;
    const data = await listAdminBookingsPageData({ page, query });

    return NextResponse.json(data);
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
