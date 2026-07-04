# CI/CD Auto-Monitor — Kanban İşi

**Durum:** ✅ KAPALI (Success)

**Tarih:** 2026-07-04

**Süleyman'ın isteği:**
> "Bana bir iş verdiğinde tamamlayıp git'e push ediyorsun, CI çalışıyor, eğer hata verirse ben onu manuel sana veriyorum, düzeltip tekrar push ediyorsun. Ben o manuel kopyala yapıştır yapmayayım, hata alırsa CI sen sonucunu takip et ve hatayı düzelt istedim."

## Yaklaşım (best practice)

**Doğru yol:**
1. `cd /workspace/finansc && git status` — branch temiz mi?
2. `git checkout main && git pull origin main` — main güncel
3. `git checkout -b fix/something` — branch aç
4. Kodu değiştir (patch / write_file)
5. `git add -A && git commit -m "fix: ..." && git push origin fix/something`
6. **GitHub Actions fail olursa** → `curl + GitHub API` ile log indir → parse et → kök neden bul → fix et → push et
7. **Success olunca** → PR merge (opsiyonel)

**Araçlar (bu container'da):**
- `gh` CLI **yok** → `curl + GitHub REST API` kullan
- Token: `git config --get remote.origin.url` içindeki `x-access-token:***@github.com/...`
- HTTP POST: `application/vnd.github+json`
- **User-Agent** header **zorunlu** (yoksa 403)

**CI izleme polling döngüsü:**
```python
for i in range(30):  # 10 dakika max
    status = curl /actions/runs/{id} → status, conclusion
    if status == 'completed':
        break
    sleep(20)
```

**Log indirme:**
- `/actions/runs/{id}/logs` → zip
- Zip içindeki her .txt: step adına göre (örn. `7_Build and push client image.txt`)
- **Her hatayı tek commit'te düzelt** — birer birer değil

## Bu test'te ne yapıldı

**1. Kanban işi tanımlandı:**
- finansc repo'sunda CI/CD fail → log al → fix → push → success

**2. Best practice araştırması:**
- `github-pr-workflow` skill: branch, commit, push, monitor, merge akışı
- `ci-troubleshooting.md`: Test/lint/type/build hata pattern'leri

**3. Mevcut karmaşık sistem temizlendi (2 günlük yanlış yoldan dönüş):**
- ❌ `webhook.tasci.cloud` (DNS + Traefik + socat) — **SİLİNDİ**
- ❌ `webhook-auto-fix.py` (19KB LLM'siz PITFALL script) — **SİLİNDİ**
- ❌ `webhook-watcher.py` (Telegram relay) — **SİLİNDİ**
- ❌ `/tmp/auto-fix-secrets.json` — **SİLİNDİ**
- ❌ Sunucuda `webhook-relay` container — **SİLİNDİ**
- ❌ GitHub webhook ID 649095184 — **SİLİNDİ**
- ❌ `webhook_subscriptions.json` (Hermes) — **SİLİNDİ**
- ❌ Hermes config.yaml'da webhook bloğu — **SİLİNDİ**
- ❌ Hermes .env'de WEBHOOK_* — **SİLİNDİ**

**4. Test akışı (3 push, 1 success):**

| Push | Run | SHA | Conclusion | Kök neden |
|---|---|---|---|---|
| 1 | #184 | 9bcd6b9 | ❌ failure | `utils.ts:5` olmayan `./does-not-exist` import |
| 2 | #185 | 7384fa2 | ❌ failure | `Header.tsx:14` MobileMenuDrawer not found (unstaged dosya) |
| 3 | #186 | aedec2d | ✅ **SUCCESS** | MobileMenuDrawer.tsx commit edildi, build geçti |

**5. Gerçek öğrenilenler:**
- **CI log'larında her hatayı dikkatli oku** — Next.js import trace zincirini gösterir
- **Bir commit'te birden fazla fix** olabilir — utils.ts revert + MobileMenuDrawer ekleme
- **`User-Agent` header GitHub API'de zorunlu** — 403 alırsan sebep bu
- **Turbopack build error trace'leri faydalı** — `./Header.tsx:14:1` satırı tam yer

## Dosyalar

Bu test'te **hiç yeni dosya yazılmadı**, sadece mevcut `client/src/lib/utils.ts` ve `client/src/components/layout/Header.tsx` değiştirildi, `MobileMenuDrawer.tsx` (zaten vardı, unstaged) commit edildi.

## Yeni projeler için

Aynı workflow'u herhangi bir repo'da tekrarlamak için:
1. `cd /workspace/<repo>` — repo dizinine gir
2. GitHub API token'ı `.git/config`'den al (yukarıdaki pattern)
3. `git status` ile temiz olduğunu doğrula
4. `git checkout -b fix/<name>` branch aç
5. Kodu değiştir, `git commit -m "..."`, `git push`
6. `curl + jobs API` ile failed step'i bul
7. `curl /logs` → zip → fail step'in dosyasını oku
8. Kök neden tespit et, fix et, push et
9. Polling loop ile success olana kadar bekle

**Telegram/SSH/webhook/sunucu kurulumu GEREKMEZ.** Sadece `terminal` tool'u + `curl` yeterli.
