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
let penalesFinal = null;

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
  penalesFinal = null;

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

  document.getElementById("pantalla-inicio").classList.add("hidden");
  document.getElementById("pantalla-juego").classList.remove("hidden");

  avanzarHastaPartidoManual();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function armarEquiposTorneo() {
  equiposTorneo = [];

  const equiposHumanos = jugadores.map(jugador => {
    return {
      nombre: jugador.seleccion,
      bandera: jugador.bandera,
      humano: true
    };
  });

  const equiposCPU = seleccionesBase
    .filter(seleccion => {
      return !equiposHumanos.some(equipo => equipo.nombre === seleccion.nombre);
    })
    .map(seleccion => {
      return {
        nombre: seleccion.nombre,
        bandera: seleccion.bandera,
        humano: false
      };
    });

  equiposTorneo = [...equiposHumanos, ...equiposCPU].slice(0, 16);
}

function armarGrupos() {
  const nombresGrupos = ["Grupo A", "Grupo B", "Grupo C", "Grupo D"];

  grupos = nombresGrupos.map(nombre => {
    return {
      nombre,
      equipos: [],
      ordenFinal: []
    };
  });

  const equiposHumanos = equiposTorneo.filter(equipo => equipo.humano);
  const equiposCPU = equiposTorneo.filter(equipo => !equipo.humano);

  // Reparte primero los equipos humanos: uno por grupo, en lo posible.
  equiposHumanos.forEach((equipo, index) => {
    const grupoIndex = index % grupos.length;

    grupos[grupoIndex].equipos.push({
      ...equipo,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      pts: 0
    });
  });

  // Completa cada grupo con equipos CPU hasta llegar a 4 equipos.
  grupos.forEach(grupo => {
    while (grupo.equipos.length < 4 && equiposCPU.length > 0) {
      const equipo = equiposCPU.shift();

      grupo.equipos.push({
        ...equipo,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        pts: 0
      });
    }
  });
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

function avanzarHastaPartidoManual() {
  const resumenAutomaticos = [];

  while (true) {
    if (faseActual === "grupos" && partidoActual >= fixture.length) {
      finalizarFaseGrupos(resumenAutomaticos);
      return;
    }

    if (faseActual === "cuartos" && partidoActual >= fixture.length) {
      armarSemifinales();
      continue;
    }

    if (faseActual === "semifinales" && partidoActual >= fixture.length) {
      armarFinal();
      continue;
    }

    const partido = fixture[partidoActual];

    if (!partido) {
      return;
    }

    if (partidoDebeSerManual(partido)) {
      mostrarPartidoActual(resumenAutomaticos);
      return;
    }

    const resumen = simularPartidoAutomatico(partido);
    resumenAutomaticos.push(resumen);
    partidoActual++;
  }
}

function partidoDebeSerManual(partido) {
  if (partido.fase === "Final") {
    return true;
  }

  return partidoTieneJugadorHumano(partido);
}

function partidoTieneJugadorHumano(partido) {
  return jugadores.some(jugador => {
    return jugador.seleccion === partido.equipoA.nombre ||
           jugador.seleccion === partido.equipoB.nombre;
  });
}

function simularPartidoAutomatico(partido) {
  if (partido.fase === "Grupo") {
    return simularPartidoGrupoAutomatico(partido);
  }

  return simularPartidoEliminatorioAutomatico(partido);
}

function simularPartidoGrupoAutomatico(partido) {
  const dado = tirarDadoSimple();

  const equipoA = buscarEquipoEnGrupo(partido.grupo, partido.equipoA.nombre);
  const equipoB = buscarEquipoEnGrupo(partido.grupo, partido.equipoB.nombre);

  let resumen = "";

  if (dado <= 2) {
    registrarVictoria(equipoA, equipoB);
    resumen = `${partido.grupo}: ${equipoA.bandera} ${equipoA.nombre} venció a ${equipoB.bandera} ${equipoB.nombre}`;
  } else if (dado <= 4) {
    registrarEmpate(equipoA, equipoB);
    resumen = `${partido.grupo}: ${equipoA.bandera} ${equipoA.nombre} empató con ${equipoB.bandera} ${equipoB.nombre}`;
  } else {
    registrarVictoria(equipoB, equipoA);
    resumen = `${partido.grupo}: ${equipoB.bandera} ${equipoB.nombre} venció a ${equipoA.bandera} ${equipoA.nombre}`;
  }

  mostrarTablasGrupos();

  return resumen;
}

function simularPartidoEliminatorioAutomatico(partido) {
  const dado = tirarDadoSimple();
  let ganador = null;
  let resumen = "";

  if (dado <= 2) {
    ganador = partido.equipoA;
    resumen = `${partido.fase}: ganó ${ganador.bandera} ${ganador.nombre}`;
  } else if (dado <= 4) {
    const penales = resolverPenales(partido.equipoA, partido.equipoB);
    ganador = penales.ganador;
    resumen = `${partido.fase}: empate y ganó por penales ${ganador.bandera} ${ganador.nombre}`;
  } else {
    ganador = partido.equipoB;
    resumen = `${partido.fase}: ganó ${ganador.bandera} ${ganador.nombre}`;
  }

  partido.ganador = ganador;
  return resumen;
}

function mostrarPartidoActual(resumenAutomaticos = []) {
  const partido = fixture[partidoActual];

  mostrarTablasGrupos();

  document.getElementById("numeroPartido").textContent =
    `${partido.fase} - Partido ${partidoActual + 1} de ${fixture.length}`;

  document.getElementById("nombreGrupo").textContent = partido.grupo;

  document.getElementById("banderaA").textContent = partido.equipoA.bandera;
  document.getElementById("equipoA").textContent = partido.equipoA.nombre;

  document.getElementById("banderaB").textContent = partido.equipoB.bandera;
  document.getElementById("equipoB").textContent = partido.equipoB.nombre;

  document.getElementById("dado").textContent = "🎲";

  if (resumenAutomaticos.length > 0) {
    document.getElementById("resultado").innerHTML = `
      <div class="auto-box">
        <strong>Se simularon ${resumenAutomaticos.length} partido(s) automáticos.</strong>
        <p>Ahora juega una selección elegida por un jugador.</p>
      </div>
    `;
  } else {
    document.getElementById("resultado").textContent = "Esperando tirada...";
  }

  const boton = document.getElementById("botonTirar");
  boton.classList.remove("hidden");
  boton.disabled = false;
  boton.textContent = "Tirar dado";

  document.getElementById("botonSiguiente").classList.add("hidden");

  partidoYaJugado = false;
}

async function tirarDado() {
  if (penalesFinal) {
    await tirarPenalFinalManual();
    return;
  }

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

  if (!penalesFinal) {
    boton.disabled = false;
    boton.textContent = "Tirar dado";
  }

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
    if (partido.fase === "Final") {
      iniciarPenalesFinalManual(partido, dado);
      return;
    }

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

function iniciarPenalesFinalManual(partido, dadoFinal) {
  penalesFinal = {
    partido,
    equipoA: partido.equipoA,
    equipoB: partido.equipoB,
    tirosA: [],
    tirosB: [],
    turno: "A",
    etapa: "cinco",
    ronda: 1
  };

  document.getElementById("dado").textContent = "🎲 " + dadoFinal;
  document.getElementById("resultado").innerHTML = `
    Empate en la final.<br>
    Ahora los penales son manuales.
    ${renderPenalesFinal()}
  `;

  document.getElementById("botonTirar").classList.remove("hidden");
  document.getElementById("botonTirar").disabled = false;
  document.getElementById("botonTirar").textContent =
    `Patea ${penalesFinal.equipoA.bandera} ${penalesFinal.equipoA.nombre}`;

  document.getElementById("botonSiguiente").classList.add("hidden");
  partidoYaJugado = false;
}

async function tirarPenalFinalManual() {
  if (animandoDado) {
    return;
  }

  animandoDado = true;

  const boton = document.getElementById("botonTirar");
  boton.disabled = true;
  boton.textContent = "Pateando...";

  await animarDado();

  patearPenalFinal();

  if (penalesFinal) {
    boton.disabled = false;
  }

  animandoDado = false;
}

function patearPenalFinal() {
  const dado = tirarDadoSimple();
  const gol = dado % 2 === 0;
  const tiro = { dado, gol };

  if (penalesFinal.turno === "A") {
    penalesFinal.tirosA.push(tiro);
    penalesFinal.turno = "B";
  } else {
    penalesFinal.tirosB.push(tiro);

    if (penalesFinal.etapa === "cinco") {
      if (penalesFinal.tirosB.length >= 5) {
        const golesA = contarGoles(penalesFinal.tirosA);
        const golesB = contarGoles(penalesFinal.tirosB);

        if (golesA > golesB) {
          finalizarPenalesFinal(penalesFinal.equipoA);
          return;
        }

        if (golesB > golesA) {
          finalizarPenalesFinal(penalesFinal.equipoB);
          return;
        }

        penalesFinal.etapa = "muerte";
        penalesFinal.ronda = 1;
      }

      penalesFinal.turno = "A";
    } else {
      const ultimoA = penalesFinal.tirosA[penalesFinal.tirosA.length - 1];
      const ultimoB = penalesFinal.tirosB[penalesFinal.tirosB.length - 1];

      if (ultimoA.gol && !ultimoB.gol) {
        finalizarPenalesFinal(penalesFinal.equipoA);
        return;
      }

      if (ultimoB.gol && !ultimoA.gol) {
        finalizarPenalesFinal(penalesFinal.equipoB);
        return;
      }

      penalesFinal.ronda++;
      penalesFinal.turno = "A";
    }
  }

  actualizarVistaPenalesFinal();
}

function actualizarVistaPenalesFinal() {
  document.getElementById("resultado").innerHTML = renderPenalesFinal();

  const equipoTurno = penalesFinal.turno === "A"
    ? penalesFinal.equipoA
    : penalesFinal.equipoB;

  document.getElementById("botonTirar").textContent =
    `Patea ${equipoTurno.bandera} ${equipoTurno.nombre}`;
}

function renderPenalesFinal() {
  const golesA = contarGoles(penalesFinal.tirosA);
  const golesB = contarGoles(penalesFinal.tirosB);

  const textoEtapa = penalesFinal.etapa === "cinco"
    ? "Serie de 5 penales"
    : "Muerte súbita";

  const equipoTurno = penalesFinal.turno === "A"
    ? penalesFinal.equipoA
    : penalesFinal.equipoB;

  return `
    <div class="penales-box">
      <p><strong>${textoEtapa}</strong></p>
      <p>
        <strong>${penalesFinal.equipoA.bandera} ${penalesFinal.equipoA.nombre}</strong>:
        ${formatearPenales(penalesFinal.tirosA)} = ${golesA}
      </p>
      <p>
        <strong>${penalesFinal.equipoB.bandera} ${penalesFinal.equipoB.nombre}</strong>:
        ${formatearPenales(penalesFinal.tirosB)} = ${golesB}
      </p>
      <p class="turno-penal">
        Turno de ${equipoTurno.bandera} ${equipoTurno.nombre}
      </p>
    </div>
  `;
}

function finalizarPenalesFinal(ganador) {
  penalesFinal.partido.ganador = ganador;
  campeon = ganador;

  document.getElementById("dado").textContent = "🏆";
  document.getElementById("resultado").innerHTML = `
    ${renderPenalesFinal()}
    <span class="campeon">🏆 Campeón: ${ganador.bandera} ${ganador.nombre}</span>
  `;

  document.getElementById("botonTirar").classList.add("hidden");
  document.getElementById("botonSiguiente").classList.add("hidden");
  document.getElementById("botonNuevoTorneo").classList.remove("hidden");
  document.getElementById("panelTablas").classList.add("hidden");

  penalesFinal = null;
  partidoYaJugado = true;
  faseActual = "finalizada";
}

function siguientePartido() {
  if (faseActual === "esperando-cuartos") {
    armarCuartos();
    avanzarHastaPartidoManual();
    return;
  }

  partidoActual++;
  avanzarHastaPartidoManual();
}

function finalizarFaseGrupos(resumenAutomaticos = []) {
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

  const textoAuto = resumenAutomaticos.length > 0
    ? `Se simularon ${resumenAutomaticos.length} partido(s) automáticos. `
    : "";

  document.getElementById("resultado").textContent =
    `${textoAuto}Ya están los 8 clasificados. Ahora empiezan los cuartos de final.`;

  document.getElementById("botonTirar").classList.add("hidden");
  document.getElementById("botonSiguiente").classList.remove("hidden");
  document.getElementById("botonSiguiente").textContent = "Comenzar cuartos de final";

  faseActual = "esperando-cuartos";
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
}

function armarSemifinales() {
  faseActual = "semifinales";
  partidoActual = 0;

  const ganadoresCuartos = fixture.map(partido => partido.ganador);

  fixture = [
    { fase: "Semifinales", grupo: "Semifinal 1", equipoA: ganadoresCuartos[0], equipoB: ganadoresCuartos[1] },
    { fase: "Semifinales", grupo: "Semifinal 2", equipoA: ganadoresCuartos[2], equipoB: ganadoresCuartos[3] }
  ];
}

function armarFinal() {
  faseActual = "final";
  partidoActual = 0;

  const ganadoresSemis = fixture.map(partido => partido.ganador);

  fixture = [
    { fase: "Final", grupo: "Gran Final", equipoA: ganadoresSemis[0], equipoB: ganadoresSemis[1] }
  ];
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
  if (tiros.length === 0) {
    return "—";
  }

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
function mostrarInfo() {
  document.getElementById("pantalla-inicio").classList.add("hidden");
  document.getElementById("pantalla-juego").classList.add("hidden");
  document.getElementById("pantalla-info").classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function ocultarInfo() {
  document.getElementById("pantalla-info").classList.add("hidden");
  document.getElementById("pantalla-inicio").classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}
