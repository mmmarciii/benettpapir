import { PackageCheck, Clock3, Truck, BadgePercent } from 'lucide-react'

export function AboutSection() {
  return (
    <section id="about" className="content-grid">
      <article className="content-card">
        <p className="section-label">Rólunk</p>
        <h2>Üdvözöljük a Benett Nagyker. Kft.-nél!</h2>
        <p>
            Hazai családi vállalkozásunk már több mint 25 éve biztosít mindent az irodai, iskolai vagy óvodai munkához a papír-írószerektől a kreatív hobbi termékekig.
        </p>
        <p>
            Váci üzletünkben (Dr. Csányi László körút 29., a zsinagóga mellett) személyesen is örömmel várjuk Önt, ami webáruházunk átvevőpontja is.
        </p>
        <p>
            Vásárlóink visszajelzései alapján a hatalmas választék mellett leginkább a kedves, barátságos kiszolgálásra vagyunk büszkék. 
        </p>
        <div className="cta-row">
          {/*<a href="#menu" className="btn btn-dark">Browse our menu</a> */}
          <a href="#kontakt" className="btn btn-dark">Látogass el hozzánk</a>
        </div>
      </article>

      <article className="content-card dark-card about-card">
        <p className="section-label">Miért szeretnek minket az ügyfeleink?</p>

        <div className="about-benefits">
          <div className="about-benefit">
            <div className="about-benefit-icon"><PackageCheck size={16} /></div>
            <div>
              <strong>Egyszerű beszerzés</strong>
              <p>Irodaszerek, nyomtatványok és bélyegzők egy helyen, gyorsan és kényelmesen.</p>
            </div>
          </div>

          <div className="about-benefit">
            <div className="about-benefit-icon"><Clock3 size={16} /></div>
            <div>
              <strong>Gyors és rugalmas</strong>
              <p>Ajánlatkészítés 1 napon belül, házhoz szállítás 2–5 munkanapon belül.</p>
            </div>
          </div>

          <div className="about-benefit">
            <div className="about-benefit-icon"><Truck size={16} /></div>
            <div>
              <strong>Helyi kiszállítás</strong>
              <p>Saját gépkocsis kézbesítés Vácott és a 15 km-es körzetben.</p>
            </div>
          </div>

          <div className="about-benefit">
            <div className="about-benefit-icon"><BadgePercent size={16} /></div>
            <div>
              <strong>Kedvező feltételek</strong>
              <p>Egyedi árképzés nagyobb mennyiség vásárlása esetén.</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
