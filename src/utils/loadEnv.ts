import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

let loaded = false;

/** Load the nearest `.env.local`, including the repository root above this package. */
export function loadRootEnv(): void {
  if (loaded) return;
  loaded = true;

  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, ".env.local");
    if (existsSync(candidate)) {
      config({ path: candidate, quiet: true });
      return;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
}

loadRootEnv();
