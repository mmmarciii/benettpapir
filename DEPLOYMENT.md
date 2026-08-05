# Benettpapir CI/CD es Public Deploy Lepesek

Ez a dokumentum a most beallitott GitHub Actions pipeline-hoz keszult.

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

- /home/benettpa/benettpapir/Frontend/
- /home/benettpa/benettpapir/Backend/

## 3. Amit a szerveren kell megcsinalnod egyszer

1. Telepitsd: Node.js 20+, npm, pm2, nginx.
2. Hozd letre a cel mappakat:
   - /home/benettpa/benettpapir/Frontend/
   - /home/benettpa/benettpapir/Backend/
3. Add jogosultsagot a deploy usernek ezekre a mappakra.
4. Nginx-ben allitsd be:
   - frontend static root a Frontend mappajara
   - /api proxy a backend folyamathoz (localhost:3001)
5. HTTPS: Let's Encrypt / certbot.

Fontos: FTP deploy csak fajlokat tolt fel. A backend ujrainditasat (pm2 restart),
es az .env valtozok beallitasat szerveroldalon kulon kell kezelned.

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
   - admin login mukodik
   - backend API endpointok valaszolnak
