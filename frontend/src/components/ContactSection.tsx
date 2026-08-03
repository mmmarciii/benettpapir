import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const shopLocation: [number, number] = [47.780977, 19.128619]

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export function ContactSection() {
  return (
    <section id="kontakt" className="content-grid">
      <article className="content-card">
        <p className="section-label">Kapcsolat</p>
        <h2>Látogass el hozzánk</h2>
        <div className="contact-list">
          <p>📍 Vác, Dr. Csányi László Krt. 29, 2600 Magyarország</p>
          <p>📞 +36 70 2762 277</p>
          <p>📞 +36 27 319 296</p>
          <p>✉️ hello@benettpapir.hu</p>
        </div>

        <div className="map-card">
          <MapContainer center={shopLocation} zoom={13} scrollWheelZoom={false} className="map-container">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={shopLocation} icon={customIcon}>
              <Popup>Benettpapír · Vác</Popup>
            </Marker>
          </MapContainer>
        </div>
      </article>

      <article className="content-card accent-card">
        <p className="section-label">Nyitvatartás</p>
        <div className="contact-list">
            <p>A nyitvatartási időnk ünnepek alatt változhat!</p>
        </div>
        <div className="hours-list">
          <div><span>Hétfő</span><span>08:30 – 16:30</span></div>
          <div><span>Kedd</span><span>08:30 – 16:30</span></div>
          <div><span>Szerda</span><span>08:30 – 16:30</span></div>
          <div><span>Csütörtök</span><span>08:30 – 16:30</span></div>
          <div><span>Péntek</span><span>08:30 – 16:30</span></div>
          <div><span>Szombat</span><span>09:00 – 12:00</span></div>
          <div><span>vasárnap</span><span>Zárva</span></div>
        </div>
      </article>
    </section>
  )
}
