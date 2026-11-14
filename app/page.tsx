import { redirect } from "next/navigation";
import { requireUser } from "@/backend/auth";

export default async function Home() {
  const user = await requireUser();
  redirect(user.role === "hr" ? "/admin" : "/kb");
}
