import { NextResponse } from "next/server";
import { createCaseShare, type CaseShareRecord } from "@/lib/db/repo";

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<CaseShareRecord, "code">;
  if (!body?.templateId || !body?.prompt) {
    return NextResponse.json({ error: "templateId 与 prompt 必填" }, { status: 400 });
  }
  const code = createCaseShare({
    templateId: body.templateId,
    label: body.label ?? "",
    prompt: body.prompt,
    values: body.values ?? {},
    output: body.output,
    image: body.image,
    source: body.source,
  });
  return NextResponse.json({ code, url: `/s/${code}` });
}
