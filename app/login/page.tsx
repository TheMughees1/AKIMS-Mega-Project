import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { demoEnabled } from "@/lib/db";
import Login from "@/components/login";
export const dynamic="force-dynamic";
export default async function LoginPage(){
  if(await currentUser())redirect("/portal");
  return <Login demo={demoEnabled()}/>;
}
