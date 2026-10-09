import { createRouter, createWebHistory } from 'vue-router'
import AgendaView from '../views/AgendaView.vue'
import AgendarCitaView from '../views/AgendarCitaView.vue'
import ClientesView from '../views/ClientesView.vue'
import ServiciosView from '../views/ServiciosView.vue'
import NosotrosView from '../views/NosotrosView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/authStore'

const routes = [
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/', name: 'Agenda', component: AgendaView, meta: { rol: 'estilista' } },
    { path: '/agendar', name: 'Agendar', component: AgendarCitaView, meta: { rol: 'cliente' } },
    { path: '/clientes', name: 'Clientes', component: ClientesView, meta: { rol: 'estilista' } },
    { path: '/servicios', name: 'Servicios', component: ServiciosView },
    { path: '/nosotros', name: 'Nosotros', component: NosotrosView }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to) => {
    const auth = useAuthStore()
    if (auth.token && auth.token.split('.').length !== 3) {
        auth.cerrarSesion()
    }
    if (auth.token && auth.usuario && to.name === 'Login') {
        return auth.usuario.rol === 'estilista' ? { name: 'Agenda' } : { name: 'Agendar' }
    }
    if (to.name === 'Login') return true
    if (!auth.token || !auth.usuario) return { name: 'Login' }
    if (to.meta.rol && auth.usuario.rol !== to.meta.rol) {
        return auth.usuario.rol === 'estilista' ? { name: 'Agenda' } : { name: 'Agendar' }
    }
    return true
})

export default router