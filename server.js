import express from "express";
import cron from "node-cron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { updateFollowers } from "./scripts/updateFollowers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(__dirname, "data", "universitas.json");
const UPDATE_TOKEN = process.env.UPDATE_TOKEN || "";

let sedangUpdate = false;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/ranking", async (req, res) => {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw)
      .sort((a, b) => Number(b.followers || 0) - Number(a.followers || 0));

    res.json({
      ok: true,
      total: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Gagal membaca data ranking.",
      error: error.message
    });
  }
});

app.post("/api/update-followers", async (req, res) => {
  const token = req.query.token || req.headers["x-update-token"] || "";

  if (UPDATE_TOKEN && token !== UPDATE_TOKEN) {
    return res.status(401).json({
      ok: false,
      message: "Token update tidak valid."
    });
  }

  if (sedangUpdate) {
    return res.status(409).json({
      ok: false,
      message: "Update sedang berjalan. Coba lagi beberapa menit."
    });
  }

  sedangUpdate = true;

  try {
    const data = await updateFollowers();
    res.json({
      ok: true,
      message: "Update follower selesai.",
      total: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Crawler gagal dijalankan.",
      error: error.message
    });
  } finally {
    sedangUpdate = false;
  }
});

const enableCron = process.env.ENABLE_CRON !== "false";
const cronSchedule = process.env.CRON_SCHEDULE || "0 */12 * * *";

if (enableCron) {
  cron.schedule(cronSchedule, async () => {
    if (sedangUpdate) return;

    sedangUpdate = true;
    console.log(`[CRON] Mulai update follower ${new Date().toISOString()}`);

    try {
      await updateFollowers();
      console.log("[CRON] Update follower selesai.");
    } catch (error) {
      console.error("[CRON] Update follower gagal:", error.message);
    } finally {
      sedangUpdate = false;
    }
  });
}

app.listen(PORT, () => {
  console.log(`Website aktif: http://localhost:${PORT}`);
  console.log(`API ranking: http://localhost:${PORT}/api/ranking`);
  console.log(`Cron: ${enableCron ? cronSchedule : "nonaktif"}`);
});
