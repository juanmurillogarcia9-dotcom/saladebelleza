<template>
  <q-page class="esther-page q-pa-xl">
    <div class="salon-background"></div>

    <div class="content-wrapper">
      <div class="q-mb-xl text-center">
        <span class="sub-title-badge">✨ Directorio ✨</span>
        <h1 class="luxury-heading text-h3 text-weight-bold text-dark q-mt-sm q-mb-xs">Clientes Habituales</h1>
        <p class="text-subtitle1 text-muted luxury-subtitle">Gestión exclusiva y personalizada de nuestra distinguida clientela</p>
      </div>

      <div class="row q-col-gutter-xl justify-center">
        <!-- Columna Izquierda: Directorio -->
        <div class="col-12 col-md-7">
          <div class="esther-card h-100">
            <div class="text-h6 luxury-heading text-pink text-weight-bold q-mb-md">Directorio de Clientes</div>
            
            <div class="clients-list">
              <div v-for="c in clientes" :key="c._id" class="client-item">
                <div class="client-info">
                  <span class="client-name">{{ c.nombre }}</span>
                  <span class="client-details">📞 {{ c.telefono }} &nbsp;|&nbsp; ✉️ {{ c.email }}</span>
                </div>
              </div>

              <div v-if="clientes.length === 0" class="empty-state">
                <span class="empty-icon">🌸</span>
                <p class="text-muted">{{ errorCarga || 'No hay clientes registrados en el sistema todavía.' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Formulario -->
        <div class="col-12 col-md-5">
          <div class="esther-card">
            <div class="text-h6 luxury-heading text-pink text-weight-bold q-mb-md">Registrar Nuevo Cliente</div>
            
            <form @submit.prevent="agregarCliente" class="esther-form">
              <div class="input-group">
                <label class="input-label">Nombre completo</label>
                <input v-model="nuevo.nombre" type="text" placeholder="Ej. Sofía Vergara" class="luxury-input" required />
              </div>

              <div class="input-group">
                <label class="input-label">Teléfono</label>
                <input v-model="nuevo.telefono" type="text" placeholder="Ej. 300 123 4567" class="luxury-input" required />
              </div>

              <div class="input-group">
                <label class="input-label">Correo electrónico</label>
                <input v-model="nuevo.email" type="email" placeholder="Ej. sofia@email.com" class="luxury-input" required />
              </div>
              <p v-if="error" class="form-error" role="alert">{{ error }}</p>
              <p v-if="mensaje" class="form-success" role="status">{{ mensaje }}</p>
              
              <div class="q-mt-md">
                <button type="submit" class="btn-esther full-width" :disabled="guardando">
                  {{ guardando ? 'Guardando...' : 'Registrar Cliente' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { API_URL } from '../config/api';

const clientes = ref([]);
const nuevo = ref({ nombre: '', telefono: '', email: '' });
const auth = useAuthStore();
const error = ref('');
const errorCarga = ref('');
const mensaje = ref('');
const guardando = ref(false);

const cargarClientes = async () => {
  try {
    const res = await fetch(`${API_URL}/clientes`, {
      headers: auth.encabezadosAutenticados()
    });
    if (!res.ok) throw new Error('No se pudo cargar el directorio de clientes.');
    clientes.value = await res.json();
    errorCarga.value = '';
  } catch (err) {
    errorCarga.value = err.message || 'No se pudo cargar el directorio de clientes.';
    console.error('Error al cargar clientes:', err);
  }
};

const agregarCliente = async () => {
  if (guardando.value) return;
  guardando.value = true;
  error.value = '';
  mensaje.value = '';
  try {
    const res = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.encabezadosAutenticados() },
      body: JSON.stringify(nuevo.value)
    });
    const resultado = await res.json();
    if (!res.ok) throw new Error(resultado.error || 'No se pudo guardar el cliente.');
    nuevo.value = { nombre: '', telefono: '', email: '' };
    mensaje.value = 'El cliente se guardó correctamente en la base de datos.';
    await cargarClientes();
  } catch (err) {
    error.value = err.message || 'No se pudo conectar con el servidor.';
  } finally {
    guardando.value = false;
  }
};

onMounted(cargarClientes);
</script>

<style scoped>
.esther-page { position: relative; min-height: 100vh; overflow-x: hidden; }
.salon-background {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-image: linear-gradient(rgba(252, 251, 249, 0.82), rgba(252, 251, 249, 0.88)), 
                    url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920');
  background-size: cover; background-position: center; z-index: 1;
}
.content-wrapper { position: relative; z-index: 2; width: 100%; max-width: 1100px; margin: 0 auto; }
.sub-title-badge {
  display: inline-block; font-size: 0.85rem; letter-spacing: 2px; color: #b3637e; text-transform: uppercase; font-weight: 600;
  background: rgba(216, 131, 158, 0.1); padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(216, 131, 158, 0.2);
}
.luxury-heading { font-family: 'Playfair Display', serif; letter-spacing: -0.5px; color: #232023; }
.luxury-subtitle { font-family: 'Playfair Display', serif; font-style: italic; color: #5c5559; }
.text-pink { color: #b3637e !important; }
.text-muted { color: #5c5559 !important; }
.esther-card {
  background-color: rgba(255, 255, 255, 0.96); backdrop-filter: blur(12px);
  border: 1px solid rgba(216, 131, 158, 0.25); border-radius: 20px; padding: 36px; box-shadow: 0 15px 40px rgba(179, 99, 126, 0.08);
}
.esther-form { display: flex; flex-direction: column; gap: 16px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-label { font-size: 0.85rem; color: #b3637e; font-weight: 600; }
.luxury-input {
  background-color: #fff9fb; border: 1px solid rgba(216, 131, 158, 0.3); color: #232023;
  padding: 12px 16px; border-radius: 12px; outline: none; font-size: 0.95rem; transition: all 0.3s ease; width: 100%;
}
.luxury-input:focus { border-color: #b3637e; box-shadow: 0 0 0 4px rgba(216, 131, 158, 0.15); background-color: #ffffff; }
.clients-list { display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; padding-right: 4px; }
.client-item {
  background-color: #fcf9fb; border: 1px solid #f0e1e7; border-radius: 12px; padding: 14px 18px; transition: all 0.3s ease;
}
.client-item:hover { background-color: #fff5f8; border-color: #d8839e; transform: translateY(-1px); }
.client-info { display: flex; flex-direction: column; gap: 4px; }
.client-name { font-weight: 600; color: #232023; font-size: 1.05rem; }
.client-details { font-size: 0.85rem; color: #5c5559; }
.empty-state { text-align: center; padding: 40px 20px; }
.empty-icon { font-size: 2.5rem; display: block; margin-bottom: 12px; }
.form-error { margin: 0; color: #a32d3d; font-size: .9rem; }
.form-success { margin: 0; color: #28764b; font-size: .9rem; }
.btn-esther {
  background: linear-gradient(135deg, #d8839e 0%, #b3637e 100%); color: white; border: none; padding: 12px;
  border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 6px 20px rgba(216, 131, 158, 0.3);
}
.btn-esther:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(216, 131, 158, 0.4); }
.full-width { width: 100%; }
</style>