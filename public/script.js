const socket = io();

let room = '';
let name = '';

const cards = document.querySelectorAll('.card');
const votesList = document.getElementById('votes');
const revealBtn = document.getElementById('reveal');
const resetBtn = document.getElementById('reset');
const averageEl = document.getElementById('average');

async function askInfo() {
    room = prompt("Oda ismi nedir?") || 'default';
    name = prompt("Adınızı girin:") || 'Anonim';

    socket.emit('joinRoom', { room, name });

    document.getElementById('cards').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
}

askInfo();

cards.forEach(card => {
    card.addEventListener('click', () => {
        socket.emit('vote', card.innerText);
    });
});

revealBtn.addEventListener('click', () => {
    socket.emit('reveal');
});

resetBtn.addEventListener('click', () => {
    socket.emit('reset');
});

socket.on('updateVotes', (data) => {
    const { votes, average } = data;

    votesList.innerHTML = '';
    votes.forEach(v => {
        const li = document.createElement('li');
        li.innerText = v;
        votesList.appendChild(li);
    });

    if (average !== null) {
        averageEl.innerText = `Ortalama: ${average}`;
    } else {
        averageEl.innerText = '';
    }
});