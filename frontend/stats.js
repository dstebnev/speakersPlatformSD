import { DIRECTIONS } from './directions.js';

const ACCENTS = {
  frontend: '#4caf50',
  backend: '#795548',
  QA: '#9c27b0',
  mobile: '#ff9800',
  product: '#f44336',
  data: '#2196f3',
  manager: '#607d8b'
};

async function loadData() {
  try {
    const [speakersRes, talksRes] = await Promise.all([
      fetch('/api/speakers'),
      fetch('/api/talks')
    ]);
    if (!speakersRes.ok || !talksRes.ok) throw new Error('Fetch error');
    const [speakers, talks] = await Promise.all([
      speakersRes.json(),
      talksRes.json()
    ]);
    renderCharts(speakers, talks);
  } catch (err) {
    document.querySelector('.stats-wrapper').innerText = 'Не удалось загрузить данные';
  }
}

function renderCharts(speakers, talks) {
  const talkCount = {};
  const speakerSets = {};
  DIRECTIONS.forEach(d => {
    talkCount[d] = 0;
    speakerSets[d] = new Set();
  });

  talks.forEach(t => {
    if (talkCount[t.direction] !== undefined) {
      talkCount[t.direction]++;
      speakerSets[t.direction].add(t.speakerId);
    }
  });

  const activeSpeakers = DIRECTIONS.map(d => speakerSets[d].size);

  const ctx1 = document.getElementById('talks-chart').getContext('2d');
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: DIRECTIONS,
      datasets: [{
        data: DIRECTIONS.map(d => talkCount[d]),
        backgroundColor: DIRECTIONS.map(d => ACCENTS[d] || '#ccc')
      }]
    },
    options: {
      plugins: { legend: { display: false } }
    }
  });

  const ctx2 = document.getElementById('speakers-chart').getContext('2d');
  new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: DIRECTIONS,
      datasets: [{
        data: activeSpeakers,
        backgroundColor: DIRECTIONS.map(d => ACCENTS[d] || '#ccc')
      }]
    }
  });
}

loadData();
