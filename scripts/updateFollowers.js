import { readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crawlInstagramProfile } from "../src/instagramCrawler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(PROJECT_ROOT, "data", "universitas.json");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateFollowers(options = {}) {
  const delayMs = options.delayMs ?? 8000;

  const rawData = await readFile(DATA_FILE, "utf-8");
  const accounts = JSON.parse(rawData);

  const backupFile = path.join(
    PROJECT_ROOT,
    "data",
    `universitas.backup.${Date.now()}.json`
  );

  await copyFile(DATA_FILE, backupFile).catch(() => {});

  for (let i = 0; i < accounts.length; i += 1) {
    const account = accounts[i];

    console.log(`[${i + 1}/${accounts.length}] Mengecek @${account.username}...`);

    try {
      const result = await crawlInstagramProfile(account.username, {
        headless: options.headless,
        waitAfterLoad: options.waitAfterLoad,
        timeout: options.timeout
      });

      accounts[i] = {
        ...account,
        followers: result.followers,
        posts: result.posts ?? account.posts ?? null,
        following: result.following ?? account.following ?? null,
        url: result.url,
        last_checked: result.checked_at,
        status: "ok",
        error: null
      };

      console.log(
        `OK: @${account.username} = ${result.followers.toLocaleString("id-ID")} pengikut`
      );
    } catch (error) {
      accounts[i] = {
        ...account,
        last_checked: new Date().toISOString(),
        status: "gagal",
        error: error.message
      };

      console.log(`Gagal: @${account.username} - ${error.message}`);
    }

    await writeFile(DATA_FILE, JSON.stringify(accounts, null, 2), "utf-8");

    if (i < accounts.length - 1) {
      await delay(delayMs);
    }
  }

  console.log("Selesai update data followers.");
  return accounts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateFollowers().catch((error) => {
    console.error("Update gagal:", error);
    process.exitCode = 1;
  });
}
