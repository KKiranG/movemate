import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { recordAdminActionEvent, updateOperatorTask } from "@/lib/data/operator-tasks";

const operatorTaskPatchSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "cancelled"]),
  blocker: z.string().trim().min(1).max(280).optional(),
  nextAction: z.string().trim().min(1).max(280).optional(),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireAdminUser();
    const payload = operatorTaskPatchSchema.parse(await request.json());
    const task = await updateOperatorTask({
      taskId: params.id,
      status: payload.status,
      blocker: payload.blocker,
      nextAction: payload.nextAction,
    });

    await recordAdminActionEvent({
      adminUserId: user.id,
      entityType: "operator_task",
      entityId: task.id,
      actionType: `operator_task_${payload.status}`,
      reason: payload.blocker ?? payload.nextAction ?? null,
      metadata: {
        status: payload.status,
        taskType: task.taskType,
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json(
      { error: response.message, code: response.code },
      { status: response.statusCode },
    );
  }
}
