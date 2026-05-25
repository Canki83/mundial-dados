const seleccionesBase = [
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
  { nombre: "Japón", bandera: "🇯🇵" },
  { nombre: "Marruecos", bandera: "🇲🇦" },
  { nombre: "Colombia", bandera: "🇨🇴" },
  { nombre: "Croacia", bandera: "🇭🇷" },
  { nombre: "Países Bajos", bandera: "🇳🇱" }
];

let jugadores = [];
let equiposTorneo = [];
let grupos = [];
let fixture = [];
let partidoActual = 0;
let partidoYaJugado = false;
let faseActual = "grupos";
let clasificados = [];
let campeon = null;
let animandoDado = false;

document.addEventListener("DOMContentLoaded", () => {
  generarFormularioJugadores();
});

function generarFormularioJugadores() {
  const cantidad = Number(document.getElementById("cantidadJugadores").value);
  const contenedor = document.getElementById("jugadoresContainer");

  contenedor.innerHTML = "";

  for (let i = 1; i <= cantidad; i++) {
    const opcionesSelecciones = seleccionesBase.map((seleccion, index) => {
      return `<option value="${index}">${seleccion.bandera} ${seleccion.nombre}</option>`;
    }).join("");

    contenedor.innerHTML += `
      <div class="jugador-form">
        <h3>Jugador ${i}</h3>

        <label>Nombre</label>
        <input type="text" id="nombreJugador${i}" placeholder="Ej: Martín">

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
  equiposTorneo = [];
  grupos = [];
  fixture = [];
  clasificados = [];
  campeon = null;
  partidoActual = 0;
  partidoYaJugado = false;
  faseActual = "grupos";
  animandoDado = false;

  document.getElementById("botonNuevoTorneo").classList.add("hidden");
  document.getElementById("panelTablas").classList.remove("hidden");
  document.getElementById("panelClasificados").classList.add("hidden");
  document.getElementById("clasificados").innerHTML = "";
  document.getElementById("botonSiguiente").textContent = "Siguiente partido";

  for (let i = 1; i <= cantidad; i++) {
    const nombre = document.getElementById(`nombreJugador${i}`).value.trim();
    const seleccionIndex = Number(document.getElementById(`seleccionJugador${i}`).value);
    const seleccion = seleccionesBase[seleccionIndex];

    if (nombre === "") {
      alert(`Falta poner el nombre del Jugador ${i}`);
      return;
    }

    jugadores.push({
      nombre,
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

  armarEquiposTorneo();
  armarGrupos();
  armarFixtureGrupos();

  mostrarResumenJugadores();
  mostrarTablasGrupos();
  mostrarPartidoActual();

  document.getElementById("pantalla-inicio").classList.add("hidden");
  document.getElementById("pantalla-juego").classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function armarEquiposTorneo() {
  equiposTorneo = [];

  jugadores.forEach(jugador => {
    equiposTorneo.push({
      nombre: jugador.seleccion,
      bandera: jugador.bandera
    });
  });

  seleccionesBase.forEach(seleccion => {
    const yaEsta = equiposTorneo.some(equipo => equipo.nombre === seleccion.nombre);

    if (!yaEsta && equiposTorneo.length < 16) {
      equiposTorneo.push({
        nombre: seleccion.nombre,
        bandera: seleccion.bandera
      });
    }
  });
}

function armarGrupos() {
  const nombresGrupos = ["Grupo A", "Grupo B", "Grupo C", "Grupo D"];
  grupos = [];

  for (let i = 0; i < 4; i++) {
    const equiposGrupo = equiposTorneo.slice(i * 4, i * 4 + 4).map(equipo => {
      return {
        ...equipo,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        pts: 0
      };
    });

    grupos.push({
      nombre: nombresGrupos[i],
      equipos: equiposGrupo,
      ordenFinal: []
    });
  }
}

function armarFixtureGrupos() {
  fixture = [];

  grupos.forEach(grupo => {
    const e = grupo.equipos;

    fixture.push({ fase: "Grupo", grupo: grupo.nombre, equipoA: e[0], equipoB: e[1] });
    fixture.push({ fase: "Grupo", grupo: grupo.nombre, equipoA: e[2], equipoB: e[3] });
    fixture.push({ fase: "Grupo", grupo: grupo.nombre, equipoA: e[0], equipoB: e[2] });
    fixture.push({ fase: "Grupo", grupo: grupo.nombre, equipoA: e[1], equipoB: e[3] });
    fixture.push({ fase: "Grupo", grupo: grupo.nombre, equipoA: e[0], equipoB: e[3] });
    fixture.push({ fase: "Grupo", grupo: grupo.nombre, equipoA: e[1], equipoB: e[2] });
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
    `${partido.fase} - Partido ${partidoActual + 1} de ${fixture.length}`;

  document.getElementById("nombreGrupo").textContent = partido.grupo;

  document.getElementById("banderaA").textContent = partido.equipoA.bandera;
  document.getElementById("equipoA").textContent = partido.equipoA.nombre;

  document.getElementById("banderaB").textContent = partido.equipoB.bandera;
  document.getElementById("equipoB").textContent = partido.equipoB.nombre;

  document.getElementById("dado").textContent = "🎲";
  document.getElementById("resultado").textContent = "Esperando tirada...";

  document.getElementById("botonTirar").classList.remove("hidden");
  document.getElementById("botonTirar").disabled = false;
  document.getElementById("botonTirar").textContent = "Tirar dado";
  document.getElementById("botonSiguiente").classList.add("hidden");

  partidoYaJugado = false;
}

async function tirarDado() {
  if (partidoYaJugado || animandoDado) {
    return;
  }

  animandoDado = true;

  const boton = document.getElementById("botonTirar");
  boton.disabled = true;
  boton.textContent = "Girando dado...";

  await animarDado();

  if (faseActual === "grupos") {
    jugarPartidoGrupo();
  } else {
    jugarPartidoEliminatorio();
  }

  boton.disabled = false;
  boton.textContent = "Tirar dado";
  animandoDado = false;
}

function animarDado() {
  return new Promise(resolve => {
    const dadoElemento = document.getElementById("dado");
    const caras = ["🎲 1", "🎲 2", "🎲 3", "🎲 4", "🎲 5", "🎲 6"];

    let vueltas = 0;

    dadoElemento.classList.add("dado-animado");
    dadoElemento.textContent = "🎲";

    const intervalo = setInterval(() => {
      const caraAleatoria = caras[Math.floor(Math.random() * caras.length)];
      dadoElemento.textContent = caraAleatoria;

      vueltas++;

      if (vueltas >= 14) {
        clearInterval(intervalo);
        dadoElemento.classList.remove("dado-animado");
        resolve();
      }
    }, 70);
  });
}

function jugarPartidoGrupo() {
  const partido = fixture[partidoActual];
  const dado = tirarDadoSimple();
  let resultado = "";

  const equipoA = buscarEquipoEnGrupo(partido.grupo, partido.equipoA.nombre);
  const equipoB = buscarEquipoEnGrupo(partido.grupo, partido.equipoB.nombre);

  if (dado <= 2) {
    resultado = `Ganó ${equipoA.nombre}`;
    registrarVictoria(equipoA, equipoB);
  } else if (dado <= 4) {
    resultado = "Empate";
    registrarEmpate(equipoA, equipoB);
  } else {
    resultado = `Ganó ${equipoB.nombre}`;
    registrarVictoria(equipoB, equipoA);
  }

  document.getElementById("dado").textContent = "🎲 " + dado;
  document.getElementById("resultado").textContent = resultado;

  mostrarTablasGrupos();

  document.getElementById("botonTirar").classList.add("hidden");
  document.getElementById("botonSiguiente").classList.remove("hidden");

  partidoYaJugado = true;
}

function jugarPartidoEliminatorio() {
  const partido = fixture[partidoActual];
  const dado = tirarDadoSimple();
  let ganador = null;
  let htmlResultado = "";

  if (dado <= 2) {
    ganador = partido.equipoA;
    htmlResultado = `🎲 Salió ${dado}<br>Ganó ${ganador.bandera} ${ganador.nombre}`;
  } else if (dado <= 4) {
    const penales = resolverPenales(partido.equipoA, partido.equipoB);
    ganador = penales.ganador;
    htmlResultado = `
      🎲 Salió ${dado}<br>
      Empate. Definen por penales.
      ${penales.html}
      Ganó ${ganador.bandera} ${ganador.nombre}
    `;
  } else {
    ganador = partido.equipoB;
    htmlResultado = `🎲 Salió ${dado}<br>Ganó ${ganador.bandera} ${ganador.nombre}`;
  }

  partido.ganador = ganador;

  if (partido.fase === "Final") {
    campeon = ganador;
    htmlResultado += `<span class="campeon">🏆 Campeón: ${ganador.bandera} ${ganador.nombre}</span>`;
  }

  document.getElementById("dado").textContent = partido.fase === "Final" ? "🏆" : "🎲 " + dado;
  document.getElementById("resultado").innerHTML = htmlResultado;

  document.getElementById("botonTirar").classList.add("hidden");

  if (partido.fase === "Final") {
    document.getElementById("botonSiguiente").classList.add("hidden");
    document.getElementById("botonNuevoTorneo").classList.remove("hidden");
    document.getElementById("panelTablas").classList.add("hidden");
  } else {
    document.getElementById("botonSiguiente").classList.remove("hidden");
  }

  partidoYaJugado = true;
}

function siguientePartido() {
  partidoActual++;

  if (faseActual === "grupos" && partidoActual >= fixture.length) {
    finalizarFaseGrupos();
    return;
  }

  if (faseActual !== "grupos" && partidoActual >= fixture.length) {
    avanzarEliminatoria();
    return;
  }

  mostrarPartidoActual();
}

function finalizarFaseGrupos() {
  clasificados = [];

  grupos.forEach(grupo => {
    const resultadoOrden = ordenarGrupoPorPuntosYDados(grupo);
    grupo.ordenFinal = resultadoOrden.orden;

    clasificados.push(grupo.ordenFinal[0]);
    clasificados.push(grupo.ordenFinal[1]);
  });

  mostrarTablasGrupos();
  mostrarClasificados();

  document.getElementById("numeroPartido").textContent = "Fin de la fase de grupos";
  document.getElementById("nombreGrupo").textContent = "Clasificados definidos";
  document.getElementById("dado").textContent = "🏆";
  document.getElementById("resultado").textContent =
    "Ya están los 8 clasificados. Ahora empiezan los cuartos de final.";

  document.getElementById("botonTirar").classList.add("hidden");
  document.getElementById("botonSiguiente").classList.remove("hidden");
  document.getElementById("botonSiguiente").textContent = "Comenzar cuartos de final";

  faseActual = "esperando-cuartos";
}

function avanzarEliminatoria() {
  if (faseActual === "esperando-cuartos") {
    armarCuartos();
    return;
  }

  if (faseActual === "cuartos") {
    armarSemifinales();
    return;
  }

  if (faseActual === "semifinales") {
    armarFinal();
    return;
  }
}

function armarCuartos() {
  faseActual = "cuartos";
  partidoActual = 0;

  fixture = [
    { fase: "Cuartos", grupo: "Cuarto 1", equipoA: clasificados[0], equipoB: clasificados[3] },
    { fase: "Cuartos", grupo: "Cuarto 2", equipoA: clasificados[2], equipoB: clasificados[1] },
    { fase: "Cuartos", grupo: "Cuarto 3", equipoA: clasificados[4], equipoB: clasificados[7] },
    { fase: "Cuartos", grupo: "Cuarto 4", equipoA: clasificados[6], equipoB: clasificados[5] }
  ];

  document.getElementById("botonSiguiente").textContent = "Siguiente partido";
  mostrarPartidoActual();
}

function armarSemifinales() {
  faseActual = "semifinales";
  partidoActual = 0;

  const ganadoresCuartos = fixture.map(partido => partido.ganador);

  fixture = [
    { fase: "Semifinales", grupo: "Semifinal 1", equipoA: ganadoresCuartos[0], equipoB: ganadoresCuartos[1] },
    { fase: "Semifinales", grupo: "Semifinal 2", equipoA: ganadoresCuartos[2], equipoB: ganadoresCuartos[3] }
  ];

  mostrarPartidoActual();
}

function armarFinal() {
  faseActual = "final";
  partidoActual = 0;

  const ganadoresSemis = fixture.map(partido => partido.ganador);

  fixture = [
    { fase: "Final", grupo: "Gran Final", equipoA: ganadoresSemis[0], equipoB: ganadoresSemis[1] }
  ];

  mostrarPartidoActual();
}

function buscarEquipoEnGrupo(nombreGrupo, nombreEquipo) {
  const grupo = grupos.find(g => g.nombre === nombreGrupo);
  return grupo.equipos.find(equipo => equipo.nombre === nombreEquipo);
}

function registrarVictoria(ganador, perdedor) {
  ganador.pj++;
  ganador.g++;
  ganador.pts += 3;

  perdedor.pj++;
  perdedor.p++;
}

function registrarEmpate(equipoA, equipoB) {
  equipoA.pj++;
  equipoA.e++;
  equipoA.pts += 1;

  equipoB.pj++;
  equipoB.e++;
  equipoB.pts += 1;
}

function mostrarTablasGrupos() {
  const contenedor = document.getElementById("tablasGrupos");

  contenedor.innerHTML = grupos.map(grupo => {
    const equiposOrdenados = grupo.ordenFinal.length > 0
      ? grupo.ordenFinal
      : [...grupo.equipos].sort((a, b) => b.pts - a.pts);

    const filas = equiposOrdenados.map((equipo, index) => {
      const clasificado = grupo.ordenFinal.length > 0 && index < 2 ? "clasificado" : "";
      const marca = grupo.ordenFinal.length > 0 && index < 2 ? "✅ " : "";

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

    return `
      <div class="grupo-card">
        <h3>${grupo.nombre}</h3>
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>PJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join("");
}

function mostrarClasificados() {
  const panel = document.getElementById("panelClasificados");
  const contenedor = document.getElementById("clasificados");

  panel.classList.remove("hidden");

  contenedor.innerHTML = clasificados.map((equipo, index) => {
    return `
      <div class="jugador-card">
        <span>${equipo.bandera}</span>
        <strong>${equipo.nombre}</strong>
        <small>Clasificado ${index + 1}</small>
      </div>
    `;
  }).join("");
}

function ordenarGrupoPorPuntosYDados(grupo) {
  const gruposPorPuntos = agruparPor(grupo.equipos, equipo => equipo.pts);

  const puntosOrdenados = Object.keys(gruposPorPuntos)
    .map(Number)
    .sort((a, b) => b - a);

  let ordenFinal = [];

  puntosOrdenados.forEach(puntos => {
    const equiposEmpatados = gruposPorPuntos[puntos];

    if (equiposEmpatados.length === 1) {
      ordenFinal.push(equiposEmpatados[0]);
    } else {
      const resultadoDesempate = desempatarEquiposConDado(equiposEmpatados);
      ordenFinal.push(...resultadoDesempate);
    }
  });

  return {
    orden: ordenFinal
  };
}

function desempatarEquiposConDado(equipos) {
  const tiradas = equipos.map(equipo => {
    return {
      equipo,
      dado: tirarDadoSimple()
    };
  });

  const gruposPorDado = agruparPor(tiradas, item => item.dado);
  const dadosOrdenados = Object.keys(gruposPorDado)
    .map(Number)
    .sort((a, b) => b - a);

  let orden = [];

  dadosOrdenados.forEach(dado => {
    const grupo = gruposPorDado[dado];

    if (grupo.length === 1) {
      orden.push(grupo[0].equipo);
    } else {
      const equiposEmpatados = grupo.map(item => item.equipo);
      orden.push(...desempatarEquiposConDado(equiposEmpatados));
    }
  });

  return orden;
}

function resolverPenales(equipoA, equipoB) {
  const tirosA = patearCincoPenales();
  const tirosB = patearCincoPenales();

  const golesA = contarGoles(tirosA);
  const golesB = contarGoles(tirosB);

  let html = `
    <div class="penales-box">
      <p><strong>${equipoA.bandera} ${equipoA.nombre}</strong>: ${formatearPenales(tirosA)} = ${golesA}</p>
      <p><strong>${equipoB.bandera} ${equipoB.nombre}</strong>: ${formatearPenales(tirosB)} = ${golesB}</p>
  `;

  if (golesA > golesB) {
    html += `</div>`;
    return { ganador: equipoA, html };
  }

  if (golesB > golesA) {
    html += `</div>`;
    return { ganador: equipoB, html };
  }

  html += `<p>Empataron en penales. Van a muerte súbita.</p>`;

  const muerteSubita = resolverMuerteSubita(equipoA, equipoB);

  html += muerteSubita.html;
  html += `</div>`;

  return {
    ganador: muerteSubita.ganador,
    html
  };
}

function patearCincoPenales() {
  const tiros = [];

  for (let i = 0; i < 5; i++) {
    const dado = tirarDadoSimple();

    tiros.push({
      dado,
      gol: dado % 2 === 0
    });
  }

  return tiros;
}

function contarGoles(tiros) {
  return tiros.filter(tiro => tiro.gol).length;
}

function formatearPenales(tiros) {
  return tiros.map(tiro => {
    return tiro.gol ? `⚽(${tiro.dado})` : `❌(${tiro.dado})`;
  }).join(" ");
}

function resolverMuerteSubita(equipoA, equipoB) {
  let ronda = 1;
  let html = "";

  while (true) {
    const dadoA = tirarDadoSimple();
    const dadoB = tirarDadoSimple();

    const golA = dadoA % 2 === 0;
    const golB = dadoB % 2 === 0;

    html += `
      <p>
        Muerte súbita ${ronda}:
        ${equipoA.bandera} ${golA ? "⚽" : "❌"}(${dadoA})
        |
        ${equipoB.bandera} ${golB ? "⚽" : "❌"}(${dadoB})
      </p>
    `;

    if (golA && !golB) {
      return { ganador: equipoA, html };
    }

    if (golB && !golA) {
      return { ganador: equipoB, html };
    }

    ronda++;
  }
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
  window.scrollTo({ top: 0, behavior: "smooth" });
}
