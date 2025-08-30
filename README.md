# 🧠 Bir İşlem — Zekâya Dayalı Sayı Oyunu

Rastgele verilen 6 sayı ve bir hedefle, dört işlem kullanarak zihinsel bir meydan okumaya hazır mısınız?

## İçindekiler
- [Özellikler](#özellikler)
- [Nasıl Çalıştırılır](#nasıl-çalıştırılır)
- [Oynanış](#oynanış)
- [Kontroller](#kontroller)
- [Puanlama](#puanlama)
- [Skorlar ve Gizlilik](#skorlar-ve-gizlilik)
- [Geliştirme Notları](#geliştirme-notları)
- [Testler](#testler)
- [English Version](#english-version)

## Özellikler
- Hedef sayı ve 6 sayı otomatik üretilir.
- Toplama, çıkarma, çarpma, bölme ile ara sonuçlar üretilebilir.
- Adımlar paneli ile yapılan işlemler tek tek izlenir.
- Geri al (undo) ile son hamleyi iptal edebilirsiniz.
- Çözüm Göster ile algoritmik olarak bulunan önerilen çözümü görebilirsiniz.
- İpucu butonu ile sıradaki tek hamle için öneri alabilir, fakat puanınızdan düşer.
- Tur sonunda ayrıntılı Puan Dökümü gösterilir.
 - Mikro etkileşimler: geçersiz işlemde kısa “shake” animasyonu, adımlar "step-card" olarak 0.25s fade/slide-in ile görünür.
 - Erişilebilirlik: klavye akışı, `prefers-reduced-motion` ile animasyonları kapatma.

## Nasıl Çalıştırılır
1. Depoyu indirin veya kopyalayın.
2. `birIslem.html` dosyasını bir tarayıcıda açın.
   - İsterseniz bir statik sunucu ile de çalıştırabilirsiniz (ör. VSCode Live Server, `python3 -m http.server`).

Proje yapısı:
- `birIslem.html` — Oyun arayüzü ve stiller
- `js/bir_islem.js` — Oyun mantığı, zamanlayıcı, puanlama, ipucu, çözüm

## Oynanış
- Amaç: Verilen 6 sayıyı dört işlem ile kullanarak hedef sayıya ulaşmak.

### Oynanış Adımları
1. 6 sayı ve bir hedef otomatik olarak verilir.
2. Bir sayı kutusuna tıklayın.
3. Bir işlem seçin (`+`, `-`, `×`, `÷`).
4. İkinci sayıyı seçin.
5. Elde edilen sonuç, yeni kullanılabilir sayı olarak havuza eklenir.
6. İstediğiniz kadar işlem yapabilirsiniz.
7. `Onayla` ile turu sonlandırabilir veya hedefe ulaşırsanız tur otomatik biter.

## Kontroller
- `+`, `-`, `×`, `÷` — İşlem seçimi
- `Onayla` — Turu değerlendirir ve puanı hesaplar
- `Sonuç Göster` — Önerilen çözümü listeler
- `Geri Al` — Son hamleyi geri alır
- `Yeni Oyun` — Yeni tur başlatır
- `İpucu` — Sıradaki tek hamle için öneri verir (puan cezası vardır)

### Klavye Kısayolları
- Rakamlar: operand seçimi (çok haneli sayılar için 0.4 sn buffer)
- Operatör: `+`, `-`, `*`/`x`/`X`, `/`
- Enter: Onayla
- N: Yeni oyun
- U: Geri al
- H: İpucu
- S: Çözüm Göster
- Esc: Seçimleri temizle

## Puanlama
Puan, hedefe yakınlık ve çeşitli bonuslardan oluşur; ipucu kullanımında ceza uygulanır. Tur sonunda puan dökümü kartı kalem kalem gösterilir.

| Kriter              | Açıklama                      | Puan Etkisi |
|---------------------|-------------------------------|-------------|
| Hedefe Yakınlık     | En yakın sonucu bulma         | 0–100       |
| Tam İsabet Bonusu   | Hedefi tam tutturma           | +20         |
| Kullanılmayan Sayılar | Her kalan sayı için bonus   | +5/sayı     |
| Daha Az Adım        | Daha az işlemle bitirme       | +10         |
| Hız Bonusu          | Süreye bağlı ek puan          | +0–15       |
| İpucu Kullanımı     | Her ipucu için ceza           | −15/ipucu   |

Ek kurallar (dürüst oyun):
- Adım yapılmadıysa (0 adım) puan verilmez ve liderliğe kaydedilmez.
- Çözüm tur sırasında gösterildiyse: Onayla butonu devre dışı kalır, puan 0’a sabitlenir ve liderliğe kaydedilmez. “Tekrar Dene” de devre dışı bırakılır.

## Skorlar ve Gizlilik
- Skorlar tur bitiminde cihazınızda `localStorage` altında saklanır: `birIslem:scores`.
- “Skorlar” panelinden listelenebilir ve temizlenebilir.
- (Opsiyonel) Oyuncu adı cihazda saklanır: `birIslem:playerName`.
- Gizlilik: Veriler yalnızca tarayıcınızda tutulur, sunucuya gönderilmez.
 - Not: 0 puanlık turlar (adım yok veya çözüm gösterildi) kaydedilmez.

## Geliştirme Notları
- Ana oyun durumu nesnesi: `birIslem` (`js/bir_islem.js`)
  - `allowedNumbers`, `steps`, `history`, `timeLeft`, `target` vb.
  - İpucu ile ilgili alanlar: `hintUsedCount`, `hintPenalty`, `lastHint`
- Önemli fonksiyonlar:
  - `createGame()` — Yeni turu başlatır, tüm alanları sıfırlar.
  - `operandClicked()` / `operatorClicked()` — Kullanıcı seçimlerini yönetir.
  - `calculate()` — Seçilen iki sayı ve işlemle yeni sonuç üretir ve havuza ekler.
  - `undo()` — Son hamleyi geri alır (snapshot tabanlı).
  - `evaluateRound()` — Puanı hesaplar, çözüm/özet kartını basar.
  - `computeHint()` / `showHint()` — En iyi tek hamleyi önerir ve ipucu cezasını işler.
  - `solve()` — Tüm olası kombinasyonları dener, en iyi çözümü bulur (önerilen çözüm için).

### Adım Yaşam Döngüsü Guard (isStepping)
- Adımlar seri çalışır: `calculate()` sırasında girişler kilitlenir ve tüm çıkış yollarında guard kapanır.
- Guard kontrolü `operandClicked()`, `operatorClicked()`, `undo()` başlarında yapılır; zaman aşımında ve yeni oyunda sıfırlanır.
- UI durumu `resetOperatorButtons()` ve `clearOperandSelections()` ile normalize edilir.

### DEBUG / dlog
- Üretimde gürültüyü önlemek için loglar `dlog()` ile DEBUG arkasına alınmıştır.
- Geçici aç/kapat:
  - Tarayıcı: `window.APP_DEBUG = true` (sayfa açıkken geçerlidir)
  - Node/Jest: `DEBUG=1` ya da `NODE_ENV=development`

## Testler
- Birim testleri Jest ile çalışır.
- Çalıştırma:
  1) Jest kurulum: `npm i -D jest`
  2) Test: `npm test`
- Dosyalar:
  - `__tests__/solver.test.js` saf çözücüyü (`js/solver.js`) test eder.
  - `__tests__/lifecycle.test.js` yaşam döngüsü/guard ve puanlama kurallarını doğrular.

İpucu cezası değerini değiştirmek için `js/bir_islem.js` içindeki `birIslem.hintPenalty` değerini düzenleyebilirsiniz.

---

## English Version

# Bir İşlem — Number Puzzle Game

Are you ready for a mental challenge using four operations to reach a target from 6 random numbers?

## Table of Contents
- [Features](#features)
- [How to Run](#how-to-run)
- [Gameplay](#gameplay)
- [Controls](#controls)
- [Scoring](#scoring)
- [Scores & Privacy](#scores--privacy)
- [Testing](#testing)
- [Developer Notes](#developer-notes)

## Features
- Target and 6 numbers are generated automatically.
- Create intermediate results using addition, subtraction, multiplication, division.
- Steps panel lists each operation you performed.
- Undo the last move.
- Show Solution reveals a recommended solution via the solver.
- Hint button suggests a single next move (deducts score).
- Detailed Score Breakdown at the end of a round.
 - Micro-interactions: short “shake” animation on invalid operations; steps rendered as "step-cards" with ~0.25s fade/slide-in.
 - Accessibility: improved keyboard flow; animations respect `prefers-reduced-motion`.

## How to Run
1. Clone or download the repository.
2. Open `birIslem.html` in a browser.
   - Optionally run via a simple static server (e.g., VSCode Live Server, `python3 -m http.server`).

Project structure:
- `birIslem.html` — UI & styles
- `js/bir_islem.js` — Game logic, timer, scoring, hint, solver

## Gameplay
- Goal: Reach the target number using the 6 numbers with the four operations.

### Steps
1. The 6 numbers and the target are given automatically.
2. Click a number tile.
3. Choose an operation (`+`, `-`, `×`, `÷`).
4. Choose the second number.
5. The result is added back into the pool as a usable number.
6. Repeat as many operations as you like.
7. End the round with `Onayla` (Accept) or reach the target to auto-finish.

## Controls
- `+`, `-`, `×`, `÷` — Choose operation
- `Onayla` — Evaluate and score the round
- `Sonuç Göster` — Show recommended solution
- `Geri Al` — Undo last move
- `Yeni Oyun` — Start a new round
- `İpucu` — Single-move hint (score penalty applies)

### Keyboard Shortcuts
- Digits: select operands (0.4s buffer for multi-digit)
- Operators: `+`, `-`, `*`/`x`/`X`, `/`
- Enter: Accept
- N: New game
- U: Undo
- H: Hint
- S: Show Solution
- Esc: Clear selections

## Scoring
Score combines proximity to target with several bonuses; hint usage applies a penalty. A detailed breakdown is shown at the end of the round.
Scores are stored locally and a leaderboard is maintained.

| Criterion            | Description                    | Effect     |
|----------------------|--------------------------------|------------|
| Proximity            | How close you are to target    | 0–100      |
| Exact Hit Bonus      | Hitting the target exactly     | +20        |
| Unused Numbers       | Bonus per remaining number     | +5/number  |
| Fewer Steps          | Finishing in fewer operations  | +10        |
| Speed Bonus          | Bonus based on remaining time  | +0–15      |
| Hint Usage           | Penalty per hint               | −15/hint   |

Fair-play rules:
- If no steps were made (0 steps), no score is given and nothing is saved to the leaderboard.
- If the solution is revealed during the round: Accept is disabled, score is locked to 0, and the round is not saved. Retry is also disabled.

## Scores & Privacy
- Scores are stored locally in `localStorage` under `birIslem:scores` when a round ends.
- View/Clear scores from the "Scores" panel.
- Optional player name is stored under `birIslem:playerName`.
- Privacy: Data stays in your browser; nothing is sent to a server.
 - Note: 0-point rounds (no steps or solution revealed) are not saved.

## Testing
- Unit tests use Jest.
- Run:
  1) Install Jest: `npm i -D jest`
  2) Run tests: `npm test`
- Files: `__tests__/solver.test.js` targets the pure solver at `js/solver.js`.

## Developer Notes
- Main game state object: `birIslem` (`js/bir_islem.js`)
  - `allowedNumbers`, `steps`, `history`, `timeLeft`, `target`, etc.
  - Hint-related: `hintUsedCount`, `hintPenalty`, `lastHint`
- Key functions:
  - `createGame()` — Initializes a new round.
  - `operandClicked()` / `operatorClicked()` — Handles user selections.
  - `calculate()` — Applies the operation to two numbers and pushes the result.
  - `undo()` — Reverts the last move (snapshot-based).
  - `evaluateRound()` — Calculates the score and renders the breakdown and comparison.
  - `computeHint()` / `showHint()` — Suggests the best single move and applies penalty.
  - `solve()` — Tries combinations to find a recommended solution.

### Leaderboard Helpers
- Persistence uses `localStorage` with key `birIslem:scores`.
- Helpers (also exposed globally for tests): `loadScores()`, `saveScore(record)`, `getTopScores(limit)`, `renderLeaderboard(limit)`, `clearScores()`.
- Score list is capped to the last 1000 entries to avoid unbounded growth.

### Player Name Persistence
- Optional player name is stored under `birIslem:playerName`.
- Saved on both `input` and `change` events; also captured via a delegated `change` listener for robustness.
- Restored on module init/new game; in dynamic/test environments a MutationObserver re-applies when `#playerName` appears.

To change the hint penalty, adjust `birIslem.hintPenalty` in `js/bir_islem.js`.
