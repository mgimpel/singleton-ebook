// Mirrors the committed foliate-js sources into src/vendor/ so Vite bundles them
// with the app. Runs from predev/prebuild.
//
// Idempotent copy-if-newer: a file is (re)copied only when it is missing from
// the destination or its source mtime is newer, so repeated runs are cheap.
//
// ponytail: this walks and stats the whole vendor tree every run (no partial
// copy, no delete of files removed upstream). Fine at foliate-js's size; if the
// vendor tree grows large, switch to a checksum/manifest diff that records
// hashes and only touches changed entries.
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(projectRoot, "submodules", "foliate-js");
const destRoot = join(projectRoot, "src", "vendor", "foliate-js");

async function mtime(path) {
  try {
    return (await stat(path)).mtimeMs;
  } catch {
    return undefined; // missing
  }
}

async function mirror(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  let copied = 0;

  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dest = join(destDir, entry.name);

    if (entry.isDirectory()) {
      copied += await mirror(src, dest);
    } else {
      const destMtime = await mtime(dest);

      if (destMtime === undefined || (await mtime(src)) > destMtime) {
        await cp(src, dest);
        copied += 1;
      }
    }
  }

  return copied;
}

const srcExists = (await mtime(srcRoot)) !== undefined;

if (!srcExists) {
  console.error(
    `setup-vendors: missing source tree at ${srcRoot}. ` +
      "Vendor foliate-js there (see submodules/foliate-js/VERSION) before building.",
  );
  process.exit(1);
}

// Drop a stale mirror whose source is gone so we never serve deleted files.
if ((await mtime(destRoot)) !== undefined) {
  const current = new Set(await readdir(srcRoot));

  for (const name of await readdir(destRoot)) {
    if (!current.has(name)) await rm(join(destRoot, name), { recursive: true, force: true });
  }
}

const copied = await mirror(srcRoot, destRoot);

console.log(
  copied === 0
    ? "setup-vendors: src/vendor/foliate-js already up to date."
    : `setup-vendors: copied ${copied} file(s) into src/vendor/foliate-js.`,
);
