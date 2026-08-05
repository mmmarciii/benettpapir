# Benettpapir CI/CD es Public Deploy Lepesek

Ez a dokumentum a most beallitott GitHub Actions pipeline-hoz keszult.

## 0. Jelenlegi hosting korlat

A jelenlegi tarhelyen nincs Node.js alkalmazas futtatasi lehetoseg.
Ezert a backend at lett irva PHP-ra, hogy ugyanazon a tarhelyen fusson.

## 1. Mit keszitettunk el a repoban

- CI workflow: .github/workflows/ci.yml
- CD workflow: .github/workflows/deploy.yml
- Kotelezo backend valtozok: backend/server.js
- Env mintak: backend/.env.example es frontend/.env.example
- Gyoker .gitignore titkok es build artifactok vedelmere

## 2. Amit neked kell megcsinalnod a GitHubon

1. Toltsd fel a kodot GitHub repo-ba.
2. Allitsd public-ra a repot (ha ezt szeretned).
3. Settings > Secrets and variables > Actions > New repository secret alatt hozd letre:
   - FTP_SERVER
   - FTP_USERNAME
   - FTP_PASSWORD
   - VITE_API_URL

Megjegyzes: az FTP deploy celmappak a workflow-ban vannak beallitva:

- public_html/benettpapir/Frontend/
- public_html/benettpapir/Backend/

## 3. Amit a szerveren kell megcsinalnod egyszer

1. A frontendhez es a PHP backendhez eleg az FTP es a webkiszolgalo.
2. Hozd letre a cel mappakat:
   - public_html/benettpapir/Frontend/
   - public_html/benettpapir/Backend/
3. Add jogosultsagot a deploy usernek ezekre a mappakra.
4. HTTPS: Let's Encrypt / certbot.

Fontos: a frontend VITE_API_URL valtozojanak a PHP backend URL-jere kell mutatnia,
peldaul: https://benettpapir.hu/benettpapir/Backend

## 4. Pipeline mukodes

- CI automatikusan fut minden pull requestre es main push-ra.
- CD automatikusan fut main push-ra, es manualisan is indithato (workflow_dispatch).

## 5. Fontos biztonsagi megjegyzesek

- Backend mar nem indul el ADMIN_USERNAME es ADMIN_PASSWORD nelkul.
- Ne committelj .env fajlt.
- Ha valaha secret kerult commitba, azt azonnal rotald (uj jelszo/kulcs).

## 6. Elso eles deploy menete

1. Pushold a main agra.
2. Nezd meg a GitHub Actions futast.
3. Ha zold, nyisd meg a domaint.
4. Ellenorizd:
   - frontend betolt
   - backend API endpointok valaszolnak a /Backend/api/\* utvonalon
