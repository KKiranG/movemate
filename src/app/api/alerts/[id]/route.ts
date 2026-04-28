import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth";
import { deleteRouteAlert, updateRouteAlert } from "@/lib/data/alerts";
import { toErrorResponse } from "@/lib/errors";

const alertPatchSchema = z.object({
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

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    await deleteRouteAlert(params.id, user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireSessionUser();
    const payload = alertPatchSchema.parse(await request.json());

    const alert = await updateRouteAlert(params.id, user.id, payload);
    return NextResponse.json({ alert });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
