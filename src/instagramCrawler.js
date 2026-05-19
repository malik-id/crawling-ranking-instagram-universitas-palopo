import { chromium } from "playwright";

function bersihkanTeks(text = "") {
  return String(text)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAngkaRingkas(angkaText, satuanText = "") {
  const angkaRaw = bersihkanTeks(angkaText);
  const satuan = bersihkanTeks(satuanText).toLowerCase();

  if (!angkaRaw) return null;

  const multiplier = {
    rb: 1000,
    ribu: 1000,
    k: 1000,
    jt: 1000000,
    juta: 1000000,
    m: 1000000,
    mn: 1000000,
    million: 1000000,
    b: 1000000000,
    bn: 1000000000,
    miliar: 1000000000,
    billion: 1000000000
  };

  if (satuan && multiplier[satuan]) {
    let decimal = angkaRaw.replace(/\s/g, "");

    if (decimal.includes(",") && decimal.includes(".")) {
      const lastComma = decimal.lastIndexOf(",");
      const lastDot = decimal.lastIndexOf(".");

      if (lastComma > lastDot) {
        decimal = decimal.replace(/\./g, "").replace(",", ".");
      } else {
        decimal = decimal.replace(/,/g, "");
      }
    } else if (decimal.includes(",")) {
      decimal = decimal.replace(",", ".");
    }

    const nilai = Number.parseFloat(decimal);
    return Number.isFinite(nilai) ? Math.round(nilai * multiplier[satuan]) : null;
  }

  // Tanpa satuan: 8.716 atau 8,716 dianggap 8716.
  const digits = angkaRaw.replace(/[^\d]/g, "");
  if (!digits) return null;

  const nilai = Number.parseInt(digits, 10);
  return Number.isFinite(nilai) ? nilai : null;
}

function parseMetric(text, jenis) {
  const sumber = bersihkanTeks(text);

  const kata = {
    followers: "(pengikut|followers?)",
    following: "(diikuti|mengikuti|following)",
    posts: "(kiriman|postingan|posts?)"
  };

  const metricWord = kata[jenis];
  if (!metricWord) return null;

  const satuan = "(rb|ribu|k|jt|juta|m|mn|million|b|bn|miliar|billion)?";

  const pola = [
    // contoh: 8.716 pengikut, 20,5 rb pengikut, 8.7K followers
    new RegExp(`([\\d][\\d.,\\s]*)\\s*${satuan}\\s*${metricWord}`, "i"),

    // contoh: followers 8,716
    new RegExp(`${metricWord}\\s*([\\d][\\d.,\\s]*)\\s*${satuan}`, "i")
  ];

  for (const regex of pola) {
    const match = sumber.match(regex);
    if (!match) continue;

    if (/^\d/.test(match[1])) {
      return parseAngkaRingkas(match[1], match[2] || "");
    }

    return parseAngkaRingkas(match[2], match[3] || "");
  }

  return null;
}

async function ambilTeksHalaman(page) {
  const hasil = [];

  const selectors = [
    'meta[property="og:description"]',
    'meta[name="description"]',
    "title"
  ];

  for (const selector of selectors) {
    try {
      const value = await page.locator(selector).first().evaluate((el) => {
        return el.getAttribute("content") || el.textContent || "";
      });
      if (value) hasil.push(value);
    } catch {
      // lanjut ke selector berikutnya
    }
  }

  try {
    const bodyText = await page.locator("body").innerText({ timeout: 10000 });
    if (bodyText) hasil.push(bodyText);
  } catch {
    // body tidak terbaca
  }

  return bersihkanTeks(hasil.join(" | "));
}

export async function crawlInstagramProfile(username, options = {}) {
  const cleanUsername = String(username).replace(/^@/, "").trim();

  if (!cleanUsername) {
    throw new Error("Username kosong.");
  }

  const browser = await chromium.launch({
    headless: options.headless ?? process.env.HEADLESS !== "false"
  });

  const page = await browser.newPage({
    locale: "id-ID",
    viewport: {
      width: 1366,
      height: 900
    }
  });

  const url = `https://www.instagram.com/${cleanUsername}/`;

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: options.timeout ?? 60000
    });

    // Tunggu render halaman Instagram.
    await page.waitForTimeout(options.waitAfterLoad ?? 5000);

    const text = await ambilTeksHalaman(page);

    const followers = parseMetric(text, "followers");
    const posts = parseMetric(text, "posts");
    const following = parseMetric(text, "following");

    if (followers === null) {
      throw new Error(
        "Jumlah pengikut tidak ditemukan. Bisa jadi Instagram meminta login, terkena limit, atau struktur halaman berubah."
      );
    }

    return {
      username: cleanUsername,
      url,
      followers,
      posts,
      following,
      checked_at: new Date().toISOString(),
      sample_text: text.slice(0, 500)
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

export const testingParser = {
  bersihkanTeks,
  parseAngkaRingkas,
  parseMetric
};
