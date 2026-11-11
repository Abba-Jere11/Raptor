import { redirect } from "next/navigation";
import { routes } from "@/prototype/routes";

export default function DashboardIndex() {
  redirect(routes.ceo.dashboard());
}
