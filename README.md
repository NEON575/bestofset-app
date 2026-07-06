# Bestofset — Mətbəə İdarəetmə Sistemi

Google Sheets əsasında qurulan mətbəə idarəetmə sisteminin tam database-əsaslı,
onlayn versiyası. Next.js + PostgreSQL + Prisma + NextAuth.

## Bölmələr

Dashboard, Sifarişlər, Maya Dəyəri, Satış Fakturaları, Müştərilər, Ödənişlər,
Anbar, Alışlar, Borclar, Əmək haqqı.

## Əsas iş prosesi

1. Sifariş **Sifarişlər** bölməsində yaradılır (Sifariş № avtomatik: SIF-0001, SIF-0002...).
2. Sifariş istehsal mərhələlərindən keçir: Dizayn → Çap → Kəsim → Laminasiya → Bitib.
3. Sifarişlər siyahısında **"Təhvil ver"** düyməsinə basdıqda:
   - Təhvil tarixi avtomatik yazılır
   - Satış fakturası avtomatik yaranır (eyni sifariş üçün YALNIZ BİR DƏFƏ)
   - Sifariş "Təhvil verildi" statusuna keçir
4. Fakturada **"Sifarişə qaytar"** düyməsi fakturanı SİLMİR — statusunu
   "Qaytarıldı" edir və sifarişi yenidən "İşdədir" statusuna qaytarır.
5. E-qaimə və ödəniş statusu fakturada ayrıca idarə olunur.
6. Ödəniş **Ödənişlər** bölməsində qeyd olunanda müştərinin borcu və
   fakturanın ödəniş statusu avtomatik yenilənir.

## 1. Lokal işə salınma

Tələblər: Node.js 20+, lokal və ya uzaq PostgreSQL.

```bash
npm install
cp .env.example .env
# .env faylında DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL dəyərlərini doldurun
npx prisma migrate dev --name init
npm run seed -- admin@bestofset.az MəxfiŞifrə123 "Admin"
npm run dev
```

Tətbiq http://localhost:3000 ünvanında açılacaq. Yaratdığınız e-poçt/şifrə ilə daxil olun.

## 2. .env necə doldurulur

```
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
NEXTAUTH_SECRET="təsadüfi uzun mətn, məsələn: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"   # canlıda Railway domenini yazın
```

## 3. PostgreSQL necə qoşulur

- Lokal: `postgresql://postgres:postgres@localhost:5432/bestofset`
- Railway: aşağıdakı 5-ci addıma baxın, `DATABASE_URL` avtomatik verilir.

## 4. Prisma migration necə edilir

```bash
npx prisma migrate dev --name <dəyişikliyin_adı>   # development
npx prisma migrate deploy                            # production / Railway
npx prisma studio                                     # database-i vizual görmək
```

## 5. Railway-də necə deploy edilir

1. Railway-də yeni layihə yaradın → **"Deploy from GitHub repo"** seçin və bu
   kodu GitHub-a push etdikdən sonra qoşun.
2. Eyni layihəyə **"+ New" → "Database" → "PostgreSQL"** əlavə edin. Railway
   avtomatik `DATABASE_URL` dəyişənini verəcək.
3. Tətbiqin **Variables** bölməsində əlavə edin:
   - `DATABASE_URL` → Postgres servisindən "Reference variable" ilə bağlayın
   - `NEXTAUTH_SECRET` → təsadüfi uzun mətn
   - `NEXTAUTH_URL` → Railway-in sizə verdiyi domen (məs: `https://bestofset.up.railway.app`)
4. **Settings → Deploy → Pre-Deploy Command** sahəsinə yazın:
   ```
   npx prisma migrate deploy
   ```
5. Railway `npm run build` və `npm run start` əmrlərini avtomatik işə salacaq
   (`next.config.js`-də `output: "standalone"` artıq qoyulub).
6. Deploy bitdikdən sonra, Railway-in "Shell" funksiyası ilə admin yaradın:
   ```
   npm run seed -- admin@bestofset.az MəxfiŞifrə123 "Admin"
   ```

## 6. Admin istifadəçi necə yaradılır

```bash
npm run seed -- <e-poçt> <şifrə> "<Ad Soyad>"
```

Bu əmr eyni e-poçtla yenidən çağırılsa, mövcud istifadəçinin şifrəsini yeniləyir
(admin şifrəsini unutsanız belə sıfırlaya bilərsiniz).

Digər istifadəçiləri (MENECER/İŞÇİ rolları ilə) hazırda birbaşa database-də
(`npx prisma studio` vasitəsilə, `User` cədvəlində) yaratmaq lazımdır — UI
üzərindən istifadəçi idarəetməsi sonrakı mərhələdə əlavə edilə bilər.

## Rol icazələri

| Rol      | Görə bildiyi bölmələr                                              |
|----------|----------------------------------------------------------------------|
| ADMIN    | Hamısı                                                                |
| MANAGER  | Dashboard, Sifarişlər, Fakturalar, Müştərilər, Ödənişlər               |
| WORKER   | Yalnız Sifarişlər (istehsal statusunu görmək/dəyişmək üçün)           |

## Texniki qeydlər

- Bütün hesablama düsturları `src/lib/calc.ts` faylında cəmlənib.
- Fakturalar ayrıca database cədvəlində (`Invoice`) saxlanılır, sifariş
  üzərində formula kimi HESABLANMIR — Excel-dəki "üstünə yazılma" problemi
  buna görə mümkün deyil.
- Hər sifarişin YALNIZ BİR fakturası ola bilər (`orderId` unique constraint).
- Excel export: Sifarişlər səhifəsindəki "Excel export" düyməsi.
- PDF export: Hər fakturanın yanındakı "PDF" düyməsi.

## Məlum məhdudiyyətlər (növbəti mərhələ üçün)

- İstifadəçi idarəetmə UI-si yoxdur (hazırda Prisma Studio ilə edilir).
- Axtarış/filter panelləri sadədir, bölmə üzrə fərqlənir — daha geniş
  filter (tarix aralığı, mətn axtarışı) əlavə edilə bilər.
- E-poçt bildirişləri yoxdur.
