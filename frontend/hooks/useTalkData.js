const e = React.createElement;
const { useState, useEffect, useMemo } = React;

export function useTalkData(filters) {
  const [talks, setTalks] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [speakersRes, talksRes] = await Promise.all([
          fetch('/api/speakers'),
          fetch('/api/talks'),
        ]);
        if (!speakersRes.ok || !talksRes.ok) throw new Error('Fetch error');
        const [speakersData, talksData] = await Promise.all([
          speakersRes.json(),
          talksRes.json(),
        ]);
        if (!active) return;
        setSpeakers(speakersData);
        setTalks(talksData);
      } catch (err) {
        if (active) setError('Не удалось загрузить данные');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const {
      direction = 'all',
      status = 'all',
      query = '',
      speaker = '',
      from = '',
      to = '',
      event = '',
    } = filters || {};
    let list = talks.slice();
    if (direction !== 'all') list = list.filter(t => t.direction === direction);
    if (status !== 'all') list = list.filter(t => t.status === status);
    if (query)
      list = list.filter(t =>
        (t.title || '').toLowerCase().includes(query.toLowerCase())
      );
    if (speaker)
      list = list.filter(t => {
        const names = speakers
          .filter(s => (t.speakerIds || []).includes(s.id))
          .map(s => s.name.toLowerCase());
        return names.some(n => n.includes(speaker.toLowerCase()));
      });
    if (event) list = list.filter(t => t.eventName === event);
    if (from) list = list.filter(t => new Date(t.date) >= new Date(from));
    if (to) list = list.filter(t => new Date(t.date) <= new Date(to));
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
    return list;
  }, [talks, speakers, filters]);

  const now = new Date();
  const upcoming = filtered.filter(t => new Date(t.date) >= now);
  const past = filtered.filter(t => new Date(t.date) < now);
  const events = useMemo(
    () =>
      Array.from(new Set(talks.map(t => t.eventName).filter(Boolean))).sort(),
    [talks]
  );

  return { upcoming, past, speakers, events, loading, error };
}
