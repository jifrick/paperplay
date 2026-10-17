import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, ChevronDown, Download, ExternalLink, Gauge, Hash,
  Heart, Info, Menu, Pencil, Play, RotateCcw, Share2, ShieldCheck, SkipForward,
  Sparkles, Undo2, Users, X,
} from 'lucide-react';
import { NotebookNameField } from './components/NotebookNameField';
import { PhysicalNotebook } from './components/PhysicalNotebook';
import type { NotebookState } from './components/PhysicalNotebook';
import { calculateFlames, FLAMES_MEANINGS } from './games/flames/calculateFlames';
import { RESULT_COPY, MODE_LABELS } from './games/flames/flames.copy';
import { FlamesMode, FlamesResult } from './games/flames/flames.types';
import { calculateNameNumber, NameNumberCalculation } from './games/name-number/calculateNameNumber';
import { calculateLoveMeter, LoveMeterCalculation } from './games/love-meter/calculateLoveMeter';
import { matchLetterOccurrences } from './lib/matchLetterOccurrences';
import { segmentGraphemes } from './lib/normalizeName';
import { downloadResultCard } from './lib/downloadCard';
import { getChallengeUrl, shareResult } from './lib/share';

type Route = { path: string; query: URLSearchParams };
type GameId = 'flames' | 'name-number' | 'love-meter';
type Calculation = FlamesResult | NameNumberCalculation | LoveMeterCalculation;
type HistoryEntry = { first: string; second: string };

const GAME_PATHS: Record<GameId, string> = {
  flames: '/games/flames',
  'name-number': '/games/name-number',
  'love-meter': '/games/love-meter',
};

const GAME_INFO: Record<GameId, { title: string; eyebrow: string; description: string; icon: typeof Heart; accent: string }> = {
  flames: { title: 'FLAMES Classic', eyebrow: 'A notebook classic', description: 'Write two names, then let the page count the matching letters.', icon: Heart, accent: 'coral' },
  'name-number': { title: 'Name Number', eyebrow: 'A1Z26, notebook style', description: 'Turn every A–Z letter into a number and add up a transparent, deterministic score.', icon: Hash, accent: 'lavender' },
  'love-meter': { title: 'Love Meter', eyebrow: 'A playful score out of 100', description: 'Blend letter overlap with name-length balance for a completely fictional notebook reading.', icon: Gauge, accent: 'rose' },
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Play Games', href: '/games/flames' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
];

const getRoute = (): Route => {
  if (typeof window === 'undefined') return { path: '/', query: new URLSearchParams() };
  return { path: window.location.pathname.replace(/\/$/, '') || '/', query: new URLSearchParams(window.location.search) };
};

const useRoute = () => {
  const [route, setRoute] = useState<Route>(getRoute);
  useEffect(() => {
    const onPopState = () => setRoute(getRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const navigate = (href: string) => {
    window.history.pushState({}, '', href);
    setRoute(getRoute());
    if (typeof window.scrollTo === 'function') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* Some test/browser shells do not implement scrolling. */ }
    }
  };
  return { route, navigate };
};

const isGameId = (path: string): path is `/games/${GameId}` => Object.values(GAME_PATHS).includes(path);

const Link = ({ href, children, className = '', onNavigate }: { href: string; children: React.ReactNode; className?: string; onNavigate: (href: string) => void }) => (
  <a className={className} href={href} onClick={(event) => { if (event.button !== 0 || event.metaKey || event.ctrlKey) return; event.preventDefault(); onNavigate(href); }}>{children}</a>
);

const AppHeader = ({ onNavigate, pathname }: { onNavigate: (href: string) => void; pathname: string }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className={`site-header ${pathname === GAME_PATHS.flames ? 'flames-header' : ''}`}>
      <div className="header-inner">
        <Link href="/" onNavigate={onNavigate} className="brand" aria-label="PAPERPLAY home">
          <span className="brand-mark"><BookOpen size={18} strokeWidth={2.5} /></span>
          <span>PAPERPLAY</span>
        </Link>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => <Link key={item.href} href={item.href} onNavigate={(href) => { setMenuOpen(false); onNavigate(href); }} className={pathname === item.href || (item.href === '/games/flames' && pathname.startsWith('/games/')) ? 'active' : ''}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link href="/games/flames" onNavigate={onNavigate} className={`header-cta ${pathname === GAME_PATHS.flames ? 'notebook-button' : ''}`}>Play now <ArrowRight size={15} /></Link>
          <button className={`icon-button mobile-menu ${pathname === GAME_PATHS.flames ? 'notebook-button' : ''}`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
    </header>
  );
};

const Footer = ({ onNavigate }: { onNavigate: (href: string) => void }) => (
  <footer className="site-footer">
    <div className="footer-main">
      <div><Link href="/" onNavigate={onNavigate} className="brand footer-brand"><span className="brand-mark"><BookOpen size={17} /></span><span>PAPERPLAY</span></Link><p>Open a page. Write two names. Play like old times.</p></div>
      <div className="footer-links"><div><strong>Explore</strong><Link href="/games/flames" onNavigate={onNavigate}>Play Games</Link><Link href="/how-it-works" onNavigate={onNavigate}>How It Works</Link></div><div><strong>About</strong><Link href="/about" onNavigate={onNavigate}>Our little notebook</Link><Link href="/privacy" onNavigate={onNavigate}>Privacy</Link></div></div>
    </div>
    <div className="footer-bottom"><span>Made for harmless fun and very serious doodles.</span><span>© {new Date().getFullYear()} PAPERPLAY</span></div>
  </footer>
);

const PaperPage = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <div className={`paper-page ${className}`}>{children}</div>;

const GameCard = ({ game, onNavigate, featured = false }: { game: GameId; onNavigate: (href: string) => void; featured?: boolean }) => {
  const info = GAME_INFO[game];
  const Icon = info.icon;
  return <article className={`game-card accent-${info.accent} ${featured ? 'featured' : ''}`}>
    <div className="game-card-top"><span className="game-icon"><Icon size={21} /></span>{featured && <span className="featured-label"><Sparkles size={13} /> Most played</span>}</div>
    <p className="eyebrow">{info.eyebrow}</p><h3>{info.title}</h3><p>{info.description}</p>
    <Link href={GAME_PATHS[game]} onNavigate={onNavigate} className="text-link">Play this page <ArrowRight size={16} /></Link>
  </article>;
};

const HomePage = ({ onNavigate }: { onNavigate: (href: string) => void }) => {
  const [notebookState, setNotebookState] = useState<NotebookState>('closed');
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timers = [
      window.setTimeout(() => setNotebookState('opening'), 250),
      window.setTimeout(() => setNotebookState('open'), 1450),
      window.setTimeout(() => setNotebookState('flipping'), 2050),
      window.setTimeout(() => setNotebookState('closing'), 3250),
      window.setTimeout(() => setNotebookState('closed'), 5050),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);
  const openNotebook = (destination = '/games/flames') => {
    onNavigate(destination);
  };

  return <>
    <section className="cover-section">
       <div className="cover-copy"><span className="pill"><span className="pill-dot" /> A tiny digital notebook of games</span><h1>Remember when a name could change your whole <em>afternoon?</em></h1><p className="hero-lede">PAPERPLAY brings the scribbled margins, crossed-out letters, and big reveals of childhood notebook games to your screen.</p><div className="hero-actions"><button className="primary-button large" onClick={() => openNotebook()}><BookOpen size={19} /> Open notebook <ArrowRight size={17} /></button><Link href="/how-it-works" onNavigate={onNavigate} className="subtle-link">See how it works <ArrowRight size={15} /></Link></div><p className="hero-note"><ShieldCheck size={15} /> Runs in your browser. No account. Just for fun.</p></div>
       <div className={`cover-art is-${notebookState}`}><div className="doodle doodle-star">✦</div><div className="hero-doodles" aria-hidden="true"><span className="doodle-heart">♡</span><span className="doodle-cross">A̶ + B̶</span><span className="doodle-math">2 + 2 = ?</span><span className="doodle-pencil">— — ✎</span></div><PhysicalNotebook state={notebookState} /></div>
    </section>
      <section className="home-intro"><div><span className="section-kicker">Pick a page</span><h2>Three ways to make two names <em>a little more interesting.</em></h2></div><p>From the classic schoolyard calculation to new PAPERPLAY inventions, every game is transparent, deterministic, and delightfully unserious.</p></section>
      <section className="game-grid" aria-label="PAPERPLAY games"><GameCard game="flames" onNavigate={() => openNotebook(GAME_PATHS.flames)} featured /><GameCard game="name-number" onNavigate={() => openNotebook(GAME_PATHS['name-number'])} /><GameCard game="love-meter" onNavigate={() => openNotebook(GAME_PATHS['love-meter'])} /></section>
     <section className="disclaimer-banner"><Info size={18} /><p><strong>A note from the margin:</strong> These games are entertainment, not science, prophecy, or relationship advice. The fun is in the ritual.</p></section>
   </>;
};

const InfoPage = ({ kind, onNavigate }: { kind: 'how' | 'about' | 'privacy'; onNavigate: (href: string) => void }) => {
  const content = {
    how: { kicker: 'The rules, out in the open', title: <>How the <em>notebook</em> works</>, intro: 'Every calculation happens right here in your browser. No mysterious black boxes—just the same small rituals, written down clearly.' },
    about: { kicker: 'A little corner of the internet', title: <>Made for the <em>margin doodlers</em></>, intro: 'PAPERPLAY is a digital collection of the notebook games that made ordinary school days feel like an event.' },
    privacy: { kicker: 'A promise in pencil', title: <>Your names stay <em>on the page</em></>, intro: 'PAPERPLAY is designed to be a tiny, private, browser-only experience.' },
  }[kind];
  return <PaperPage className="info-page"><span className="section-kicker">{content.kicker}</span><h1>{content.title}</h1><p className="info-intro">{content.intro}</p>
    {kind === 'how' && <HowItWorks />}{kind === 'about' && <About />}{kind === 'privacy' && <Privacy />}
    <div className="info-cta"><p>Ready to write a name?</p><button className="primary-button" onClick={() => onNavigate('/games/flames')}>Open a game <ArrowRight size={16} /></button></div>
  </PaperPage>;
};

const HowItWorks = () => <div className="prose-grid">
  <article className="prose-card"><span className="numbered">01</span><h2>FLAMES Classic</h2><p>We normalize the two names into letter graphemes, pair matching occurrences one-to-one, and count only what is left. If the count is N, we circle through F, L, A, M, E, S, removing the Nth surviving letter until one remains.</p><div className="flames-key">{(['F', 'L', 'A', 'M', 'E', 'S'] as const).map((letter) => <span key={letter}><b>{letter}</b>{FLAMES_MEANINGS[letter]}</span>)}</div></article>
  <article className="prose-card"><span className="numbered">02</span><h2>Name Number</h2><p>For this PAPERPLAY original, A = 1 through Z = 26. Spaces and punctuation are ignored, every letter's value is shown, and the two subtotals are added. Non-A–Z-only names are explained instead of guessed.</p></article>
  <article className="prose-card"><span className="numbered">03</span><h2>Love Meter</h2><p>This fictional score combines overlap (80%) and length balance (20%): <code>round(100 × (0.8 × M / max(A,B) + 0.2 × min(A,B) / max(A,B)))</code>. It is a name game, not a measure of compatibility.</p></article>
</div>;

const About = () => <div className="prose-grid single-column"><article className="prose-card"><h2>The brief history of a very important question</h2><p>Someone writes two names. Someone else reaches for a pencil. Matching letters become tiny crossed-out secrets, and suddenly the back of a notebook is the most exciting place in the world.</p><p>PAPERPLAY keeps that feeling without pretending the result knows anything about real life. It is a tactile little ritual for friends, crushes, fictional couples, and anyone who likes a good reveal.</p><div className="quote-card">“The answer was probably already in the notebook.”<span>— an extremely unofficial schoolyard philosopher</span></div></article></div>;
const Privacy = () => <div className="prose-grid single-column"><article className="prose-card"><h2>What happens to a name?</h2><ul className="check-list"><li><Check size={17} /><span>Core calculations happen entirely in your browser.</span></li><li><Check size={17} /><span>Your names are not stored by default, sent to AI APIs, or logged by PAPERPLAY.</span></li><li><Check size={17} /><span>Names do not go in result URLs. Sharing only happens after you choose it.</span></li><li><Check size={17} /><span>The optional download card is generated locally in your browser.</span></li></ul><p>There are no accounts, databases, analytics scripts, or third-party trackers in this initial release. If that changes, this page will say so plainly.</p></article></div>;

export const App = () => {
  const { route, navigate } = useRoute();
  const pageTitle = route.path === '/' ? 'PAPERPLAY — Nostalgic notebook games' : route.path.includes('how-it-works') ? 'How It Works — PAPERPLAY' : route.path.includes('privacy') ? 'Privacy — PAPERPLAY' : route.path.includes('about') ? 'About — PAPERPLAY' : isGameId(route.path) ? `${GAME_INFO[route.path.split('/').pop() as GameId].title} — PAPERPLAY` : 'Page not found — PAPERPLAY';
  const pageDescription = route.path === '/' ? 'PAPERPLAY brings nostalgic school notebook games to life. Write two names and play like old times.' : route.path.includes('how-it-works') ? 'Learn the transparent, deterministic rules behind PAPERPLAY notebook games.' : route.path.includes('privacy') ? 'PAPERPLAY runs core calculations in your browser and does not store names by default.' : route.path.includes('about') ? 'Meet PAPERPLAY, a playful digital collection of childhood notebook games.' : isGameId(route.path) ? `${GAME_INFO[route.path.split('/').pop() as GameId].description} Just for entertainment.` : 'Turn the page back to PAPERPLAY.';
  useEffect(() => {
    document.title = pageTitle;
    let description = document.querySelector('meta[name="description"]');
    if (!description) { description = document.createElement('meta'); description.setAttribute('name', 'description'); document.head.appendChild(description); }
    description.setAttribute('content', pageDescription);
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
    ogTitle.setAttribute('content', pageTitle);
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) { ogDescription = document.createElement('meta'); ogDescription.setAttribute('property', 'og:description'); document.head.appendChild(ogDescription); }
    ogDescription.setAttribute('content', pageDescription);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', new URL(route.path, window.location.origin).toString());
  }, [pageDescription, pageTitle, route.path]);
  let content: React.ReactNode;
  if (route.path === '/') content = <HomePage onNavigate={navigate} />;
  else if (isGameId(route.path)) content = <GamePage game={route.path.split('/').pop() as GameId} onNavigate={navigate} query={route.query} />;
  else if (route.path === '/how-it-works') content = <InfoPage kind="how" onNavigate={navigate} />;
  else if (route.path === '/about') content = <InfoPage kind="about" onNavigate={navigate} />;
  else if (route.path === '/privacy') content = <InfoPage kind="privacy" onNavigate={navigate} />;
  else content = <PaperPage className="not-found"><span className="section-kicker">Page turned too far</span><h1>That page is <em>blank.</em></h1><p>Let’s turn back to the notebook.</p><button className="primary-button" onClick={() => navigate('/')}>Back home <ArrowRight size={16} /></button></PaperPage>;
  return <div className="app-shell"><AppHeader onNavigate={navigate} pathname={route.path} /><main>{content}</main><Footer onNavigate={navigate} /></div>;
};

const ModeSelector = ({ mode, onChange }: { mode: FlamesMode; onChange: (mode: FlamesMode) => void }) => <fieldset className={`mode-selector mode-${mode}`}>
  <legend>Choose a mood <span>It changes the copy, never the calculation.</span></legend>
   <div className="mode-options">{(['crush', 'friendship', 'fictional'] as FlamesMode[]).map((value) => <button type="button" key={value} className={`notebook-button mood-button ${mode === value ? 'selected' : ''}`} aria-pressed={mode === value} onClick={() => onChange(value)}><span className="mode-icon">{value === 'crush' ? <Heart size={16} /> : value === 'friendship' ? <Users size={16} /> : <Sparkles size={16} />}</span>{MODE_LABELS[value]}{mode === value && <Check size={15} />}</button>)}</div>
</fieldset>;

const LetterTiles = ({ value, matchedIndexes, label }: { value: string; matchedIndexes: Set<number>; label: string }) => <div className="letter-line" aria-label={`${label}: ${value || 'empty'}`}>
  {segmentGraphemes(value.trim().normalize('NFC')).map((character, index) => {
    const isLetter = /^\p{L}/u.test(character);
    const matched = isLetter && matchedIndexes.has(index);
    return <span className={`letter-tile ${matched ? 'matched' : 'unmatched'} ${isLetter ? '' : 'non-letter'}`} key={`${index}-${character}`} title={isLetter ? matched ? 'Matched occurrence' : 'Unmatched letter' : 'Ignored character'}>{character || '·'}{isLetter && <span className="tile-mark" aria-hidden="true">{matched ? '×' : '•'}</span>}</span>;
  })}
</div>;

const MatchingBreakdown = ({ first, second }: { first: string; second: string }) => {
  const matches = useMemo(() => matchLetterOccurrences(first, second), [first, second]);
  const firstMatched = new Set(matches.matchedPairs.map((pair) => pair.first.sourceIndex));
  const secondMatched = new Set(matches.matchedPairs.map((pair) => pair.second.sourceIndex));
  return <section className="breakdown-card" aria-labelledby="matching-breakdown-title"><div className="breakdown-heading"><div><span className="section-kicker">The pencil work</span><h2 id="matching-breakdown-title">Cross out what matches</h2></div><span className="count-badge">{matches.totalUnmatchedCount} left</span></div><div className="matching-board"><div><span className="row-label">{first.trim() || 'First name'}</span><LetterTiles value={first} matchedIndexes={firstMatched} label="First name letters" /></div><div><span className="row-label">{second.trim() || 'Second name'}</span><LetterTiles value={second} matchedIndexes={secondMatched} label="Second name letters" /></div></div><div className="match-stats"><span><b>{matches.matchedPairCount}</b> matched pairs</span><span><b>{matches.matchedOccurrenceCount}</b> matched occurrences</span><span><b>{matches.totalUnmatchedCount}</b> remaining letters</span></div></section>;
};

const CalculationDetails = ({ children, open = false }: { children: React.ReactNode; open?: boolean }) => <details className="calculation-details" open={open}><summary>Calculation details <ChevronDown size={17} /></summary><div>{children}</div></details>;

const ResultActions = ({ game, names, summary, mode, onNavigate, onReset, onChangeNames, onToast }: { game: GameId; names: { first: string; second: string }; summary: { result: string; message: string; detail: string }; mode?: FlamesMode; onNavigate: (href: string) => void; onReset: () => void; onChangeNames: () => void; onToast: (message: string) => void }) => {
  const [hideNames, setHideNames] = useState(false);
  const handleShare = async () => {
    const outcome = await shareResult({ title: `${GAME_INFO[game].title} — PAPERPLAY`, text: `${summary.result}${summary.message ? ` ${summary.message}` : ''}`, url: getChallengeUrl(GAME_PATHS[game], game === 'flames' ? mode : undefined) });
    if (outcome === 'cancelled') return;
    onToast(outcome === 'shared' ? 'Share sheet opened.' : outcome === 'copied' ? 'Result copied to your clipboard.' : outcome === 'manual' ? 'Your result is ready to copy.' : 'Sharing was unavailable. Try downloading the card.');
  };
  const handleDownload = async () => {
    try { await downloadResultCard({ game: GAME_INFO[game].title, names: hideNames ? undefined : `${names.first.trim()} + ${names.second.trim()}`, result: summary.result, message: summary.message, detail: summary.detail }); onToast('Result card downloaded.'); }
    catch { onToast('The result card could not be exported in this browser.'); }
  };
  return <div className="result-actions"><label className="hide-names"><input type="checkbox" checked={hideNames} onChange={(event) => setHideNames(event.target.checked)} /> Hide names on card</label><div className="action-row"><button type="button" className="notebook-button primary-button" onClick={handleShare}><Share2 size={16} /> Share result</button><button type="button" className="notebook-button secondary-button" onClick={handleDownload}><Download size={16} /> Download card</button></div><div className="action-row secondary-actions"><button type="button" className="notebook-button text-button" onClick={onReset}><RotateCcw size={15} /> Play again</button><button type="button" className="notebook-button text-button" onClick={onChangeNames}><Pencil size={15} /> Change names</button><button type="button" className="notebook-button text-button" onClick={() => onNavigate('/')}><ExternalLink size={15} /> Try another game</button></div></div>;
};

const FlamesResultView = ({ result, first, second, visibleRounds, reducedMotion, onSkip, onReset, onChangeNames, onNavigate, onToast }: { result: FlamesResult; first: string; second: string; visibleRounds: number; reducedMotion: boolean; onSkip: () => void; onReset: () => void; onChangeNames: () => void; onNavigate: (href: string) => void; onToast: (message: string) => void }) => {
  if (result.status === 'zero-count') return <section className="result-card zero-result" aria-live="polite"><span className="result-stamp">No elimination needed</span><h2>Every letter matched!</h2><p>{result.edgeCaseMessage}</p><MatchingBreakdown first={first} second={second} /><ResultActions game="flames" names={{ first, second }} summary={{ result: 'Every letter matched!', message: result.edgeCaseMessage ?? '', detail: 'Zero unmatched letters; no FLAMES result was fabricated.' }} mode={result.mode} onNavigate={onNavigate} onReset={onReset} onChangeNames={onChangeNames} onToast={onToast} /></section>;
  const copy = RESULT_COPY[result.mode][result.category!];
  const roundsToShow = reducedMotion ? result.rounds : result.rounds.slice(0, visibleRounds);
  return <section className="result-card flames-result" aria-live="polite"><div className="result-heading"><span className="result-stamp">The surviving letter</span><div className="surviving-letter">{result.finalLetter}</div><p className="result-category">{result.category}</p><h2>{copy}</h2></div><MatchingBreakdown first={first} second={second} /><div className="elimination-card"><div className="breakdown-heading"><div><span className="section-kicker">Circular elimination</span><h2>Watch the notebook count</h2></div><span className="count-badge">N = {result.remainingCount}</span></div><div className="flames-strip">{(['F', 'L', 'A', 'M', 'E', 'S'] as const).map((letter) => <span key={letter} className={letter === result.finalLetter ? 'survives' : ''}>{letter}<small>{FLAMES_MEANINGS[letter]}</small></span>)}</div><div className="round-list">{roundsToShow.map((round, index) => <div className="round-row" key={`${index}-${round.removed}`}><span className="round-number">{String(index + 1).padStart(2, '0')}</span><span>From <b>{round.lettersBefore.join(' · ')}</b>, count {round.count} from position {round.startingIndex + 1}.</span><strong>cross out {round.removed}</strong></div>)}</div>{visibleRounds < result.rounds.length && !reducedMotion && <button className="notebook-button skip-button" type="button" onClick={onSkip}><SkipForward size={15} /> Skip animation · show all steps</button>}</div><p className="entertainment-note"><Info size={15} /> Just a name game — not a real measure of compatibility.</p><ResultActions game="flames" names={{ first, second }} summary={{ result: `${result.finalLetter} — ${result.category}`, message: copy, detail: `${result.matchedPairs.length} matched pairs; ${result.remainingCount} letters entered the elimination.` }} mode={result.mode} onNavigate={onNavigate} onReset={onReset} onChangeNames={onChangeNames} onToast={onToast} /></section>;
};

const NumberResultView = ({ result, first, second, onReset, onChangeNames, onNavigate, onToast }: { result: NameNumberCalculation; first: string; second: string; onReset: () => void; onChangeNames: () => void; onNavigate: (href: string) => void; onToast: (message: string) => void }) => <section className="result-card" aria-live="polite"><span className="result-stamp">Name Number</span><div className="number-result"><div><span className="result-category">{result.category}</span><h2>{result.combinedScore}</h2><p>combined notebook points</p></div><div className="score-columns"><ScoreColumn name={first} letters={result.first.letters} score={result.first.score} /><ScoreColumn name={second} letters={result.second.letters} score={result.second.score} /></div></div><CalculationDetails open><p><b>{first.trim()}</b> adds {result.first.score}; <b>{second.trim()}</b> adds {result.second.score}. Combined: {result.first.score} + {result.second.score} = {result.combinedScore}. {result.combinedScore} ÷ 5 leaves remainder {result.categoryIndex}, which selects “{result.category}”.</p></CalculationDetails>{result.unsupportedCharacters && <p className="input-note"><Info size={14} /> Only A–Z letters receive values; other characters were left out of this subtotal.</p>}<p className="entertainment-note"><Info size={15} /> A1Z26 is a PAPERPLAY invention for entertainment, not a personality test.</p><ResultActions game="name-number" names={{ first, second }} summary={{ result: `${result.combinedScore} points · ${result.category}`, message: 'A transparent A1Z26 notebook score.', detail: `${result.first.score} + ${result.second.score} = ${result.combinedScore}` }} onNavigate={onNavigate} onReset={onReset} onChangeNames={onChangeNames} onToast={onToast} /></section>;

const ScoreColumn = ({ name, letters, score }: { name: string; letters: Array<{ character: string; value: number }>; score: number }) => <div className="score-column"><span>{name.trim()}</span><div className="value-letters">{letters.map((letter, index) => <span key={`${letter.character}-${index}`}><b>{letter.character}</b><small>{letter.value}</small></span>)}</div><strong>{score}</strong><small>subtotal</small></div>;

const LoveMeterResultView = ({ result, first, second, onReset, onChangeNames, onNavigate, onToast }: { result: LoveMeterCalculation; first: string; second: string; onReset: () => void; onChangeNames: () => void; onNavigate: (href: string) => void; onToast: (message: string) => void }) => <section className="result-card" aria-live="polite"><span className="result-stamp">Love Meter</span><div className="meter-result"><div className="meter-circle" style={{ '--score': result.score } as React.CSSProperties}><strong>{result.score}</strong><span>/ 100</span></div><div><span className="result-category">{result.band.label}</span><h2>A page full of possibilities.</h2><p>Two names, one completely fictional notebook score.</p></div></div><CalculationDetails><p>There are {result.matchedPairs} matched pairs across {result.firstLength} and {result.secondLength} scorable letters. Overlap contributes 80%; length balance contributes 20%. The rounded result is <b>{result.score}</b>.</p></CalculationDetails>{result.unsupportedCharacters && <p className="input-note"><Info size={14} /> The Love Meter scores A–Z letters only; other characters were left out of the formula.</p>}<p className="entertainment-note"><Info size={15} /> Just a name game — not a real measure of compatibility.</p><ResultActions game="love-meter" names={{ first, second }} summary={{ result: `${result.score}/100 · ${result.band.label}`, message: 'A page full of possibilities.', detail: `${result.matchedPairs} matched pairs, ${result.firstLength}/${result.secondLength} scorable letters` }} onNavigate={onNavigate} onReset={onReset} onChangeNames={onChangeNames} onToast={onToast} /></section>;

const GamePage = ({ game, onNavigate, query }: { game: GameId; onNavigate: (href: string) => void; query: URLSearchParams }) => {
  const info = GAME_INFO[game];
  const [names, setNames] = useState({ first: '', second: '' });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeField, setActiveField] = useState<'first' | 'second'>('first');
  const requestedMode = query.get('mode');
  const initialMode: FlamesMode = requestedMode === 'friendship' || requestedMode === 'fictional' ? requestedMode : 'crush';
  const [mode, setMode] = useState<FlamesMode>(initialMode);
  const [result, setResult] = useState<Calculation | null>(null);
  const [error, setError] = useState('');
  const [visibleRounds, setVisibleRounds] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [toast, setToast] = useState('');
  const firstInput = useRef<HTMLTextAreaElement>(null);
  const secondInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (game !== 'flames' || !result || !('rounds' in result) || result.status !== 'complete') { setVisibleRounds(0); return; }
    if (reducedMotion) { setVisibleRounds(result.rounds.length); return; }
    let current = 0;
    setVisibleRounds(0);
    const timer = window.setInterval(() => { current += 1; setVisibleRounds(current); if (current >= result.rounds.length) window.clearInterval(timer); }, 420);
    return () => window.clearInterval(timer);
  }, [game, result, reducedMotion]);

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(timer); }, [toast]);

  const updateName = (field: 'first' | 'second', value: string) => {
    if (value === names[field]) return;
    setHistory((past) => [...past.slice(-19), names]);
    setNames((current) => ({ ...current, [field]: value }));
    setResult(null); setError('');
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((past) => past.slice(0, -1)); setNames(previous); setResult(null); setError('');
  };
  const reset = () => { setHistory([]); setNames({ first: '', second: '' }); setResult(null); setError(''); setActiveField('first'); window.setTimeout(() => firstInput.current?.focus(), 0); };
  const changeNames = () => { setResult(null); setError(''); setActiveField('first'); window.setTimeout(() => firstInput.current?.focus(), 0); };
  const calculate = () => {
    setError('');
    const calculation = game === 'flames' ? calculateFlames(names.first, names.second, mode) : game === 'name-number' ? calculateNameNumber(names.first, names.second) : calculateLoveMeter(names.first, names.second);
    if ('error' in calculation) { setResult(null); setError(calculation.error); return; }
    setResult(calculation); setToast('Calculation ready — the notebook has spoken.');
  };
  const renderResult = () => {
    if (!result) return null;
    if (game === 'flames' && 'rounds' in result) return <FlamesResultView result={result} first={names.first} second={names.second} visibleRounds={visibleRounds} reducedMotion={reducedMotion} onSkip={() => setVisibleRounds(result.rounds.length)} onReset={reset} onChangeNames={changeNames} onNavigate={onNavigate} onToast={setToast} />;
    if (game === 'name-number' && 'combinedScore' in result) return <NumberResultView result={result as NameNumberCalculation} first={names.first} second={names.second} onReset={reset} onChangeNames={changeNames} onNavigate={onNavigate} onToast={setToast} />;
    if (game === 'love-meter' && 'band' in result) return <LoveMeterResultView result={result as LoveMeterCalculation} first={names.first} second={names.second} onReset={reset} onChangeNames={changeNames} onNavigate={onNavigate} onToast={setToast} />;
    return null;
  };
  const Icon = info.icon;
  const firstName = useMemo(() => names.first ? matchLetterOccurrences(names.first, '').first : null, [names.first]);
  const secondName = useMemo(() => names.second ? matchLetterOccurrences(names.second, '').first : null, [names.second]);
  return <PaperPage className={`game-page game-${game} accent-${info.accent}`}>
     <div className="game-breadcrumb"><button type="button" className="notebook-button back-link" onClick={() => onNavigate('/')}><ArrowRight size={15} className="back-arrow" /> All games</button><span> / {info.title}</span></div>
     <div className="game-heading"><div><span className="section-kicker"><Icon size={15} /> {info.eyebrow}</span><h1>{info.title}</h1><p>{info.description}</p></div><span className="page-number">p. {game === 'flames' ? '01' : game === 'name-number' ? '02' : '03'}</span></div>
    <form className="game-form" onSubmit={(event) => { event.preventDefault(); calculate(); }} noValidate>
       
       <div className="name-inputs"><NotebookNameField id={`${game}-first-name`} label="First name" value={names.first} active={activeField === 'first'} reducedMotion={reducedMotion} inputRef={firstInput} onFocus={() => setActiveField('first')} onChange={(value) => updateName('first', value)} onEnter={calculate} /><div className="plus-mark" aria-hidden="true">+</div><NotebookNameField id={`${game}-second-name`} label="Second name" value={names.second} active={activeField === 'second'} reducedMotion={reducedMotion} inputRef={secondInput} onFocus={() => setActiveField('second')} onChange={(value) => updateName('second', value)} onEnter={calculate} /></div>
      {(firstName?.hasUnsupportedCharacters || secondName?.hasUnsupportedCharacters) && <p className="input-note"><Info size={14} /> Spaces and punctuation are ignored. Symbols and emoji are shown for context but do not count; {game === 'name-number' || game === 'love-meter' ? 'this page scores A–Z letters only.' : 'letter graphemes are matched one at a time.'}</p>}
        <div className="tool-bar compact-tools"><div className="tool-buttons"><button type="button" className="notebook-button tool-button" onClick={undo} disabled={!history.length}><Undo2 size={16} /> Undo</button><button type="button" className="notebook-button tool-button" onClick={reset}><RotateCcw size={16} /> Reset</button></div></div>
       <div className="form-submit"><button type="submit" className="notebook-button primary-button large"><Play size={17} fill="currentColor" /> Calculate {game === 'flames' ? 'FLAMES' : 'result'} <ArrowRight size={17} /></button><span>Press Enter anytime. You can edit names after a result.</span></div>
      {error && <p className="form-error" role="alert"><X size={16} /> {error}</p>}
    </form>
    {result && <div className="result-area">{renderResult()}</div>}
    {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
  </PaperPage>;
};
