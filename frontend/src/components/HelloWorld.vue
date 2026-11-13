<script setup>
// Importa ref para crear un valor reactivo de Vue.
import { ref } from 'vue'
// Importa la imagen principal que se muestra en el encabezado.
import heroImg from '../assets/hero.png'
// Importa el logotipo de Vite usado en la sección visual y los enlaces.
import viteLogo from '../assets/vite.svg'
// Importa el logotipo de Vue usado en la sección visual y los enlaces.
import vueLogo from '../assets/vue.svg'

// Crea y expone al template un contador reactivo que inicia en cero.
const count = ref(0)
// Cierra el bloque de JavaScript del componente.
</script>

<!-- Inicia el template con el contenido visual del componente. -->
<template>
  <!-- Agrupa el encabezado y el contador en la sección principal. -->
  <section id="center">
    <!-- Agrupa las imágenes de marca del encabezado. -->
    <div class="hero">
      <!-- Muestra la imagen principal con dimensiones definidas y sin texto alternativo. -->
      <img :src="heroImg" class="base" width="170" height="179" alt="" />
      <!-- Muestra el logotipo de Vue en el encabezado. -->
      <img :src="vueLogo" class="framework" alt="Vue logo" />
      <!-- Muestra el logotipo de Vite en el encabezado. -->
      <img :src="viteLogo" class="vite" alt="Vite logo" />
    <!-- Cierra el grupo de imágenes del encabezado. -->
    </div>
    <!-- Agrupa el título y la instrucción inicial. -->
    <div>
      <!-- Muestra el título de bienvenida. -->
      <h1>Get started</h1>
      <!-- Indica que App.vue puede editarse para probar la recarga en caliente. -->
      <p>Edit <code>src/App.vue</code> and save to test <code>HMR</code></p>
    <!-- Cierra el grupo del título y la instrucción. -->
    </div>
    <!-- Crea un botón que incrementa el contador al pulsarlo y muestra su valor. -->
    <button type="button" class="counter" @click="count++">
      <!-- Presenta el valor reactivo actual del contador. -->
      Count is {{ count }}
    <!-- Cierra el botón del contador. -->
    </button>
  <!-- Cierra la sección principal del componente. -->
  </section>

  <!-- Dibuja un separador decorativo entre la portada y los siguientes enlaces. -->
  <div class="ticks"></div>

  <!-- Inicia la sección con enlaces a documentación y redes sociales. -->
  <section id="next-steps">
    <!-- Agrupa los enlaces de documentación. -->
    <div id="docs">
      <!-- Declara el icono visual de documentación mediante un sprite SVG. -->
      <svg class="icon" role="presentation" aria-hidden="true">
        <!-- Inserta dentro del SVG el símbolo de documentación. -->
        <use href="/icons.svg#documentation-icon"></use>
      <!-- Cierra el icono SVG de documentación. -->
      </svg>
      <!-- Titula el bloque de enlaces de documentación. -->
      <h2>Documentation</h2>
      <!-- Resume el propósito del bloque de documentación. -->
      <p>Your questions, answered</p>
      <!-- Inicia la lista de recursos de documentación. -->
      <ul>
        <!-- Inicia el elemento de lista para Vite. -->
        <li>
          <!-- Enlaza al sitio oficial de Vite y lo abre en una pestaña nueva. -->
          <a href="https://vite.dev/" target="_blank">
            <!-- Muestra el logotipo de Vite junto al enlace. -->
            <img class="logo" :src="viteLogo" alt="" />
            <!-- Presenta el texto del enlace al sitio de Vite. -->
            Explore Vite
          <!-- Cierra el enlace al sitio de Vite. -->
          </a>
        <!-- Cierra el elemento de la lista de Vite. -->
        </li>
        <!-- Inicia el elemento de lista para Vue. -->
        <li>
          <!-- Enlaza al sitio oficial de Vue y lo abre en una pestaña nueva. -->
          <a href="https://vuejs.org/" target="_blank">
            <!-- Muestra el logotipo de Vue junto al enlace. -->
            <img class="button-icon" :src="vueLogo" alt="" />
            <!-- Presenta el texto del enlace al sitio de Vue. -->
            Learn more
          <!-- Cierra el enlace al sitio de Vue. -->
          </a>
        <!-- Cierra el elemento de la lista de Vue. -->
        </li>
      <!-- Cierra la lista de recursos de documentación. -->
      </ul>
    <!-- Cierra el bloque de enlaces de documentación. -->
    </div>
    <!-- Agrupa los enlaces de la comunidad y redes sociales. -->
    <div id="social">
      <!-- Declara el icono visual de redes sociales mediante un sprite SVG. -->
      <svg class="icon" role="presentation" aria-hidden="true">
        <!-- Inserta dentro del SVG el símbolo de redes sociales. -->
        <use href="/icons.svg#social-icon"></use>
      <!-- Cierra el icono SVG de redes sociales. -->
      </svg>
      <!-- Titula el bloque de enlaces a la comunidad. -->
      <h2>Connect with us</h2>
      <!-- Resume el propósito del bloque de comunidad. -->
      <p>Join the Vite community</p>
      <!-- Inicia la lista de redes y comunidades de Vite. -->
      <ul>
        <!-- Inicia el elemento de lista para GitHub. -->
        <li>
          <!-- Enlaza al repositorio de Vite y lo abre en una pestaña nueva. -->
          <a href="https://github.com/vitejs/vite" target="_blank">
            <!-- Declara el icono de GitHub mediante el sprite SVG. -->
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <!-- Inserta dentro del SVG el símbolo de GitHub. -->
              <use href="/icons.svg#github-icon"></use>
            <!-- Cierra el icono SVG de GitHub. -->
            </svg>
            <!-- Presenta el texto del enlace a GitHub. -->
            GitHub
          <!-- Cierra el enlace al repositorio de GitHub. -->
          </a>
        <!-- Cierra el elemento de la lista de GitHub. -->
        </li>
        <!-- Inicia el elemento de lista para Discord. -->
        <li>
          <!-- Enlaza al chat de Vite y lo abre en una pestaña nueva. -->
          <a href="https://chat.vite.dev/" target="_blank">
            <!-- Declara el icono de Discord mediante el sprite SVG. -->
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <!-- Inserta dentro del SVG el símbolo de Discord. -->
              <use href="/icons.svg#discord-icon"></use>
            <!-- Cierra el icono SVG de Discord. -->
            </svg>
            <!-- Presenta el texto del enlace a Discord. -->
            Discord
          <!-- Cierra el enlace al chat de Discord. -->
          </a>
        <!-- Cierra el elemento de la lista de Discord. -->
        </li>
        <!-- Inicia el elemento de lista para X. -->
        <li>
          <!-- Enlaza al perfil de Vite en X y lo abre en una pestaña nueva. -->
          <a href="https://x.com/vite_js" target="_blank">
            <!-- Declara el icono de X mediante el sprite SVG. -->
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <!-- Inserta dentro del SVG el símbolo de X. -->
              <use href="/icons.svg#x-icon"></use>
            <!-- Cierra el icono SVG de X. -->
            </svg>
            <!-- Presenta el texto del enlace a X. -->
            X.com
          <!-- Cierra el enlace al perfil de X. -->
          </a>
        <!-- Cierra el elemento de la lista de X. -->
        </li>
        <!-- Inicia el elemento de lista para Bluesky. -->
        <li>
          <!-- Enlaza al perfil de Vite en Bluesky y lo abre en una pestaña nueva. -->
          <a href="https://bsky.app/profile/vite.dev" target="_blank">
            <!-- Declara el icono de Bluesky mediante el sprite SVG. -->
            <svg class="button-icon" role="presentation" aria-hidden="true">
              <!-- Inserta dentro del SVG el símbolo de Bluesky. -->
              <use href="/icons.svg#bluesky-icon"></use>
            <!-- Cierra el icono SVG de Bluesky. -->
            </svg>
            <!-- Presenta el texto del enlace a Bluesky. -->
            Bluesky
          <!-- Cierra el enlace al perfil de Bluesky. -->
          </a>
        <!-- Cierra el elemento de la lista de Bluesky. -->
        </li>
      <!-- Cierra la lista de redes y comunidades. -->
      </ul>
    <!-- Cierra el bloque de redes sociales. -->
    </div>
  <!-- Cierra la sección de documentación y redes sociales. -->
  </section>

  <!-- Añade un segundo separador decorativo antes del espacio final. -->
  <div class="ticks"></div>
  <!-- Reserva una sección vacía usada como espacio visual al final. -->
  <section id="spacer"></section>
<!-- Cierra el template del componente. -->
</template>
