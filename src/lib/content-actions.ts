"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import type { ContentStatus } from "@/lib/db/types";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string };

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function blank(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function revalidateContent() {
  for (const path of [routes.home, routes.about, routes.contact, routes.legal, routes.guides, routes.faqs, routes.admin.website, routes.ceo.website, routes.ceo.approvals]) {
    revalidatePath(path);
  }
}

function message(error: { message: string } | null, ok: string): ActionState {
  if (error) return { error: error.message };
  revalidateContent();
  return { ok };
}

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "administrator"]);
  const yearRaw = String(form.get("year_started") ?? "").trim();
  const year = yearRaw ? Number(yearRaw) : null;
  if (yearRaw && !Number.isInteger(year)) return { error: "Year started needs a whole year, or it can be left blank." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      legal_name: blank(form.get("legal_name")),
      licence: blank(form.get("licence")),
      city: blank(form.get("city")),
      year_started: year,
      whatsapp_e164: blank(form.get("whatsapp_e164")),
      updated_by: staff.id,
    })
    .eq("singleton", true);
  return message(error, "Settings saved.");
}

export async function savePage(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "administrator"]);
  const id = String(form.get("id") ?? "");
  const supabase = await createClient();
  const existing = await supabase.from("site_pages").select("status").eq("id", id).maybeSingle();
  if (existing.error || !existing.data) return { error: existing.error?.message ?? "Page not found." };
  const patch: { title?: string; body?: string; seo_title: string | null; seo_description: string | null; status?: ContentStatus; updated_by: string } = {
    seo_title: blank(form.get("seo_title")),
    seo_description: blank(form.get("seo_description")),
    updated_by: staff.id,
  };
  if (staff.role === "ceo" || existing.data.status === "draft") {
    patch.title = String(form.get("title") ?? "").trim();
    patch.body = String(form.get("body") ?? "");
  }
  if (staff.role === "ceo") patch.status = form.get("publish") === "on" ? "published" : "draft";
  const { error } = await supabase.from("site_pages").update(patch).eq("id", id);
  return message(error, "Page saved.");
}

export async function createGuide(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["administrator"]);
  const slug = String(form.get("slug") ?? "").trim().toLowerCase();
  const title = String(form.get("title") ?? "").trim();
  if (!SLUG.test(slug)) return { error: "The guide address uses lowercase words separated by hyphens." };
  if (!title) return { error: "A guide needs a title." };
  const minutesRaw = String(form.get("minutes") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.from("guides").insert({
    slug,
    title,
    excerpt: blank(form.get("excerpt")),
    body: String(form.get("body") ?? ""),
    topic: blank(form.get("topic")),
    confirmed_on: blank(form.get("confirmed_on")),
    minutes: minutesRaw ? Number(minutesRaw) : null,
    seo_title: blank(form.get("seo_title")),
    seo_description: blank(form.get("seo_description")),
    status: "draft",
    created_by: staff.id,
  });
  return message(error, "Guide draft saved.");
}

export async function saveGuide(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "administrator"]);
  const id = String(form.get("id") ?? "");
  const supabase = await createClient();
  const existing = await supabase.from("guides").select("status").eq("id", id).maybeSingle();
  if (existing.error || !existing.data) return { error: existing.error?.message ?? "Guide not found." };
  const minutesRaw = String(form.get("minutes") ?? "").trim();
  const patch: {
    seo_title: string | null;
    seo_description: string | null;
    minutes: number | null;
    slug?: string;
    title?: string;
    excerpt?: string | null;
    body?: string;
    topic?: string | null;
    confirmed_on?: string | null;
    status?: ContentStatus;
  } = {
    seo_title: blank(form.get("seo_title")),
    seo_description: blank(form.get("seo_description")),
    minutes: minutesRaw ? Number(minutesRaw) : null,
  };
  if (staff.role === "ceo" || existing.data.status === "draft") {
    const slug = String(form.get("slug") ?? "").trim().toLowerCase();
    if (!SLUG.test(slug)) return { error: "The guide address uses lowercase words separated by hyphens." };
    patch.slug = slug;
    patch.title = String(form.get("title") ?? "").trim();
    patch.excerpt = blank(form.get("excerpt"));
    patch.body = String(form.get("body") ?? "");
    patch.topic = blank(form.get("topic"));
    patch.confirmed_on = blank(form.get("confirmed_on"));
  }
  if (staff.role === "ceo") patch.status = form.get("publish") === "on" ? "published" : "draft";
  const { error } = await supabase.from("guides").update(patch).eq("id", id);
  return message(error, "Guide saved.");
}

export async function createFaq(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["administrator"]);
  const question = String(form.get("question") ?? "").trim();
  if (!question) return { error: "A question needs wording." };
  const supabase = await createClient();
  const { error } = await supabase.from("faqs").insert({
    question,
    answer: String(form.get("answer") ?? ""),
    sort_order: Number(form.get("sort_order") ?? 0) || 0,
    status: "draft",
    created_by: staff.id,
  });
  return message(error, "Question draft saved.");
}

export async function saveFaq(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "administrator"]);
  const id = String(form.get("id") ?? "");
  const supabase = await createClient();
  const existing = await supabase.from("faqs").select("status").eq("id", id).maybeSingle();
  if (existing.error || !existing.data) return { error: existing.error?.message ?? "Question not found." };
  const patch: { sort_order: number; question?: string; answer?: string; status?: ContentStatus } = {
    sort_order: Number(form.get("sort_order") ?? 0) || 0,
  };
  if (staff.role === "ceo" || existing.data.status === "draft") {
    patch.question = String(form.get("question") ?? "").trim();
    patch.answer = String(form.get("answer") ?? "");
  }
  if (staff.role === "ceo") patch.status = form.get("publish") === "on" ? "published" : "draft";
  const { error } = await supabase.from("faqs").update(patch).eq("id", id);
  return message(error, "Question saved.");
}

export async function addPlatform(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo", "administrator"]);
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) return { error: "A platform needs a name." };
  const supabase = await createClient();
  const { error } = await supabase.from("dealer_platforms").insert({ name, status: "draft", created_by: staff.id });
  return message(error, "Platform draft saved.");
}

export async function savePlatform(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { staff } = await requireStaff(["ceo"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("dealer_platforms")
    .update({
      name: String(form.get("name") ?? "").trim(),
      status: form.get("publish") === "on" ? "published" : "draft",
    })
    .eq("id", String(form.get("id") ?? ""));
  return message(error, "Platform saved.");
}

export async function proposeFeatured(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["administrator"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("propose_featured", { p_vehicle_id: String(form.get("vehicle_id") ?? "") });
  return message(error, "Sent to the CEO for approval.");
}

export async function proposeDelivery(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireStaff(["administrator"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("propose_delivery", {
    p_title: String(form.get("title") ?? ""),
    p_place: String(form.get("place") ?? ""),
  });
  return message(error, "Sent to the CEO for approval.");
}

export async function withdrawFeatured(id: string): Promise<ActionState> {
  await requireStaff(["ceo", "administrator"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_featured", { p_id: id });
  return message(error, "Withdrawn.");
}

export async function withdrawDelivery(id: string): Promise<ActionState> {
  await requireStaff(["ceo", "administrator"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_delivery", { p_id: id });
  return message(error, "Withdrawn.");
}
