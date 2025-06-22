const socket = io();

const roomId = window.location.pathname.split('/').pop();
let isOwner = false;
let myRole = '';

const nameInput = document.getElementById('nameInput');
const roleInput = document.getElementById('roleInput');
const joinBtn = document.getElementById('joinBtn');
const joinArea = document.getElementById('joinArea');

const cards = document.querySelectorAll('.card-btn');
const cardsDiv = document.getElementById('cards');
const votesList = document.getElementById('votes');
const votesTitle = document.getElementById('votesTitle');
const playersList = document.getElementById('players');
const playersTitle = document.getElementById('playersTitle');
const revealBtn = document.getElementById('reveal');
const resetBtn = document.getElementById('reset');
const controlsDiv = document.getElementById('controls');

joinBtn.onclick = () => {
  const name = nameInput.value.trim();
  const role = roleInput.value;
  myRole = role;
  if (!name) {
    alert('Adınızı girin.');
    return;
  }

  socket.emit('joinRoom', { roomId, name, role });

  joinArea.style.display = 'none';
  cardsDiv.style.display = 'flex';

  playersTitle.style.display = 'block';
  playersList.style.display = 'block';
  votesTitle.style.display = 'block';
  votesList.style.display = 'block';

  // Eğer PO ise kart butonlarını disable et
  if (role === 'PO') {
    cards.forEach(card => {
      card.disabled = true;
    });
    controlsDiv.style.display = 'block'; // PO her zaman Kartları Aç + Yeni Tur görebilir
  }
};

cards.forEach(card => {
  card.addEventListener('click', () => {
    // PO seçim yapamaz
    if (myRole === 'PO') return;

    clearSelection();
    card.classList.add('selected');
    socket.emit('vote', card.innerText);
  });
});

revealBtn.onclick = () => {
  socket.emit('reveal');
};

resetBtn.onclick = () => {
  socket.emit('reset');
  clearSelection();
};

socket.on('ownerInfo', ({ isOwner: ownerStatus }) => {
  isOwner = ownerStatus;
  // PO zaten controlsDiv'i görüyor, diğer owner ise normal görür
  if (isOwner && myRole !== 'PO') {
    controlsDiv.style.display = 'block';
  }
});

socket.on('updatePlayers', (players) => {
  playersList.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.innerText = p.name;
    playersList.appendChild(li);
  });
});

socket.on('updateVotes', (votes) => {
  votesList.innerHTML = '';

  // ✅ 1) Product Owner'ları filtrele
  const filteredVotes = votes.filter(v => v.role !== 'PO');

  // ✅ 2) Gruplama
  const grouped = {};
  votes.forEach(v => {
    if (!grouped[v.role]) grouped[v.role] = [];
    grouped[v.role].push(v);
  });

  const customOrder = ['BE', 'FE', 'QA'];
  const roleLabels = {
    'Front End Developer': 'FE',
    'Back End Developer': 'BE',
    'QA': 'QA',
    'Product Owner': 'PO'
  };

  // ✅ 3) Öncelikli roller
  customOrder.forEach(role => {
    if (grouped[role]) {
      const header = document.createElement('h4');
      header.innerText = roleLabels[role] || role;
      votesList.appendChild(header);

      const ul = document.createElement('ul');
      ul.classList.add('list-group', 'mb-3');

      grouped[role].forEach(v => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.innerText = v.name + (v.vote !== null ? `: ${v.vote}` : '');
        ul.appendChild(li);
      });

      votesList.appendChild(ul);
    }
  });

  // ✅ 4) Diğer roller (PO zaten yok)
  Object.keys(grouped).forEach(role => {
    if (!customOrder.includes(role)) {
      const header = document.createElement('h4');
      header.innerText = roleLabels[role] || role;
      votesList.appendChild(header);

      const ul = document.createElement('ul');
      ul.classList.add('list-group', 'mb-3');

      grouped[role].forEach(v => {
        const li = document.createElement('li');
        li.classList.add('list-group-item');
        li.innerText = v.name + (v.vote !== null ? `: ${v.vote}` : '');
        ul.appendChild(li);
      });

      votesList.appendChild(ul);
    }
  });
});

socket.on('resetSelection', () => {
  clearSelection();
});

function clearSelection() {
  cards.forEach(c => c.classList.remove('selected'));
}