import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./db";
export function failure(error:unknown) {
  if(error instanceof AppError) return NextResponse.json({error:error.message},{status:error.status});
  if(error instanceof ZodError) return NextResponse.json({error:error.issues.map(i=>i.message).join(" ")},{status:400});
  const code=(error as {code?:string})?.code;
  if(code==="23505") return NextResponse.json({error:"This record or submission already exists. Refresh to see its current status."},{status:409});
  console.error("AKIMS request failed:",error instanceof Error?error.message:"Unknown error");
  return NextResponse.json({error:"We could not complete this action. Please try again."},{status:500});
}
