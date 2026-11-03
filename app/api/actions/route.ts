import { NextResponse } from "next/server";
import { checkOrigin,requireUser } from "@/lib/auth";
import { executeAction } from "@/lib/workflow";
import { failure } from "@/lib/http";
export async function POST(req:Request){
  try{checkOrigin(req);const user=await requireUser();return NextResponse.json(await executeAction(user,await req.json()));}
  catch(e){return failure(e);}
}
