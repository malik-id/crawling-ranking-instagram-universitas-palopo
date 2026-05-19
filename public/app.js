const state = {
  data: [],
  keyword: "",
  sortBy: "followers"
};

const rankingList = document.querySelector("#rankingList");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const sortName = document.querySelector("#sortName");
const sortFollower = document.querySelector("#sortFollower");
const updateData = document.querySelector("#updateData");
const statusBox = document.querySelector("#statusBox");

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function formatFollowers(value) {
  const number = Number(value || 0);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1).replace(".", ",")} jt`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(".", ",")} rb`;
  }

  return number.toLocaleString("id-ID");
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function showStatus(message, type = "") {
  statusBox.className = `status show ${type}`.trim();
  statusBox.textContent = message;
}

async function loadRanking() {
  try {
    showStatus("Memuat data ranking...");

    const response = await fetch("/api/ranking");
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || "Gagal mengambil data.");
    }

    state.data = payload.data || [];
    showStatus("Data ranking berhasil dimuat.", "success");
    render();
  } catch (error) {
    showStatus(`Gagal memuat data: ${error.message}`, "error");
  }
}

async function runCrawlerUpdate() {
  const token = prompt("Masukkan UPDATE_TOKEN dari file .env. Default: kampuspalopo123");

  updateData.disabled = true;
  showStatus("Crawler sedang berjalan. Tunggu sampai selesai...", "");

  try {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    const response = await fetch(`/api/update-followers${query}`, {
      method: "POST"
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || "Crawler gagal.");
    }

    state.data = payload.data || state.data;
    showStatus("Data follower berhasil diperbarui.", "success");
    render();
  } catch (error) {
    showStatus(`Update gagal: ${error.message}`, "error");
  } finally {
    updateData.disabled = false;
  }
}

function getFilteredData() {
  const keyword = state.keyword.toLowerCase().trim();

  const filtered = state.data.filter((item) => {
    return item.username.toLowerCase().includes(keyword) ||
      item.nama.toLowerCase().includes(keyword);
  });

  filtered.sort((a, b) => {
    if (state.sortBy === "name") {
      return a.nama.localeCompare(b.nama, "id-ID");
    }

    return Number(b.followers || 0) - Number(a.followers || 0);
  });

  return filtered;
}

function render() {
  const data = getFilteredData();

  const maxFollowers = Math.max(
    ...state.data.map((item) => Number(item.followers || 0)),
    1
  );

  rankingList.innerHTML = data.map((item, index) => {
    const rank = index + 1;
    const followers = Number(item.followers || 0);
    const width = `${Math.max((followers / maxFollowers) * 100, 8).toFixed(2)}%`;
    const rowClass = rank === 1 && state.sortBy === "followers" ? "row top" : "row";
    const rankClass = rank === 1 && state.sortBy === "followers" ? "rank first" : "rank";
    const statusClass = item.status === "ok" ? "ok" : item.status === "gagal" ? "gagal" : "";

    const posts = item.posts ? `${formatNumber(item.posts)} kiriman` : "kiriman -";
    const following = item.following ? `${formatNumber(item.following)} diikuti` : "diikuti -";

    return `
      <article class="${rowClass}">
        <div class="${rankClass}">${rank}</div>

        <div class="account">
          <div class="avatar-wrap">
            <div class="avatar">${item.singkatan || item.username.slice(0, 3).toUpperCase()}</div>
            <div class="ig-badge">◎</div>
          </div>

          <div class="meta">
            <a class="username" href="${item.url}" target="_blank" rel="noopener">@${item.username}</a>
            <div class="name">${item.nama}</div>

            <div class="meta-small">
              <span class="pill">${posts}</span>
              <span class="pill">${following}</span>
              <span class="pill ${statusClass}">${item.status || "status -"}</span>
              <span class="pill">cek: ${formatDate(item.last_checked)}</span>
            </div>
          </div>
        </div>

        <div class="followers">${formatFollowers(followers)}</div>

        <div class="bar" aria-label="Grafik pengikut ${item.username}">
          <span style="--w:${width}"></span>
        </div>
      </article>
    `;
  }).join("");

  emptyState.style.display = data.length ? "none" : "block";

  document.querySelector("#totalAkun").textContent = state.data.length;
  const topAccount = state.data
  .slice()
  .sort((a, b) => Number(b.followers || 0) - Number(a.followers || 0))[0];

document.querySelector("#topFollower").textContent = topAccount
  ? `@${topAccount.username}`
  : "-";

  const lastChecked = state.data
    .map((item) => item.last_checked)
    .filter(Boolean)
    .sort()
    .at(-1);

  document.querySelector("#lastUpdate").textContent = formatDate(lastChecked);
}

searchInput.addEventListener("input", (event) => {
  state.keyword = event.target.value;
  render();
});

sortName.addEventListener("click", () => {
  state.sortBy = "name";
  render();
});

sortFollower.addEventListener("click", () => {
  state.sortBy = "followers";
  render();
});

updateData.addEventListener("click", runCrawlerUpdate);

loadRanking();
