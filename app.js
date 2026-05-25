function tirarDado() {
  const dado = Math.floor(Math.random() * 6) + 1;
  let resultado = "";

  if (dado <= 2) {
    resultado = "Ganó Equipo A";
  } else if (dado <= 4) {
    resultado = "Empate";
  } else {
    resultado = "Ganó Equipo B";
  }

  document.getElementById("dado").textContent = "🎲 " + dado;
  document.getElementById("resultado").textContent = resultado;
}
