<<<<<<< HEAD
# Ranking Instagram Universitas Kota Palopo

Project ini berisi website ranking Instagram universitas di Kota Palopo + crawler sederhana untuk mengambil jumlah pengikut dari halaman profil Instagram.

Crawler mengambil teks dari halaman yang sudah dirender, mirip data yang terlihat melalui Inspect Element, lalu mengekstrak angka `pengikut` / `followers`.

## Cara menjalankan

### 1. Extract ZIP

Extract folder project ini.

### 2. Install dependency

```bash
npm install
npm run install-browser
```

### 3. Jalankan website

```bash
npm run dev
```

Buka browser:

```text
http://localhost:3000
```

## Cara update follower

### Cara 1: lewat terminal

```bash
npm run update
```

### Cara 2: lewat tombol website

1. Jalankan server:

```bash
npm run dev
```

2. Buka:

```text
http://localhost:3000
```

3. Klik tombol **Update Crawler**.
4. Masukkan token:

```text
kampuspalopo123
```

Token bisa diubah di file `.env`.

### Cara 3: lewat endpoint

```bash
curl -X POST "http://localhost:3000/api/update-followers?token=kampuspalopo123"
```

## File penting

```text
data/universitas.json
```

Berisi daftar akun Instagram dan hasil follower.

```text
src/instagramCrawler.js
```

Kode crawler Playwright.

```text
scripts/updateFollowers.js
```

Script untuk update semua akun.

```text
server.js
```

Server Express + API + scheduler cron.

```text
public/
```

Frontend website ranking.

## Mengubah daftar akun

Edit file:

```text
data/universitas.json
```

Contoh format:

```json
{
  "username": "ukjp.official",
  "nama": "UNIVERSITAS KURNIA JAYA PERSADA",
  "followers": 8716,
  "posts": 365,
  "following": 300,
  "singkatan": "UKJP",
  "url": "https://www.instagram.com/ukjp.official/",
  "last_checked": null,
  "status": "data awal",
  "error": null
}
```

## Update otomatis

Default project menjalankan cron setiap 12 jam:

```env
ENABLE_CRON=true
CRON_SCHEDULE=0 */12 * * *
```

Untuk mematikan cron:

```env
ENABLE_CRON=false
```

## Catatan

- Jangan menjalankan crawler setiap halaman dibuka.
- Gunakan update berkala, misalnya 12 jam sekali atau 1 kali sehari.
- Project ini tidak memakai proxy, stealth plugin, cookie login, atau bypass.
- Kalau Instagram meminta login/challenge atau mengubah struktur halaman, crawler bisa gagal.
- Untuk produksi yang paling stabil, gunakan API resmi Meta/Instagram atau input manual admin.
=======
# crawling-ranking-instagram-universitas-palopo
Website ranking Instagram universitas di Kota Palopo dengan crawler Playwright untuk update jumlah followers secara berkala.
>>>>>>> 11e234728190f8e653d173f913a3ce7f531c8f23
