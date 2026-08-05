# Benettpapir Admin - Felhasznaloi utmutato

Ez a dokumentum a webes admin felulet napi hasznalatahoz keszult.

## 1. Belepesi URL

Az admin felulet elerese:

- https://benettpapir.hu/Backend/admin

## 2. Bejelentkezes

1. Nyisd meg az admin oldalt.
2. Add meg a felhasznalonevet es a jelszot.
3. Kattints a Bejelentkezes gombra.

A bejelentkezesi adatok backend oldalon a `.env` fajlban vannak:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## 3. Kezelo felulet roviden

A felso tabok:

- **Ajanlatok**: termekajanlatok kezelese
- **Akcio**: napi kedvencek/menu elemek kezelese
- **Instagram**: instagram posztok kezelese

A jobb felso **Kijelentkezes** gombbal biztonsagosan kilephetsz.

## 4. Ajanlatok kezelese

### Uj ajanlat felvitele

1. Menj az **Ajanlatok** tabra.
2. Kattints az **Uj hozzaadasa** gombra.
3. Toltsd ki a mezoket:

- Nev
- Leiras
- Ar
- Cimke
- Kep (feltoltes vagy URL)
- Sorrend
- Megjelenites a weboldalon

4. Kattints a **Mentes** gombra.

### Ajanlat modositasa

1. Keresd meg a sort a tablazatban.
2. Kattints a **Frissites** gombra.
3. Modositsd az adatokat.
4. Mentes.

### Ajanlat torlese

1. Kattints a sorban a **Torles** gombra.
2. Az elem azonnal torlodik.

## 5. Akcio/Napi kedvencek kezelese

A folyamat ugyanaz, mint az ajanlatoknal, de itt **nincs Cimke** mezo.

1. Menj az **Akcio** tabra.
2. Uj elemhez kattints az **Uj hozzaadasa** gombra.
3. Mentes utan az elem megjelenik a listaban.

## 6. Kepek feltoltese

Kepet ket modon adhatsz meg:

1. **Feltoltessel**:

- kattints a feltolto dobozra vagy huzd bele a kepet
- sikeres feltoltes utan a rendszer URL-t general

2. **Kezi URL** megadasaval

Kep torlese az url mezobol:

- **Kep torlese** gomb

## 7. Instagram kezeles

### Kezi poszt felvitel

1. Menj az **Instagram** tabra.
2. Kattints az **Uj poszt** gombra.
3. Toltsd ki a caption, kep URL, link, datum mezoket.
4. Mentes.

### Importalas profil/post URL-bol

1. Az import mezonek adj meg egy Instagram profil vagy poszt URL-t.
2. Kattints az **Importalas** gombra.
3. A statusz uzenet jelzi, hany poszt kerult be.

### Poszt allapot valtas

A listaban:

- **Megjelenites** vagy **Elrejtes** gomb

### Poszt torles

A listaban a **Torles** gombbal.

## 8. Mit jelentenek az allapotok

- **Lathato**: megjelenik a nyilvanos oldalon
- **Rejtett**: nem jelenik meg, de adminban megmarad

## 9. Gyakori hibak es megoldasok

### 401 Unauthorized

- Rossz felhasznalonev vagy jelszo.
- Ellenorizd a backend `.env` fajlt.

### 500 hiba

- Hianyzo vagy hibas backend konfiguracio.
- Ellenorizd, hogy a `Backend/.env` megvan-e.

### Kep feltoltes utan nem jelenik meg

- Ellenorizd, hogy a feltoltott fajl az `uploads` mappaba kerult-e.
- Ellenorizd a mentett URL-t.

### Modositasok deploy utan eltunnek

- Ellenorizd, hogy a deploy workflow-ban a `data/**`, `uploads/**`, `.env` ki van zarva a backend deploybol.

## 10. Biztonsagi javaslatok

1. Az admin jelszo legyen eros es egyedi.
2. Rendszeresen csinalj backupot ezekrol:

- `Backend/data/`
- `Backend/uploads/`
- `Backend/instagram-feed.json`

3. A `.env` fajlt soha ne committeld Git-be.

## 11. Napi hasznalat gyors rutin

1. Belepni adminba.
2. Uj/aktualis tartalmak frissitese.
3. Lathatosag ellenorzese (Lathato/Rejtett).
4. Nyilvanos oldalon gyors ellenorzes.
5. Kijelentkezes.
