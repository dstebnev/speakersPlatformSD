import { TAGS as DIRECTIONS } from './tags.js';
import { ACCENTS } from './constants.js';

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
    renderSummary(speakers, talks);
    renderCharts(speakers, talks);
  } catch (err) {
    document.querySelector('.stats-wrapper').innerText = 'Не удалось загрузить данные';
  }
}

function renderSummary(speakers, talks) {
  document.getElementById('total-speakers').textContent = speakers.length;
  document.getElementById('total-talks').textContent = talks.length;
}

function renderCharts(speakers, talks) {
  const talkCount = {};
  const speakerSets = {};
  const allSpeakers = new Set();
  DIRECTIONS.forEach(d => {
    talkCount[d] = 0;
    speakerSets[d] = new Set();
  });

  talks.forEach(t => {
    const tags = Array.isArray(t.tags) && t.tags.length ? t.tags : (t.direction ? [t.direction] : []);
    tags.forEach(tag => {
      if (talkCount[tag] !== undefined) {
        talkCount[tag]++;
        (t.speaker_ids || t.speakerIds || []).forEach(id => {
          speakerSets[tag].add(id);
          allSpeakers.add(id);
        });
      }
    });
  });

  const activeSpeakers = allSpeakers.size;
  const speakerCounts = DIRECTIONS.map(d => speakerSets[d].size);

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
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } }
    }
  });

  const ctx2 = document.getElementById('speakers-chart').getContext('2d');
  new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: DIRECTIONS,
      datasets: [{
        data: speakerCounts,
        backgroundColor: DIRECTIONS.map(d => ACCENTS[d] || '#ccc')
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });
}

loadData();
