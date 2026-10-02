const CHAVE_STORAGE = 'ultimaLocalizacao';

const elLat         = document.getElementById('lat');
const elLng         = document.getElementById('lng');
const elAccuracy    = document.getElementById('accuracy');
const elLastUpdate  = document.getElementById('lastUpdate');
const elStatus      = document.getElementById('status');
const elUltima      = document.getElementById('ultimaLocalizacao');
const elStatusBadge = document.getElementById('statusBadge');
const elStatusText  = document.getElementById('statusBadgeText');
const btnAtualizar  = document.getElementById('btnAtualizar');

let map, marker, accuracyCircle;

function initMap(center = [-14.2350, -51.9253], zoom = 4) {
  map = L.map('map', {
    center,
    zoom,
    zoomControl: true,
    attributionControl: true
  });

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

  const salvo = localStorage.getItem(CHAVE_STORAGE);
  if (salvo) {
    const dados = JSON.parse(salvo);
    const pos = [dados.lat, dados.lng];
    map.setView(pos, 16);
    colocarMarcador(pos, '📌 Última localização salva', dados.data);
  }
}

function colocarMarcador(pos, titulo = '📍 Você está aqui', subtitulo = '') {
  if (marker) map.removeLayer(marker);
  if (accuracyCircle) map.removeLayer(accuracyCircle);

  const iconeCustom = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-pulse"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14]
  });

  marker = L.marker(pos, { icon: iconeCustom }).addTo(map);

  const popupHtml = `
    <div style="font-weight:700;color:#60a5fa;margin-bottom:4px;">${titulo}</div>
    <div style="font-family:monospace;font-size:.8rem;">
      ${pos[0].toFixed(6)}, ${pos[1].toFixed(6)}
    </div>
    ${subtitulo ? `<div style="margin-top:4px;color:#9ca3af;font-size:.75rem;">${subtitulo}</div>` : ''}
  `;
  marker.bindPopup(popupHtml).openPopup();

  if (window.__ultimaPrecisao) {
    accuracyCircle = L.circle(pos, {
      radius: window.__ultimaPrecisao,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);
  }
}

function setStatusBadge(texto, erro = false) {
  elStatusText.textContent = texto;
  elStatusBadge.classList.toggle('erro', erro);
}

function capturarLocalizacao() {
  elStatus.textContent = '📡 Buscando sua localização...';
  btnAtualizar.disabled = true;
  setStatusBadge('Buscando...');

  if (!navigator.geolocation) {
    elStatus.textContent = '❌ Geolocalização não suportada.';
    setStatusBadge('Não suportado', true);
    btnAtualizar.disabled = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (posicao) => {
      const lat = posicao.coords.latitude;
      const lng = posicao.coords.longitude;
      const acc = posicao.coords.accuracy;
      const pos = [lat, lng];

      elLat.textContent = lat.toFixed(6);
      elLng.textContent = lng.toFixed(6);
      elAccuracy.textContent = `${acc.toFixed(0)} m`;
      elLastUpdate.textContent = new Date().toLocaleTimeString('pt-BR');

      window.__ultimaPrecisao = acc;

      if (map) {
        map.setView(pos, 16);
        colocarMarcador(pos, '📍 Sua localização atual', `Precisão: ~${acc.toFixed(0)}m`);
      }

      elStatus.textContent = '✅ Localização capturada com sucesso!';
      setStatusBadge('Conectado');

      salvarLocalizacao(lat, lng);
      btnAtualizar.disabled = false;
    },
    (erro) => {
      let msg = 'Erro desconhecido.';
      switch (erro.code) {
        case erro.PERMISSION_DENIED:    msg = '❌ Permissão negada pelo usuário.'; break;
        case erro.POSITION_UNAVAILABLE: msg = '❌ Localização indisponível.';      break;
        case erro.TIMEOUT:              msg = '⏱️ Tempo esgotado ao buscar.';      break;
      }
      elStatus.textContent = msg;
      setStatusBadge('Desconectado', true);
      btnAtualizar.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function salvarLocalizacao(lat, lng) {
  const dados = { lat, lng, data: new Date().toLocaleString('pt-BR') };
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
  mostrarUltimaLocalizacao();
}

function mostrarUltimaLocalizacao() {
  const salvo = localStorage.getItem(CHAVE_STORAGE);
  if (salvo) {
    const dados = JSON.parse(salvo);
    elUltima.innerHTML = `
      <div class="saved-card-header">
        <span class="icon">📌</span>
        <h3>Última localização salva</h3>
      </div>
      <div class="saved-card-coords">${dados.lat.toFixed(6)}, ${dados.lng.toFixed(6)}</div>
      <div class="saved-card-date">Salva em ${dados.data}</div>
    `;
    elUltima.classList.add('visivel');
  } else {
    elUltima.classList.remove('visivel');
    elUltima.innerHTML = '';
  }
}

const papel   = document.getElementById('papel');
const lixeira = document.getElementById('lixeira');

papel.addEventListener('dragstart', (e) => {
  papel.classList.add('dragging');
  e.dataTransfer.setData('text/plain', 'papel');
  e.dataTransfer.effectAllowed = 'move';
});

papel.addEventListener('dragend', () => {
  papel.classList.remove('dragging');
  lixeira.classList.remove('hover');
});

lixeira.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  lixeira.classList.add('hover');
});

lixeira.addEventListener('dragleave', () => lixeira.classList.remove('hover'));

lixeira.addEventListener('drop', (e) => {
  e.preventDefault();
  lixeira.classList.remove('hover');
  lixeira.classList.add('ativa');
  setTimeout(() => lixeira.classList.remove('ativa'), 500);

  const tinhaDados = !!localStorage.getItem(CHAVE_STORAGE);
  localStorage.removeItem(CHAVE_STORAGE);

  elUltima.classList.remove('visivel');
  elUltima.innerHTML = '';

  if (marker) { map.removeLayer(marker); marker = null; }
  if (accuracyCircle) { map.removeLayer(accuracyCircle); accuracyCircle = null; }

  if (tinhaDados) {
    elStatus.textContent = '🗑️ Dados de localização apagados!';
    mostrarToast('✅', 'Localização apagada com sucesso!');
  } else {
    mostrarToast('⚠️', 'Não havia nada para apagar.');
  }
});

const toast      = document.getElementById('toast');
const toastIcon  = document.getElementById('toastIcon');
const toastText  = document.getElementById('toastText');
let toastTimer;

function mostrarToast(icon, texto) {
  toastIcon.textContent = icon;
  toastText.textContent = texto;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// 7. INICIALIZAÇÃO
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  initMap();
  mostrarUltimaLocalizacao();
  capturarLocalizacao();
});

btnAtualizar.addEventListener('click', capturarLocalizacao);