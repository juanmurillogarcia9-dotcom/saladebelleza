import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config/api'
import { useSalonStore } from './salonStore'

export const useAuthStore = defineStore('auth', () => {
    const token = ref('')
    const usuario = ref(null)

    async function enviarCredenciales(ruta, datos) {
        let response
        try {
            response = await fetch(`${API_URL}/auth/${ruta}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            })
        } catch (error) {
            console.error('No se pudo conectar con el backend:', error)
            throw new Error('No se pudo conectar con el servidor. Inicia el backend en el puerto 4000.')
        }

        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
            throw new Error(`El servidor de API (${API_URL}) devolvió HTML en vez de JSON. Verifica la URL y que el backend esté ejecutándose.`)
        }

        const resultado = await response.json()

        if (!response.ok) throw new Error(resultado.error || 'No se pudo completar la solicitud')
        if (!resultado.token || !resultado.usuario) {
            throw new Error('El servidor no devolvió los datos de sesión esperados.')
        }
        if (resultado.usuario.rol !== datos.rol) {
            throw new Error(`Esta cuenta no puede entrar como ${datos.rol}. Usa el apartado de ${resultado.usuario.rol}.`)
        }

        useSalonStore().limpiarDatos()
        token.value = resultado.token
        usuario.value = resultado.usuario
        return resultado.usuario
    }

    function iniciarSesion(datos) {
        return enviarCredenciales('login', datos)
    }

    function registrarse(datos) {
        return enviarCredenciales('register', datos)
    }

    function cerrarSesion() {
        token.value = ''
        usuario.value = null
        useSalonStore().limpiarDatos()
    }

    function encabezadosAutenticados() {
        return token.value ? { Authorization: `Bearer ${token.value}` } : {}
    }

    return { token, usuario, iniciarSesion, registrarse, cerrarSesion, encabezadosAutenticados }
}, {
    persist: true
})