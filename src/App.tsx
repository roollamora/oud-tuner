import { useEffect, useRef, useState, useEffectEvent } from 'react';
import {
  TUNINGS,
  noteToFrequency,
  frequencyToNote,
  formatNote,
  type TuningPreset,
  type Course,
} from './tunings';
import { PitchMonitor, playReference } from './audio';
import './App.css';

type View = 'home' | 'tune';

function centsToNeedle(cents: number): number {
  return Math.max(-45, Math.min(45, cents * 0.9));
}

function statusLabel(cents: number | null, listening: boolean): string {
  if (!listening) return 'Mic off';
  if (cents === null) return 'Play a course…';
  if (Math.abs(cents) <= 5) return 'In tune';
  if (cents < 0) return 'Too low';
  return 'Too high';
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [tuningId, setTuningId] = useState(TUNINGS[0].id);
  const [selectedCourse, setSelectedCourse] = useState(0);
  const [listening, setListening] = useState(false);
  const [hz, setHz] = useState<number | null>(null);
  const [browseBy, setBrowseBy] = useState<'region' | 'genre'>('region');
  const [regionFilter, setRegionFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const monitor = useRef(new PitchMonitor());

  const tuning = TUNINGS.find((t) => t.id === tuningId) ?? TUNINGS[0];
  const course = tuning.courses[selectedCourse] ?? tuning.courses[0];
  const targetHz = noteToFrequency(course.note, course.octave);

  const cents =
    hz !== null
      ? Math.round(1200 * Math.log2(hz / targetHz))
      : null;

  const detected =
    hz !== null ? frequencyToNote(hz) : null;

  const onPitch = useEffectEvent((freq: number | null) => {
    setHz(freq);
  });

  useEffect(() => {
    return () => {
      void monitor.current.stop();
    };
  }, []);

  useEffect(() => {
    setSelectedCourse(0);
  }, [tuningId]);

  const filtered =
    browseBy === 'region'
      ? regionFilter === 'All'
        ? TUNINGS
        : TUNINGS.filter((t) => t.region === regionFilter)
      : genreFilter === 'All'
        ? TUNINGS
        : TUNINGS.filter((t) => t.genres.includes(genreFilter));

  const regions = [
    'All',
    ...Array.from(new Set(TUNINGS.map((t) => t.region))),
  ];

  const genres = [
    'All',
    ...Array.from(new Set(TUNINGS.flatMap((t) => t.genres))).sort(),
  ];

  async function toggleMic() {
    if (listening) {
      await monitor.current.stop();
      setListening(false);
      setHz(null);
      return;
    }
    try {
      await monitor.current.start(onPitch);
      setListening(true);
    } catch {
      setListening(false);
      alert(
        'Microphone access is required for live tuning. Please allow mic permission and try again.',
      );
    }
  }

  async function enterTuner(preset?: TuningPreset) {
    if (preset) setTuningId(preset.id);
    setView('tune');
  }

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {view === 'home' ? (
        <Home
          browseBy={browseBy}
          onBrowseBy={setBrowseBy}
          regions={regions}
          genres={genres}
          regionFilter={regionFilter}
          genreFilter={genreFilter}
          onRegion={setRegionFilter}
          onGenre={setGenreFilter}
          tunings={filtered}
          onSelect={enterTuner}
          onStart={() => enterTuner()}
        />
      ) : (
        <Tuner
          tuning={tuning}
          tunings={TUNINGS}
          course={course}
          selectedCourse={selectedCourse}
          onSelectCourse={setSelectedCourse}
          onSelectTuning={setTuningId}
          listening={listening}
          onToggleMic={toggleMic}
          cents={cents}
          hz={hz}
          targetHz={targetHz}
          detected={detected}
          onBack={() => {
            void monitor.current.stop();
            setListening(false);
            setHz(null);
            setView('home');
          }}
        />
      )}
    </div>
  );
}

function Home({
  browseBy,
  onBrowseBy,
  regions,
  genres,
  regionFilter,
  genreFilter,
  onRegion,
  onGenre,
  tunings,
  onSelect,
  onStart,
}: {
  browseBy: 'region' | 'genre';
  onBrowseBy: (mode: 'region' | 'genre') => void;
  regions: string[];
  genres: string[];
  regionFilter: string;
  genreFilter: string;
  onRegion: (r: string) => void;
  onGenre: (g: string) => void;
  tunings: TuningPreset[];
  onSelect: (t: TuningPreset) => void;
  onStart: () => void;
}) {
  const tabs = browseBy === 'region' ? regions : genres;
  const active = browseBy === 'region' ? regionFilter : genreFilter;
  const onTab = browseBy === 'region' ? onRegion : onGenre;

  return (
    <main className="home">
      <header className="hero">
        <p className="brand">
          <span className="brand-ar" lang="ar">
            ميزان
          </span>
          <span className="brand-en">Mizān</span>
        </p>
        <h1 className="headline">Tune the oud by place and tradition</h1>
        <p className="lede">
          Live pitch detection for Arabic, Turkish, Iraqi, Armenian, and Persian
          courses — choose a geography or genre, then match each string.
        </p>
        <div className="cta-row">
          <button type="button" className="btn primary" onClick={onStart}>
            Start tuning
          </button>
          <a className="btn ghost" href="#presets">
            Browse tunings
          </a>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <OudSilhouette />
        </div>
      </header>

      <section className="presets" id="presets">
        <div className="section-head">
          <h2>Geographies &amp; genres</h2>
          <p>Pick the tradition your instrument and repertoire call for.</p>
        </div>

        <div className="browse-mode" role="group" aria-label="Browse by">
          <button
            type="button"
            className={browseBy === 'region' ? 'mode active' : 'mode'}
            onClick={() => onBrowseBy('region')}
          >
            By geography
          </button>
          <button
            type="button"
            className={browseBy === 'genre' ? 'mode active' : 'mode'}
            onClick={() => onBrowseBy('genre')}
          >
            By genre
          </button>
        </div>

        <div className="region-tabs" role="tablist" aria-label="Filter tunings">
          {tabs.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={active === r}
              className={active === r ? 'tab active' : 'tab'}
              onClick={() => onTab(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <ul className="tuning-list">
          {tunings.map((t, i) => (
            <li key={t.id} style={{ animationDelay: `${i * 40}ms` }}>
              <button
                type="button"
                className="tuning-row"
                onClick={() => onSelect(t)}
              >
                <span className="tuning-meta">
                  <span className="tuning-name">{t.name}</span>
                  <span className="tuning-sub">
                    {t.region} · {t.genre}
                  </span>
                </span>
                <span className="tuning-notes" aria-hidden="true">
                  {t.courses.map((c) => c.note).join(' · ')}
                </span>
                <span className="tuning-go">Tune</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer className="site-foot">
        <p>
          A440 reference · courses listed bass → treble · use strings rated for
          your instrument’s tension
        </p>
      </footer>
    </main>
  );
}

function Tuner({
  tuning,
  tunings,
  course,
  selectedCourse,
  onSelectCourse,
  onSelectTuning,
  listening,
  onToggleMic,
  cents,
  hz,
  targetHz,
  detected,
  onBack,
}: {
  tuning: TuningPreset;
  tunings: TuningPreset[];
  course: Course;
  selectedCourse: number;
  onSelectCourse: (i: number) => void;
  onSelectTuning: (id: string) => void;
  listening: boolean;
  onToggleMic: () => void;
  cents: number | null;
  hz: number | null;
  targetHz: number;
  detected: { note: string; octave: number; cents: number } | null;
  onBack: () => void;
}) {
  const inTune = cents !== null && Math.abs(cents) <= 5;
  const needle = cents !== null ? centsToNeedle(cents) : 0;

  return (
    <main className="tuner">
      <header className="tuner-top">
        <button type="button" className="back" onClick={onBack}>
          ← Mizān
        </button>
        <label className="tuning-select-wrap">
          <span className="sr-only">Tuning preset</span>
          <select
            className="tuning-select"
            value={tuning.id}
            onChange={(e) => onSelectTuning(e.target.value)}
          >
            {tunings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.region}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="tuner-stage">
        <p className="tuner-genre">
          {tuning.region} · {tuning.genre}
        </p>
        <h1 className="tuner-title">{tuning.name}</h1>
        <p className="tuner-desc">{tuning.description}</p>
        {tuning.caution && <p className="caution">{tuning.caution}</p>}

        <div className={`gauge ${inTune ? 'in-tune' : ''} ${listening ? 'live' : ''}`}>
          <div className="gauge-arc" aria-hidden="true">
            <div
              className="needle"
              style={{ transform: `rotate(${needle}deg)` }}
            />
            <div className="gauge-center">
              <span className="target-note">
                {formatNote(course.note, course.octave)}
              </span>
              <span className="target-hz">{targetHz.toFixed(1)} Hz</span>
            </div>
          </div>
          <p className={`status ${inTune ? 'ok' : ''}`}>
            {statusLabel(cents, listening)}
          </p>
          <p className="readout">
            {listening && hz !== null && detected ? (
              <>
                Hearing {detected.note}
                {detected.octave} · {hz.toFixed(1)} Hz
                {cents !== null && (
                  <span className="cents">
                    {' '}
                    · {cents > 0 ? '+' : ''}
                    {cents} ¢
                  </span>
                )}
              </>
            ) : (
              <span className="muted">Waiting for sound</span>
            )}
          </p>
        </div>

        <div className="actions">
          <button
            type="button"
            className={`btn primary mic ${listening ? 'on' : ''}`}
            onClick={onToggleMic}
          >
            {listening ? 'Stop microphone' : 'Enable microphone'}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => void playReference(targetHz)}
          >
            Play reference
          </button>
        </div>

        <div className="courses" role="listbox" aria-label="String courses">
          {tuning.courses.map((c, i) => {
            const freq = noteToFrequency(c.note, c.octave);
            const active = i === selectedCourse;
            return (
              <div
                key={`${c.label}-${c.note}-${c.octave}`}
                className={`course ${active ? 'active' : ''}`}
                role="option"
                aria-selected={active}
              >
                <button
                  type="button"
                  className="course-select"
                  onClick={() => onSelectCourse(i)}
                >
                  <span className="course-label">{c.label}</span>
                  <span className="course-note">
                    {formatNote(c.note, c.octave)}
                  </span>
                  <span className="course-hz">{freq.toFixed(1)} Hz</span>
                </button>
                <button
                  type="button"
                  className="course-play"
                  onClick={() => void playReference(freq)}
                  aria-label={`Play ${formatNote(c.note, c.octave)}`}
                >
                  ♪
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function OudSilhouette() {
  return (
    <svg
      className="oud-svg"
      viewBox="0 0 640 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bowl" x1="80" y1="40" x2="420" y2="320">
          <stop stopColor="#6b4a2e" />
          <stop offset="0.55" stopColor="#8b5e34" />
          <stop offset="1" stopColor="#3d2a18" />
        </linearGradient>
        <linearGradient id="face" x1="200" y1="60" x2="380" y2="280">
          <stop stopColor="#e8d4a8" />
          <stop offset="1" stopColor="#c9a86c" />
        </linearGradient>
      </defs>
      {/* bowl */}
      <ellipse cx="260" cy="190" rx="170" ry="130" fill="url(#bowl)" />
      <ellipse cx="250" cy="185" rx="120" ry="95" fill="url(#face)" opacity="0.95" />
      {/* sound holes */}
      <ellipse cx="250" cy="175" rx="28" ry="22" fill="#2a1a0e" opacity="0.55" />
      <ellipse cx="200" cy="200" rx="10" ry="8" fill="#2a1a0e" opacity="0.4" />
      <ellipse cx="300" cy="200" rx="10" ry="8" fill="#2a1a0e" opacity="0.4" />
      {/* neck */}
      <rect x="400" y="168" width="160" height="28" rx="4" fill="#5c3d24" />
      <rect x="555" y="155" width="55" height="54" rx="6" fill="#3d2818" />
      {/* pegs */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i}
          cx={568 + (i % 2) * 18}
          cy={168 + Math.floor(i / 2) * 16}
          r="4"
          fill="#c4a574"
        />
      ))}
      {/* strings */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1="160"
          y1={155 + i * 10}
          x2="555"
          y2={175 + i * 3.5}
          stroke="#f5ecd7"
          strokeWidth="1"
          opacity="0.7"
        />
      ))}
    </svg>
  );
}
