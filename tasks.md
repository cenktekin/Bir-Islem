# Bir İşlem – Yol Haritası ve Görev Listesi

Bu plan, mevcut "Bir İşlem" oyununu modernleştirmek, mantıksal yapısını düzenlemek, modern bir arayüz tasarlamak ve yeni özellikler (zorluk seviyeleri, genel kültür/trivia modu) eklemek için adım adım bir yol haritası sunar.

## 0) Mevcut Durum Özeti (Kod Tespiti)
- __HTML__: `birIslem.html` modern, mobil uyumlu iskelet içeriyor. Operasyon butonları (`addition`, `subtraction`, `multiplication`, `division`) mevcut.
- __JS__: `js/bir_islem.js` state ve solver içeriyor; eksik fonksiyonlar tanımlandı: `calculateScore`, `score` alanı, `showCurrentStep()`, `disableOperand()`.
- __UI Etkileşimleri__: Operand/operatör tıklamaları `initButtons()` ve `operandClicked()` ile bağlandı.
- __Diğer Notlar__: Tipografik hata düzeltildi (`3em`). Stil değişkenleri ve paneller eklendi.

Bu tespitler, öncelikle mimari ve UI düzenlemelerinin gerektiğini gösteriyor.

---

## Güncellemeler (2025-08-30)
- __İpucu özelliği__: `İpucu` butonu eklendi. Tek hamlelik öneri üretir ve her kullanımda puandan ceza düşer (varsayılan 15).
- __Puan Dökümü__: İpucu cezası dahil olmak üzere ayrıntılı puan kalemleri gösteriliyor.
- __README__: Proje köküne `README.md` eklendi; kurulum, oynanış, kontroller ve puanlama açıklandı.
 - __Mikro animasyonlar__: Geçersiz işlemde 0.25s ve ±4px hareketli `.shake`; adımlar panelinde `.step-card` görünümü ve 0.25s fade/slide-in.
 - __Erişilebilirlik__: `prefers-reduced-motion` ile animasyonlar kapatılabilir; klavye akışı güçlendirildi.
 - __Seçim sıfırlama yardımcıları__: `resetOperatorButtons()` ve `clearOperandSelections(preserveDisabled)` ile kalıntı seçim durumları temizleniyor (yeni oyun, adım sonrası/undo, süre bitiminde çağrılır).
 - __Dürüst oyun kuralları__: 0 adımda skor yok; tur içinde "Çözüm Göster" kullanılırsa puan 0, Onayla/Tekrar Dene devre dışı; 0 puan turlar kaydedilmez.

---

## Görsel Geliştirme Sprinti – Odak Noktaları

1) __Seçim ve İşlem Akışı için Dinamik Geri Bildirim__

- Seçilen sayı kutusu ve operatör görsel olarak vurgulanmalı:

```css
.selected {
  background-color: #2aa198;
  color: white;
  box-shadow: 0 0 5px #2aa198;
}
```

- Geçersiz işlem (ör. bölme sonucu tam sayı değilse) için shake animasyonu:

```css
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}
```

2) __Adımlar Paneli – Zaman Çizgisi Gibi__

- Her işlem adımı küçük bir kart olarak listelensin:

```html
<div class="step-card">
  <span>8 × 10 = 80</span>
</div>
```

- Kartlar arası geçişli animasyon ve vurgu:

```css
.step-card {
  transition: all 0.3s ease;
  border-left: 4px solid #268bd2;
  padding: 0.5em;
  margin-bottom: 0.5em;
}
```

3) __Skorlar Paneli – Mini Dashboard__

- Skor dökümü tablo gibi sunulsun:

```html
<table>
  <tr><td>Hedefe Yakınlık</td><td>85</td></tr>
  <tr><td>İpucu Cezası</td><td>-15</td></tr>
  <tr><td>Toplam</td><td><strong>70</strong></td></tr>
</table>
```

- Skor geçmişi için collapsible liste:

```html
<details>
  <summary>Geçmiş Skorlar</summary>
  <ul><li>Oyuncu A – 92 puan</li></ul>
</details>
```

4) __Mobil ve Tema Desteği__

- `prefers-color-scheme` ile otomatik tema geçişi:

```css
@media (prefers-color-scheme: dark) {
  body { background-color: #002b36; color: #eee; }
}
```

- Mobilde sayı kutuları alt alta, operatörler yatay scroll:

```css
.operators {
  display: flex;
  overflow-x: auto;
}
```

5) __İpucu ve Çözüm Göster – Sinematik Modal__

- İpucu geldiğinde ekran ortasında fade-in kart:

```html
<div class="hint-modal">
  <p>En iyi hamle: 100 − 6 = 94</p>
</div>
```

- Modal efekti:

```css
.hint-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fdf6e3;
  padding: 1em;
  border-radius: 8px;
  box-shadow: 0 0 10px #aaa;
  animation: fadeIn 0.5s ease;
}
```

---

### Bonus: Timeline Projesiyle Bağlantı

Final sahnede etik seçim ekranı için bu oyunun “puan dökümü” ekranı metafor olabilir. Örnek mesaj:

“Hedefe ulaştınız ama 3 ipucu kullandınız. Gerçek hayatta kolay yol mu, doğru yol mu?”

```text
[Kolay Yol]   [Zor Ama Etik Yol]
```

Bu ekran, timeline’daki etik çağrıyı destekler ve oyuncuya düşünsel bir bağ kurdurur.

## 1) Mimari Düzenleme ve Kod Temizliği
- __Hedef__: Ayrık, test edilebilir modüller. Global state yerine tek bir `Game` sınıfı ya da reducer tabanlı state.
- __Görevler__:
  1. `bir_islem.js` dosyasını modüllere ayır: `state`, `game-logic`, `solver`, `ui`, `utils`.
  2. Eksik fonksiyonları ya tanımla ya da akışı sadeleştir: `calculateScore`, `score`, `showCurrentStep`, `disableOperand`.
  3. Operatör ve operand event bağlarını `ui` katmanında açıkça kur.
  4. Strict mode ve ES Modules kullan (gerekirse bundler olmadan native ESM).
  5. Kod stilini Prettier + ESLint ile standardize et.

__Kabul Kriterleri__:
- Oyun akışı hatasız çalışır; konsolda hata bulunmaz.
- Solver fonksiyonu ayrı module olur ve bağımsız test edilebilir.

---

## 2) UI/UX Modernizasyonu
- __Hedef__: Mobil öncelikli, erişilebilir, modern arayüz.
- __Görevler__:
  1. Tasarım sistemi belirle (Tailwind CSS veya sade CSS + CSS vars). Harici bağımlılık istemezsen sade CSS.
  2. Grid tabanlı düzen, tuş takımı/operatör butonları, durum geri bildirimi (seçili operand/operatör highlight, geçersiz işlem uyarısı).
  3. Işık/Koyu tema desteği.
  4. Erişilebilirlik: butonlara `aria-label`, kontrast kontrolü, klavye ile oynanabilirlik.
  5. Türkçe/İngilizce metinleri `i18n` yapısına al.
  6. Tema & Renk Paleti:
     - `prefers-color-scheme` ile otomatik açık/koyu tema geçişi.
     - Palet (öneri): Açık: `#fdf6e3`, `#268bd2`, `#859900` — Koyu: `#002b36`, `#b58900`, `#2aa198`.
     - Tailwind kullanılırsa `dark:` varyantlarıyla tema sınıfları.
  7. Grid Tabanlı Düzen (sayılar ve operatörler):
     - `display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;` yerleşimi opsiyonu.
     - Kutu etkileşimleri: hover’da büyüme, seçilince vurgu (`.selected { border:2px solid #268bd2; transform: scale(1.05); }`).
  8. İşlem Animasyonları:
     - İki sayının "birleşip" sonucun oluşması için CSS animasyonu (`@keyframes merge`).
     - Sonucun “havaya fırlaması” efekti (scale/translate + fade).
  9. Durum Geri Bildirimi:
     - Seçili operand/operatör için belirgin highlight.
     - Geçersiz işlemde shake animasyonu + kırmızı border.
     - Zamanlayıcı için dairesel progress (SVG ya da CSS `conic-gradient`).
  10. Mobil Uyumluluk:
      - 360px ekranlarda sayı kutularını alt alta, operatörleri yatay scroll ile göster.
      - `meta viewport` doğrulaması ve dokunmatik hedef boyutları.
  11. İkonlar ve Mikro Etkileşimler:
      - Operatörler için SVG ikonlar (örn. Heroicons) ile stilize görünüm.
      - Butonlarda hover/active/focus mikro animasyonlar; `Geri Al`, `İpucu`, `Çözüm Göster` için tooltips.

__Kabul Kriterleri__:
- 360px–1200px arası responsive.
- WCAG AA kontrast.

### Bonus: Görsel Test ve Prototipleme
- Figma: UI prototipleri, grid/tema/animasyon akışları.
- Tailwind Play: Hızlı CSS denemeleri (CDN ile entegre).
- Lighthouse: Performans ve erişilebilirlik analizi.
- WCAG uyum kontrolü.

---

## 3) Oynanış Mekanikleri ve Zorluk Seviyeleri
- __Hedef__: Ayarlanabilir zorluk ile tekrar oynanabilirlik.
- __Görevler__:
  1. Zorluk seviyeleri: Kolay/Orta/Zor.
     - Kolay: Küçük hedef aralığı, 1 büyük sayı (25/50/75/100), daha çok küçük sayılar.
     - Orta: Mevcut denge.
     - Zor: Hedef aralığı geniş, işlemlerde tam bölünebilirlik şartı aranmayabilir (opsiyonel), süre daha kısa.
  2. Süre yönetimi: Geri sayım, durdur/yenile, süre bitiminde otomatik puanlama.
  3. Puanlama sistemi: Hedefe yakınlık, kullanılan adım sayısı/operatör çeşitliliği bonusu, seri/streak bonusu.
  4. Geri alma (undo) ve adım geçmişi görünümü.

### 3.1) Skor Kalıcılığı ve Liderlik Tablosu
- Durum: localStorage ile skor kaydı `js/bir_islem.js` içinde aktif (`loadScores`, `saveScore`, `getTopScores`).
- Görevler:
  1. `birIslem.html` içine “Skorlar” paneli ekle (`#leaderboardArea`) ve “Skorları Göster” / “Skorları Temizle” butonları.
  2. `js/bir_islem.js` içine `renderLeaderboard(limit=10)` ve `clearScores()` ekle; buton eventlerini bağla.
  3. Skor kaydına opsiyonel oyuncu adı/rumuz alanı ekle (prompt veya küçük bir input ile).
  4. `README.md`’ye skorların saklama yöntemi ve gizlilik notu ekle.
- Kabul Kriterleri:
  - En iyi 10 skor, puana göre azalan sıralı listelenir.
  - “Temizle” ile localStorage’daki kayıtlar silinir.
  - Oyuncu adı opsiyonel olarak kayda eklenebilir.

__Kabul Kriterleri__:
- Zorluk seçimi UI’dan yapılabilir ve oyun parametrelerini etkiler.
- Puanlama tutarlı ve kaydedilebilir.

---

## 4) Genel Kültür (Trivia) Modu – Ek Oyun Modu
- __Hedef__: Kelime/Genel kültür soruları ile alternatif mod.
- __Görevler__:
  1. Basit trivia motoru: JSON kaynaklı soru bankası (TR odaklı, genişletilebilir).
  2. Zorluk bazlı soru seçimi, süreli cevaplama, puanlama.
  3. Oyun modu seçici: "Bir İşlem" ve "Genel Kültür".

__Kabul Kriterleri__:
- Modlar arası geçiş sorunsuz.
- Trivia soru akışı ve puanlama çalışır.

---

## 5) Kalıcılık, İstatistik ve Liderlik Tablosu
- __Görevler__:
  1. `localStorage` ile kullanıcı ayarları (tema, dil, zorluk) ve skor geçmişi.
  2. Basit yerel liderlik tablosu (cihaz bazlı). Opsiyonel bulut entegrasyonu (Netlify Functions/Firebase) – API anahtarı gerektirir.
  3. Basit analitik (oyun sayısı, ortalama yakınlık) – `localStorage` ya da privacy‑friendly sayım.

__Kabul Kriterleri__:
- Ayarlar kalıcı tutulur; skorlar listelenir.

---

## 6) Test, Kalite ve CI
- __Görevler__:
  1. Unit test: solver ve puanlama için.
  2. E2E smoke test: temel akış (başlat → hamle → çözüm göster → yeni oyun).
  3. GitHub Actions ile lint + test CI.

__Kabul Kriterleri__:
- PR üzerinde otomatik lint/test geçer.

---

## 7) Build ve Yayınlama
- __Görevler__:
  1. Basit yapı: native ESM, ayrı modül dosyaları. İsteğe bağlı Vite.
  2. Netlify/GitHub Pages dağıtım konfigürasyonu.
  3. Versiyonlama ve CHANGELOG.

__Kabul Kriterleri__:
- Tek komutla lokal çalışma ve tek tıkla yayın.

---

## 8) Yol Haritası ve Önceliklendirme
- __Faz 1 (Hafta 1)__: Mimari düzenleme + temel UI + zorluk seçimi (islem modu) + hataların giderilmesi.
- __Faz 2 (Hafta 2)__: Puanlama, süre, undo/riport, i18n, tema, mobil optimizasyon.
- __Faz 3 (Hafta 3)__: Trivia modu MVP + kalıcılık + basit liderlik tablosu.
- __Faz 4 (Hafta 4)__: Testler, CI, yayın otomasyonu ve görsel parlatma.

---

## Sprint Planı (2 haftalık döngüler)

### Sprint 1 — Temel Modülerlik + UI Temelleri
- [x] Solver’ı saf fonksiyon haline getir: `js/solver.js` (entegrasyon: `birIslem.html` ve `js/bir_islem.js`).
- [ ] State/UI ayrımı için hazırlık: `GameState` ve `UIController` taslakları (dosya iskeleti, içe aktarımlar).
- [ ] UI grid düzeni (3x3 veya 2x3) ve responsive temel (360px–1200px).
- [ ] Tema başlangıcı: `prefers-color-scheme` ile açık/koyu ve temel renk değişkenleri.
- [ ] Erişilebilirlik: `aria-label` doğrulama, focus görünürlüğü.
- [x] Jest konfigürasyonu ve unit testler: `__tests__/solver.test.js` çalışır durumda.

### Sprint 2 — Oynanış ve Puanlama İyileştirmeleri
- [ ] Puanlama formülünün netleştirilmesi ve README tabloyla senkronizasyonu.
- [ ] Zamanlayıcı: dairesel progress (SVG/CSS `conic-gradient`).
- [x] Geçersiz işlemde görsel geri bildirim (shake + kırmızı border).
- [ ] i18n altyapısı: TR/EN metin ayırımı (basit `lang.js`).
- [ ] Mobil iyileştirmeler: yatay scroll operatör barı, dokunmatik hedef boyutları.

### Sprint 3 — Modlar ve Kalıcılık
- [ ] Mod seçici (İşlem/Trivia) ve basit router/mode state.
- [ ] Trivia motoru: JSON şema, örnek veri (`public/data/trivia.tr.json`).
- [ ] Skor/ayar kalıcılığı: `localStorage` (ileride `IndexedDB` adapter opsiyonu).
- [ ] Basit liderlik tablosu (cihaz bazlı).

### Sprint 4 — Kalite, Yayın ve Parlatma
- [ ] CI: GitHub Actions ile Jest + ESLint (
      `.github/workflows/test.yml`).
- [ ] Netlify/GitHub Pages yayın ve README’ye “Live Demo” linki.
- [ ] İşlem animasyonları (merge + “havaya fırlama”), mikro etkileşimler.
- [ ] SVG ikon seti (operatörler ve aksiyon butonları), tooltips.
- [ ] Plugin API taslağı ve örnek eklenti (`registerSolverPlugin`).

Not: Sprint’ler arası bağımlılıklar minimal tutuldu; görsel işler Sprint 1’de temel, Sprint 4’te parlatma düzeyinde ele alınacak.

---

## Sprint Çalışma Modeli (Scrum‑lite)

Bu proje, 1–2 haftalık sprint döngüsüyle yönetilir. Aşağıdaki süreç, planlama ve yürütmede standarttır.

- __Backlog__: Tüm fikirler/görevler bu dosyada tutulur (özellikler, iyileştirmeler, hatalar, teknik borç).
- __Sprint Hedefi__: Sprint boyunca tek cümlelik odak; kapsam bu amaca hizmet etmeli.
- __Sütunlar__: To Do → In Progress → In Review/Verify → Done. WIP sınırı: In Progress ≤ 3.
- __Tanım (DoD)__: Çalışır, test/manuel doğrulama yapıldı, dokümantasyon/README güncellendi, loglar temiz.
- __Seremoniler__:
  - Planlama: Sprint başında hedef ve backlog seçimi (maks 60 dk).
  - Günlük (opsiyonel): 5–10 dk; engeller kaydedilir.
  - Review/Retro: Sprint sonunda çıktıların gösterimi ve 2–3 aksiyon maddesi.
- __Öneri/İstek Akışı__: Sprint sırasında yeni öneriler “Öneri İnbox” altına eklenir, bir sonraki planlamada değerlendirilir.
- __Hata Yönetimi__: Kritik hatalar sprint sırasına bakılmaksızın “In Progress”e taşınabilir; diğerleri triage ile backlog’a alınır.

### Şablonlar

- __Öneri kaydı__:
  - Başlık, kısa açıklama, değer/etki, tahmini efor, bağımlılıklar.
- __Hata kaydı__:
  - Adımlar, beklenen/gerçek sonuç, ortam, log/ekran görüntüsü, etki derecesi.

---

## Aktif Sprint: Sprint 5 (2025‑08‑30 → 2025‑09‑06)

- __Sprint Hedefi__: “Step is still running” hatasını tamamen ortadan kaldırmak; adım yürütme yaşam döngüsünü güvenceye almak ve doğrulayan testleri eklemek.

### Sprint Backlog

- __[In Progress]__ isStepping guard ile adım yürütmeyi serileştir ve UI’yi adım sırasında kilitle
  - Dosya: `js/bir_islem.js` — `calculate()`, `operandClicked()`, `operatorClicked()`, `undo()`, zamanlayıcı timeout
  - DoD: Hızlı tıklamalarda üst üste adım başlamaz; UI kilidi doğru açılır.

- __[In Progress]__ Adım yaşam döngüsü için tanısal loglar (select → operate → apply → reset)
  - DoD: Konsolda anlaşılır, gürültüsüz loglar; gerektiğinde kolayca kapatılabilir.

- __[Todo]__ Repro dokümantasyonu (net çoğaltma vakaları)
  - Dosya: `tasks.md` “Hata Raporları” bölümü; adım‑adım senaryolar.

- __[Todo]__ Undo ve step tamamlama için unit/integration testleri
  - Dosya(lar): `__tests__/` ek testler; temel DOM akışı için minimal harness.

- __[Todo]__ README/DECISIONS güncellemesi (guard, UI kilidi, adım yaşam döngüsü)

### WIP Politikası

- Aynı anda en fazla 3 görev “In Progress”. Kritik hata bu sınırı aşabilir; diğer görevler durdurulur.

### Öneri Inbox (Sprint sırasında gelenler)

- __Klavye kapsamı genişletme__
  - Açıklama: Klavye ile oynanabilirliği tamamlamak için ek kısayollar ve girişler.
  - Kapsam:
    - U: `undo()`
    - H: `showHint()`
    - Operatör tuşları: `+`, `-`, `*`, `/` → ilgili butonlara yönlendirme
    - Sayı seçimi: çok haneli tampon (örn. 10, 25, 75, 100) — mevcut buffer akışının genişletilmiş doğrulamaları
  - Kabul Kriterleri:
    - JSDOM/Jest ile klavye testleri: U, H, operatörler ve çok haneli sayı seçimi doğrulanır.
    - Erişilebilirlik: Focus sırası ve `aria-pressed` güncellenir.
  - Not: Ana geliştirme tamamlandıktan sonra ele alınacak (küçük iyileştirme).

- __.shake animasyon ince ayarı__
  - Açıklama: Geçersiz işlemde kullanılan `.shake` animasyon hedefi ve süresini netleştirme.
  - Kapsam:
    - Hedef element: `#stepsList` yerine işlem bağlama açısından daha uygun hedef (örn. seçili operand veya merkezi konteyner) belirle.
    - Süre: 250–300ms arası; `prefers-reduced-motion` uyumu korunur.
  - Kabul Kriterleri:
    - Animasyon kullanıcıyı rahatsız etmeden (subtle) fark edilir.
    - DEBUG off iken gereksiz yeniden akış/paint tetikleri minimaldir.
  - Not: Ana geliştirme tamamlandıktan sonra ele alınacak (küçük iyileştirme).

### Hata Triage

- Önceliklendirme ölçütleri: kullanıcı etkisi, veri/oyun bütünlüğü, tekrar etme sıklığı.
- “Kritik” ise anında sprint kapsamına alınır.

---

## 9) Ayrıntılı Görev Listesi (İş Kuyruğu)
- __A. Hızlı Düzeltmeler__
  - [x] `font-size: 3ev` → `3em` düzelt.
  - [x] HTML’e operatör butonlarını ekle (`+ - × ÷`).
  - [x] Operandlar için click event bağla ve seçili durum stilini tanımla.
  - [x] Eksik fonksiyonları tanımla veya kaldır: `calculateScore`, `score`, `showCurrentStep`, `disableOperand`.
  - [x] İpucu butonu ekle; ipucu başına puan cezası uygula ve dökümde göster.

- __B. Mimari__
  - [ ] State ve UI ayrımı, module yapısı.
  - [x] Solver’ı saf fonksiyon haline getir ve test et (scaffold).

- __C. UI/UX__
  - [ ] Responsive layout ve modern stil.
  - [ ] Klavye ile oynanabilirlik ve erişilebilirlik.

- __D. Oynanış__
  - [ ] Zorluk seviyeleri ve parametreleri.
  - [ ] Süre ve puanlama sistemi.
  - [ ] Undo ve adım geçmişi gösterimi.

- __E. Modlar__
  - [ ] Mod seçici (İşlem / Trivia).
  - [ ] Trivia soru bankası ve akış.

- __F. Kalıcılık & Yayın__
  - [ ] localStorage ayar/skor.
  - [ ] Basit liderlik tablosu.
  - [ ] CI, testler, dağıtım.

- __G. Dokümantasyon__
  - [x] `DECISIONS.md`: Mimari/ürün kararlarını tarih/bağlam/alternatiflerle kaydet.
  - [x] `CHANGELOG.md`: Sürüm ve değişiklik geçmişi (Keep a Changelog formatı önerilir).
  - [x] README güncellemeleri: Skor kalıcılığı ve liderlik tablosu kullanım notları; animasyonlar ve dürüst oyun kuralları eklendi.

---

## Notlar
- Öncelikle mevcut islem modunu eksiksiz ve hatasız hale getirelim; sonra modülerleştirip yeni modları ekleyelim.
- Tasarım tercihi: Tailwind tercih edilirse `link` ile CDN kullanımına başlanabilir, ileride Vite/Tailwind yapılandırmasına geçilir.

---

## Aksiyon Planı Kayıtları

- 2025-08-30
  - `js/solver.js` eklendi: saf solver modülü (window.Solver + CommonJS export).
  - `birIslem.html` içerisine `js/solver.js` dahil edildi.
  - `js/bir_islem.js` içinde solver çağrıları `Solver.solve(...)` üzerinden çalışacak şekilde güncellendi (fallback korunuyor).
  - Jest test iskeleti eklendi: `__tests__/solver.test.js`.
  - UI mikro animasyonları: `.shake` (0.25s, ±4px) ve `.step-card` appear eklendi; `prefers-reduced-motion` desteği.
  - Seçim sıfırlama yardımcıları ve çağrım noktaları eklendi (yeni oyun, adım sonrası/undo, süre bitimi).
  - Dürüst oyun kuralları belirlendi ve README/DECISIONS güncellendi.
  - Liderlik tablosu kalıcılığı: `localStorage` altında `birIslem:scores`; yardımcılar: `loadScores()`, `saveScore()`, `getTopScores()`; UI: `renderLeaderboard()`, `clearScores()`; 1000 kayıt sınırı.
  - Oyuncu adı kalıcılığı sağlamlaştırıldı: `birIslem:playerName` için `input/change` dinleyicileri, delege `change` yakalayıcı, modül init’te uygulama, DOM rebuild için `MutationObserver` ve güvenli `getElementById` patch.
  - Kapsamlı testler: `__tests__/scores.test.js` (kalıcılık, UI, temizleme, evaluateRound entegrasyonu, oyuncu adı kalıcılığı) ve `__tests__/lifecycle.test.js` (yaşam döngüsü/guard) yeşil.
  - Yaşam döngüsü ek testleri: hızlı ardışık tıklamada `calculate()` yalnızca 1 kez; timeout sonrası guard sıfırlanınca operand tıklaması kabul edilir.

---

## Hata Raporları – Şablon (Triage için Standart)

- __Başlık__: Kısa ve etkili (örn. "Step is still running hatası: undo sonrası kilitlenme").
- __Özet__: 1–2 cümlelik genel durum.
- __Adımlar__:
  1. ...
  2. ...
  3. ...
- __Beklenen Sonuç__: ...
- __Gerçek Sonuç__: ...
- __Ortam__: Tarayıcı/Sürüm, Cihaz/OS, Ekran boyutu, Tarih/saat (lokal).

---

## Backlog (Takip Notları)
- Jest fake timers ile timeout testlerini hızlandırma ve deterministikleştirme (mevcut testler stabil; hız optimizasyonu).
- `calculate()` için opsiyonel event/callback kancaları (test gözlenebilirliği/arttırılmış ayrışma).
- İleri aşamada E2E smoke (Playwright) ile temel oyun akışı (yeni oyun → birkaç adım → evaluate → skor güncelleme).
- __Log/Kayıt__: Konsol çıktısı, ekran görüntüsü/video (varsa). Kısa kopyala‑yapıştır blokları tercih edin.
- __Etki Derecesi__: Kritik/Yüksek/Orta/Düşük.
- __Notlar__: Geçici çözüm, tekrar etme sıklığı, ilgili commit/branch.

Örnek Kayıt:

```text
Başlık: Step still running – hızlı çift tıklamada işlem kilitleniyor
Özet: Hızlı ardışık operand tıklamalarında adım guard resetlenmeden UI kilidi kalkmıyor.
Adımlar:
1) İlk operandı seç.
2) Operatörü seç.
3) İkinci operandı hızla iki kez tıkla.
Beklenen: Tek adım tamamlanır, UI tekrar etkileşime açılır.
Gerçek: UI kilitli kalıyor, konsolda "calculate ignored: step in progress" tekrarlanıyor.
Ortam: Chrome 126, Ubuntu 22.04, 1366x768, 2025‑08‑30 15:30.
Log: [kısa konsol dump]
Etki: Yüksek (oynanışı engelliyor), sık tekrar ediyor.
Not: Zamanlayıcı bitişinde guard resetleniyor; geçici çözüm: yeni oyun.
```

### Step Lifecycle Repro Senaryoları (Beklenen Davranışlar ile)

- __Hızlı çift tıklama (ikinci operand)__
  - Adımlar: Sol operandı seç → Operatör seç → Sağ operandı çok hızlı iki kez tıkla.
  - Beklenen: `calculate()` yalnızca bir kez çalışır; `birIslem.isStepping` adım sonunda `false` olur; operand/operatörler yeniden etkinleşir.
  - İlgili loglar: `[BirIslem] calculate: START` → `[BirIslem] calculate: END OK`.

- __Stepping sırasında tıklamalar__
  - Adımlar: Adım çalışırken herhangi bir operand/operatöre tıkla.
  - Beklenen: Tüm tıklamalar yok sayılır; log: `operandClicked/operatorClicked ignored: step in progress`.

- __Undo sırasında stepping__
  - Adımlar: Adım devam ederken `undo()` (UI/klavye).
  - Beklenen: Undo yok sayılır; log: `undo ignored: step in progress`.

- __Timeout sonrası reset__
  - Adımlar: Sürenin bitmesini bekle.
  - Beklenen: `stopRoundTimer()` çağrılır, seçimler temizlenir, `birIslem.isStepping = false`, `evaluateRound()` bir kez çağrılır.
  - Loglar: `timer: TIMEOUT — guard cleared, evaluating round` ve tekil evaluate.

- __Yeni Oyun (New)__
  - Adımlar: `Yeni` butonuna bas.
  - Beklenen: Zamanlayıcı durur, seçimler temizlenir, guard sıfırlanır, oyun durumu tazelenir.
  - Loglar: `newClicked: START` → `createGame: INIT` → `timer: START` → `createGame: READY` → `newClicked: END`.

- __Çözüm Göster adil oyun__
  - Adımlar: Tur içinde `Çözümü Göster`.
  - Beklenen: `birIslem.solutionRevealed = true`, `acceptButton` devre dışı; puan 0 (evaluate sonrası).

- __Klavye kısayolları (stepping sırasında)__
  - Adımlar: Adım sırasında çözüm/undo vb. kısayollar.
  - Beklenen: Stepping boyunca kritik eylemler yok sayılır veya kilitli UI ile çakışmaz.

Notlar:
- DEBUG kapalı varsayılandır. Tanı için geçici `window.APP_DEBUG = true` veya `process.env.DEBUG=1` ile açılabilir.
- İlgili fonksiyonlar: `calculate()`, `startRoundTimer()`, `stopRoundTimer()`, `newClicked()`, `createGame()`, `undo()`.
