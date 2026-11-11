import { execFileSync } from "node:child_process";

/** Runs SQL as the local database owner. Used to place a sold record, which the app still refuses until Milestone 8. */
export function localSql(sql: string) {
  return execFileSync(
    "docker",
    ["exec", "-i", "supabase_db_Raptor", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-q"],
    { input: sql, encoding: "utf8" },
  );
}

export function markSold(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("refusing to mark an unexpected id sold");
  localSql(`BEGIN;
SELECT set_config('raptors.allow_consequential_edit', 'on', true);
UPDATE vehicles SET status = 'sold' WHERE id = '${id}';
COMMIT;`);
}
