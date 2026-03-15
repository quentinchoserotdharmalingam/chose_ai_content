import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { FormatSlug } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const { resourceId } = await params;
  const body = await request.json();
  const enabledFormats: FormatSlug[] = body.enabledFormats || [];

  await prisma.resource.update({
    where: { id: resourceId },
    data: {
      enabledFormats: JSON.stringify(enabledFormats),
      status: "generated",
    },
  });

  return NextResponse.json({ success: true });
}
