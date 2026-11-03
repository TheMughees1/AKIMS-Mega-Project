import { redirect,notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { portalData } from "@/lib/data";
import { navigation } from "@/lib/navigation";
import Portal from "@/components/portal";
export const dynamic="force-dynamic";
export default async function PortalPage({params}:{params:Promise<{section?:string[]}>}){
  const user=await currentUser();if(!user)redirect("/login");
  const {section=[]}=await params;
  if(section.length>1||!navigation[user.role].some(n=>n.path===(section[0]||"")))notFound();
  return <Portal data={await portalData(user)} section={section[0]||""}/>;
}
