import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_URL } from '../config/api'

export const useSalonStore = defineStore('salon', () => {
  // Estado básico
  const citas = ref([])
  const estilistas = ref([])
  const clientes = ref([])

  function limpiarDatos() {
    citas.value = []
    estilistas.value = []
    clientes.value = []
  }

  // Acciones simples para conectar con tu backend en el puerto 4000
  const obtenerDatos = async () => {
    try {
      const resEst = await fetch(`${API_URL}/estilistas`)
      estilistas.value = await resEst.json()

      const resCli = await fetch(`${API_URL}/clientes`)
      clientes.value = await resCli.json()
    } catch (error) {
      console.error("Error al conectar con el backend", error)
    }
  }

  return { citas, estilistas, clientes, obtenerDatos, limpiarDatos }
})