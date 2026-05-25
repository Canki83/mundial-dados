const selecciones = [
  { nombre: "Argentina", bandera: "🇦🇷" },
  { nombre: "Brasil", bandera: "🇧🇷" },
  { nombre: "Uruguay", bandera: "🇺🇾" },
  { nombre: "Francia", bandera: "🇫🇷" },
  { nombre: "España", bandera: "🇪🇸" },
  { nombre: "Inglaterra", bandera: "🏴" },
  { nombre: "Alemania", bandera: "🇩🇪" },
  { nombre: "Italia", bandera: "🇮🇹" },
  { nombre: "Portugal", bandera: "🇵🇹" },
  { nombre: "México", bandera: "🇲🇽" },
  { nombre: "Estados Unidos", bandera: "🇺🇸" },
  { nombre: "Japón", bandera: "🇯🇵" }
];

let jugadores = [];
let fixture = [];
let equiposDelGrupo = [];
let tabla = {};
let partidoActual = 0;
let partidoYaJugado = false;
let ordenFinal = [];
let grupoFinalizado = false;

document.addEventListener("DOMContentLoaded", () => {
  generarFormularioJugadores();
});

function generarFormularioJugadores() {
  const cantidad = Number(document.getElementById("cantidadJugadores").value);
  const contenedor = document.getElementById("jugadoresContainer");

  contenedor.innerHTML = "";

  for (let i = 1; i <= cantidad; i++) {
    const opcionesSelecciones = selecciones.map((seleccion, index) => {
      return `<option value="${index}">${seleccion.bandera} ${seleccion.nombre}</option>`;
    }).join("");

    contenedor.innerHTML += `
      <div class="jugador-form">
        <h3>Jugador ${i}</h3>

        <label>Nombre</label>
        <input type="text" id="nombreJugador${i}" placeholder="Ej: Bauti">

        <label>Selección</label>
        <select id="seleccionJugador${i}">
          ${opcionesSelecciones}
        </select>
      </div>
    `;
  }
}

function iniciarJuego() {
  const cantidad = Number(document.getElementById("cantidadJugadores").value);
  jugadores = [];
  ordenFinal = [];
  grupoFinalizado = false;

  for (let i = 1; i <= cantidad; i++) {
    const nombre = document.getElementById(`nombreJugador${i}`).value.trim();
    const seleccionIndex = Number(document.getElementById(`seleccionJugador${i}`).value);
    const seleccion = selecciones[seleccionIndex];

    if (nombre === "") {
      alert(`Falta poner el nombre del Jugador ${i}`);
      return;
    }

    jugadores.push({
      nombre: nombre,
      seleccion: seleccion.nombre,
      bandera: seleccion.bandera
    });
  }

  const seleccionesElegidas = jugadores.map(jugador => jugador.seleccion);
  const seleccionesSinRepetir = new Set(seleccionesElegidas);

  if (seleccionesElegidas.length !== seleccionesSinRepetir.size) {
    alert("Cada jugador debe elegir una selección distinta.");
    return;
  }

  armarFixtureDePrueba();
  inicializarTabla();

  partidoActual = 0;
  partidoYaJugado = false;

  mostrarResumenJugadores();
  mostrarPartidoActual();
  mostrarTabla();

  document.getElementById("pantalla-inicio").classList.add("hidden");
  document.getElementById("pantalla-juego").classList.remove("hidden");
}

function armarFixtureDePrueba() {
  equiposDelGrupo = [];

  jugadores.forEach(jugador => {
    equiposDelGrupo.push({
      nombre: jugador.seleccion,
      bandera: jugador.bandera
    });
  });

  selecciones.forEach(seleccion => {
    const yaEsta = equiposDelGrupo.some(equipo => equipo.nombre === seleccion.nombre);

    if (!yaEsta && equiposDelGrupo.length < 4) {
      equiposDelGrupo.push(seleccion);
    }
  });

  fixture = [
    { grupo: "Grupo A", equipoA: equiposDelGrupo[0], equipoB: equiposDelGrupo[1] },
    { grupo: "Grupo A", equipoA: equiposDelGrupo[2], equipoB: equiposDelGrupo[3] },
    { grupo: "Grupo A", equipoA: equiposDelGrupo[0], equipoB: equiposDelGrupo[2] },
    { grupo: "Grupo A", equipoA: equiposDelGrupo[1], equipoB: equiposDelGrupo[3] },
    { grupo: "Grupo A", equipoA: equiposDelGrupo[0], equipoB: equiposDelGrupo[3] },
    { grupo: "Grupo A", equipoA: equiposDelGrupo[1], equipoB: equiposDelGrupo[2] }
  ];
}

function inicializarTabla() {
  tabla = {};

  equiposDelGrupo.forEach(equipo => {
    tabla[equipo.nombre] = {
      nombre: equipo.nombre,
      bandera: equipo.bandera,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      pts: 0,
      desempate: "-"
    };
  });
}

function mostrarResumenJugadores() {
  const resumen = document.getElementById("resumenJugadores");

  resumen.innerHTML = jugadores.map(jugador => {
    return `
      <div class="jugador-card">
        <span>${jugador.bandera}</span>
        <strong>${jugador.nombre}</strong>
        <small>${jugador.seleccion}</small>
      </div>
    `;
  }).join("");
}

function mostrarPartidoActual() {
  const partido = fixture[partidoActual];

  document.getElementById("numeroPartido").textContent =
    `Partido ${partidoActual + 1} de ${fixture.length}`;

  document.getElementById("nombreGrupo").textContent = partido.grupo;

  document.getElementById("banderaA").textContent = partido.equipoA.bandera;
  document.getElementById("equipoA").textContent = partido.equipoA.nombre;

  document.getElementById("banderaB").textContent = partido.equipoB.bandera;
  document.getElementById("equipoB").textContent = partido.equipoB.nombre;

  document.getElementById("dado").textContent = "🎲";
  document.getElementById("resultado").textContent = "Esperando tirada...";

  document.getElementById("botonTirar").classList.remove("hidden");
  document.getElementById("botonSiguiente").classList.add("hidden");

  partidoYaJugado = false;
}

function tirarDado() {
  if (partidoYaJugado) {
    return;
  }

  const partido = fixture[partidoActual];
  const dado = Math.floor(Math.random() * 6) + 1;
  let resultado = "";

  if (dado <= 2) {
    resultado = `Ganó ${partido.equipoA.nombre}`;
    registrarVictoria(partido.equipoA.nombre, partido.equipoB.nombre);
  } else if (dado <= 4) {
    resultado = "Empate";
    registrarEmpate(partido.equipoA.nombre, partido.equipoB.nombre);
  } else {
    resultado = `Ganó ${partido.equipoB.nombre}`;
    registrarVictoria(partido.equipoB.nombre, partido.equipoA.nombre);
  }

  document.getElementById("dado").textContent = "🎲 " + dado;
  document.getElementById("resultado").textContent = resultado;

  mostrarTabla();

  document.getElementById("botonTirar").classList.add("hidden");
  document.getElementById("botonSiguiente").classList.remove("hidden");

  partidoYaJugado = true;
}

function registrarVictoria(ganador, perdedor) {
  tabla[ganador].pj++;
  tabla[ganador].g++;
  tabla[ganador].pts += 3;

  tabla[perdedor].pj++;
  tabla[perdedor].p++;
}

function registrarEmpate(equipoA, equipoB) {
  tabla[equipoA].pj++;
  tabla[equipoA].e++;
  tabla[equipoA].pts += 1;

  tabla[equipoB].pj++;
  tabla[equipoB].e++;
  tabla[equipoB].pts += 1;
}

function mostrarTabla() {
  const cuerpoTabla = document.getElementById("tablaPosiciones");

  const equiposOrdenados = grupoFinalizado
    ? ordenFinal
    : Object.values(tabla).sort((a, b) => b.pts - a.pts);

  cuerpoTabla.innerHTML = equiposOrdenados.map((equipo, index) => {
    const clasificado = grupoFinalizado && index < 2 ? "clasificado" : "";
    const marca = grupoFinalizado && index < 2 ? "✅ " : "";

    return `
      <tr class="${clasificado}">
        <td class="equipo-tabla">${marca}${equipo.bandera} ${equipo.nombre}</td>
        <td>${equipo.pj}</td>
        <td>${equipo.g}</td>
        <td>${equipo.e}</td>
        <td>${equipo.p}</td>
        <td><strong>${equipo.pts}</strong></td>
      </tr>
    `;
  }).join("");
}

function siguientePartido() {
  partidoActual++;

  if (partidoActual >= fixture.length) {
    finalizarGrupo();
    return;
  }

  mostrarPartidoActual();
}

function finalizarGrupo() {
  grupoFinalizado = true;

  const resultadoDesempate = ordenarTablaConDesempatePorDado();

  ordenFinal = resultadoDesempate.orden;

  document.getElementById("numeroPartido").textContent = "Fin de la fase de grupos";
  document.getElementById("nombreGrupo").textContent = "Grupo terminado";
  document.getElementById("dado").textContent = "🏆";

  if (resultadoDesempate.huboDesempate) {
    document.getElementById("resultado").innerHTML =
      "Tabla definida por puntos y desempate con dado.<br>" + resultadoDesempate.texto;
  } else {
    document.getElementById("resultado").textContent =
      "Tabla definida por puntos. No hizo falta desempate.";
  }

  document.getElementById("botonTirar").classList.add("hidden");
  document.getElementById("botonSiguiente").classList.add("hidden");

  mostrarTabla();
}

function ordenarTablaConDesempatePorDado() {
  const equipos = Object.values(tabla);
  const gruposPorPuntos = agruparPor(equipos, equipo => equipo.pts);

  const puntosOrdenados = Object.keys(gruposPorPuntos)
    .map(Number)
    .sort((a, b) => b - a);

  let ordenFinalCalculado = [];
  let huboDesempate = false;
  let texto = "";

  puntosOrdenados.forEach(puntos => {
    const grupo = gruposPorPuntos[puntos];

    if (grupo.length === 1) {
      ordenFinalCalculado.push(grupo[0]);
    } else {
      huboDesempate = true;

      const resultado = desempatarGrupoPorDado(grupo);

      texto += `<br><strong>Empate en ${puntos} puntos:</strong> ${resultado.texto}`;

      ordenFinalCalculado.push(...resultado.orden);
    }
  });

  return {
    orden: ordenFinalCalculado,
    huboDesempate,
    texto
  };
}

function desempatarGrupoPorDado(equipos) {
  let pendientes = [...equipos];
  let orden = [];
  let texto = "";

  while (pendientes.length > 0) {
    const tiradas = pendientes.map(equipo => {
      return {
        equipo,
        dado: tirarDadoSimple()
      };
    });

    texto += `<br>${tiradas.map(t => `${t.equipo.bandera} ${t.equipo.nombre}: 🎲 ${t.dado}`).join(" | ")}`;

    const gruposPorDado = agruparPor(tiradas, item => item.dado);
    const dadosOrdenados = Object.keys(gruposPorDado)
      .map(Number)
      .sort((a, b) => b - a);

    pendientes = [];

    dadosOrdenados.forEach(dado => {
      const grupo = gruposPorDado[dado];

      if (grupo.length === 1) {
        grupo[0].equipo.desempate = dado;
        orden.push(grupo[0].equipo);
      } else {
        pendientes.push(...grupo.map(item => item.equipo));
      }
    });

    if (pendientes.length > 0) {
      texto += `<br>Hubo nuevo empate. Tiran de nuevo: ${pendientes.map(e => `${e.bandera} ${e.nombre}`).join(", ")}`;
    }
  }

  return {
    orden,
    texto
  };
}

function tirarDadoSimple() {
  return Math.floor(Math.random() * 6) + 1;
}

function agruparPor(lista, obtenerClave) {
  const grupos = {};

  lista.forEach(item => {
    const clave = obtenerClave(item);

    if (!grupos[clave]) {
      grupos[clave] = [];
    }

    grupos[clave].push(item);
  });

  return grupos;
}

function volverInicio() {
  document.getElementById("pantalla-juego").classList.add("hidden");
  document.getElementById("pantalla-inicio").classList.remove("hidden");
}
