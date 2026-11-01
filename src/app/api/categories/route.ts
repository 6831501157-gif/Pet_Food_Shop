import { NextResponse } from "next/server";
import { listCategories } from "@/server/categories";

export async function GET() {
  return NextResponse.json(await listCategories());
}
