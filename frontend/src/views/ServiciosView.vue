<template>
  <q-page class="esther-page q-pa-xl flex flex-center">
    <div class="salon-background"></div>

    <div class="content-wrapper">
      <div class="text-center q-mb-xl">
        <span class="sub-title-badge">✨ Tratamientos Exclusivos ✨</span>
        <h1 class="luxury-heading text-h3 text-weight-bold text-dark q-mt-sm q-mb-xs">Nuestros Servicios</h1>
        <p class="text-subtitle1 text-muted luxury-subtitle">Tratamientos diseñados para realzar tu belleza natural</p>
      </div>
      
      <div class="row q-col-gutter-lg justify-center">
        <div class="col-12 col-md-4" v-for="(servicio, index) in servicios" :key="index">
          <div class="esther-card">
            <!-- Imagen superior ajustada a la tarjeta -->
            <div class="card-image-container">
              <img :src="servicio.imagen" :alt="`Servicio de ${servicio.nombre}`" class="service-img" loading="lazy" />
            </div>

            <!-- Contenido de la tarjeta -->
            <div class="card-content flex column justify-between">
              <div>
                <span class="service-category">{{ servicio.categoria }}</span>
                <div class="text-h6 text-pink luxury-heading text-weight-bold q-mb-sm">{{ servicio.nombre }}</div>
                <p class="service-description">{{ servicio.descripcion }}</p>
                <h3 class="includes-title">Tu experiencia incluye</h3>
                <ul class="includes-list">
                  <li v-for="detalle in servicio.incluye" :key="detalle">{{ detalle }}</li>
                </ul>
                <p class="duration-line">Duración aproximada: {{ servicio.duracionMinutos }} minutos</p>
              </div>
              <div class="text-center">
                <span class="price-tag">{{ servicio.precio }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { API_URL } from '../config/api';
import { presentarServicio } from '../config/servicios';

const servicios = ref([]);

onMounted(async () => {
  try {
    const response = await fetch(`${API_URL}/servicios`);
    if (!response.ok) throw new Error('No se pudo cargar el catálogo');
    const catalogo = await response.json();
    servicios.value = catalogo.map(presentarServicio);
  } catch (error) {
    console.error('Error al cargar servicios:', error);
  }
});
</script>

<style scoped>
.esther-page { 
  position: relative; 
  min-height: 100vh; 
  overflow: hidden; 
}

.salon-background {
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
  background-image: linear-gradient(rgba(252, 251, 249, 0.82), rgba(252, 251, 249, 0.88)), 
                    url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920');
  background-size: cover; 
  background-position: center; 
  z-index: 1;
}

.content-wrapper { 
  position: relative; 
  z-index: 2; 
  width: 100%; 
  max-width: 1100px; 
  padding: 20px 0; 
}

.sub-title-badge {
  display: inline-block; 
  font-size: 0.85rem; 
  letter-spacing: 2px; 
  color: #b3637e; 
  text-transform: uppercase; 
  font-weight: 600;
  background: rgba(216, 131, 158, 0.1); 
  padding: 4px 14px; 
  border-radius: 20px; 
  border: 1px solid rgba(216, 131, 158, 0.2);
}

.luxury-heading { 
  font-family: 'Playfair Display', serif; 
  letter-spacing: -0.5px; 
  color: #232023; 
}

.luxury-subtitle { 
  font-family: 'Playfair Display', serif; 
  font-style: italic; 
  color: #5c5559; 
}

.text-pink { 
  color: #b3637e !important; 
}

.text-muted { 
  color: #5c5559 !important; 
}
.duration-line { color: #8f455e; font-size: 0.85rem; font-weight: 700; }
.service-category {
  display: inline-block;
  margin-bottom: 9px;
  color: #9a536a;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1.1px;
}
.service-description { margin: 0 0 16px; color: #5c5559; font-size: .92rem; line-height: 1.65; }
.includes-title { margin: 0 0 8px; color: #393236; font-size: .9rem; font-weight: 700; }
.includes-list { display: grid; gap: 6px; margin: 0 0 16px; padding-left: 19px; color: #5c5559; font-size: .85rem; line-height: 1.45; }

/* Tarjeta principal */
.esther-card {
  background-color: rgba(255, 255, 255, 0.96); 
  backdrop-filter: blur(12px);
  border: 1px solid rgba(216, 131, 158, 0.25); 
  border-radius: 20px; 
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 15px 40px rgba(179, 99, 126, 0.08); 
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.esther-card:hover { 
  transform: translateY(-4px); 
  border-color: #d8839e; 
}

/* Contenedor de la imagen arriba para que cubra perfectamente sin deformarse */
.card-image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f7f0f3;
}

.service-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.esther-card:hover .service-img {
  transform: scale(1.05);
}

/* Contenido interno de la tarjeta */
.card-content {
  padding: 28px;
  flex-grow: 1;
}

.price-tag {
  display: inline-block; 
  background: rgba(216, 131, 158, 0.1); 
  color: #b3637e; 
  font-weight: 700;
  padding: 8px 24px; 
  border-radius: 20px; 
  border: 1px solid rgba(216, 131, 158, 0.25); 
  font-size: 1.05rem;
}
</style>