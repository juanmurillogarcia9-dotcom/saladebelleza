<template>
  <q-page class="esther-page q-pa-xl flex flex-center">
    <div class="salon-background"></div>

    <div class="form-container">
      <div class="esther-card text-center">
        <span class="sub-title-badge q-mb-md">✨ Nuestra Esencia ✨</span>
        <h1 class="luxury-heading text-h3 text-weight-bold text-pink q-mb-md">Belleza con cuidado y dedicación</h1>
        <p class="text-muted q-mb-lg luxury-body">
          En <strong class="text-dark">Salón de Belleza Esther</strong> nos dedicamos al cuidado y estilismo personal.
          Escuchamos lo que buscas y te orientamos para que elijas un servicio que se adapte a tu estilo, a tu cabello
          y a la ocasión.
        </p>

        <div class="values-grid">
          <article class="value-card">
            <span class="value-icon">✂️</span>
            <h2>Servicios de belleza</h2>
            <p>
              Ofrecemos cortes y peinados, coloración y balayage, manicure y pedicure spa,
              maquillaje profesional y tratamientos capilares con keratina.
            </p>
          </article>
          <article class="value-card">
            <span class="value-icon">🌿</span>
            <h2>Productos seleccionados</h2>
            <p>
              Trabajamos con productos profesionales elegidos para cada servicio y tipo de cabello.
              Te explicamos el cuidado recomendado para ayudar a mantener los resultados en casa.
            </p>
          </article>
          <article class="value-card">
            <span class="value-icon">🤍</span>
            <h2>Atención personalizada</h2>
            <p>
              Antes de comenzar, conversamos contigo sobre tus preferencias y expectativas.
              Cuidamos la higiene de nuestros espacios y procuramos que cada visita sea cómoda y agradable.
            </p>
          </article>
        </div>

        <p class="closing-copy">
          Queremos que salgas sintiéndote bien, con un resultado cuidado y recomendaciones claras para seguir
          disfrutándolo.
        </p>
        <div class="badge-footer">✨ Tu estilo, nuestro cuidado ✨</div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.esther-page { position: relative; min-height: 100vh; overflow-y: auto; padding: 40px 20px; }

/* Fondo mejorado del salón: imagen de alta calidad, nítida y con un degradado suave */
.salon-background {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-image: linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.65)), 
                    url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=95&w=2000');
  background-size: cover; background-position: center; z-index: 1;
}

.form-container { position: relative; z-index: 2; width: 100%; max-width: 850px; padding: 20px; }

.sub-title-badge {
  display: inline-block; font-size: 0.85rem; letter-spacing: 2px; color: #b3637e; text-transform: uppercase; font-weight: 600;
  background: rgba(216, 131, 158, 0.12); padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(216, 131, 158, 0.25);
}

.luxury-heading { font-family: 'Playfair Display', serif; letter-spacing: -0.5px; }
.luxury-body { max-width: 700px; margin-right: auto; margin-left: auto; font-size: 1.05rem; color: #4a4245; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.8; }
.text-pink { color: #b3637e !important; }
.text-dark { color: #232023 !important; }
.text-muted { color: #5c5559 !important; }

.esther-card {
  background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px);
  border: 1px solid rgba(216, 131, 158, 0.3); border-radius: 24px; padding: 50px 40px; 
  box-shadow: 0 20px 50px rgba(179, 99, 126, 0.12);
}

.badge-footer {
  display: inline-block; font-family: 'Playfair Display', serif; font-style: italic;
  color: #b3637e; font-weight: 700; font-size: 1.1rem; background: rgba(216, 131, 158, 0.1);
  padding: 8px 24px; border-radius: 30px; border: 1px solid rgba(216, 131, 158, 0.25);
}
.values-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 30px 0 24px; text-align: left; }
.value-card { padding: 22px 18px; border: 1px solid rgba(216, 131, 158, 0.22); border-radius: 16px; background: rgba(255, 249, 251, 0.8); }
.value-icon { font-size: 1.7rem; }
.value-card h2 { margin: 12px 0 8px; color: #8f455e; font: 700 1.15rem 'Playfair Display', Georgia, serif; }
.value-card p, .closing-copy { margin: 0; color: #5c5559; font-size: .92rem; line-height: 1.7; }
.closing-copy { max-width: 660px; margin: 0 auto 22px; font-size: 1rem; }
@media (max-width: 760px) {
  .values-grid { grid-template-columns: 1fr; }
  .esther-card { padding: 34px 22px; }
}
</style>