import { useEffect, useRef, useState } from 'react';
import {
  ContactTabIcon,
  InstructionSheetIcon,
  MarginMarksIcon,
  NotebookHomeIcon,
  PaperTabIcon,
  PlayNotebookIcon,
  PrivacySheetIcon,
} from './PaperPlayIcons';

type MobileBottomNavProps = {
  pathname: string;
  onNavigate: (href: string) => void;
};

const mobileItems = [
  { label: 'Home', href: '/', Icon: NotebookHomeIcon, itemClass: 'home-item' },
  { label: 'How It Works', href: '/how-it-works', Icon: InstructionSheetIcon, itemClass: 'how-item' },
  { label: 'Play', href: '/games/flames', Icon: PlayNotebookIcon, itemClass: 'play-item' },
  { label: 'About', href: '/about', Icon: PaperTabIcon, itemClass: 'about-item' },
] as const;

const isPlayPath = (pathname: string) => pathname === '/games/flames' || pathname.startsWith('/games/');

export const MobileBottomNav = ({ pathname, onNavigate }: MobileBottomNavProps) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('pointerdown', closeOnOutsidePointer);
    };
  }, [moreOpen]);

  const navigate = (href: string) => {
    setMoreOpen(false);
    onNavigate(href);
  };

  const activeFor = (href: string) => href === '/games/flames' ? isPlayPath(pathname) : pathname === href;
  const moreActive = pathname === '/privacy' || pathname === '/contact';

  return (
    <nav ref={navRef} className="mobile-bottom-nav" aria-label="PAPERPLAY mobile navigation">
      <div className="mobile-more-sheet" id="paperplay-more-menu" aria-label="More PAPERPLAY links" hidden={!moreOpen}>
        <p className="mobile-more-title">More notes</p>
        <a href="/privacy" className="mobile-more-link" onClick={(event) => { event.preventDefault(); navigate('/privacy'); }}>
          <PrivacySheetIcon />
          <span>Privacy Policy</span>
        </a>
        <a href="/contact" className="mobile-more-link" onClick={(event) => { event.preventDefault(); navigate('/contact'); }}>
          <ContactTabIcon />
          <span>Contact</span>
        </a>
      </div>
      <div className="mobile-dock">
        <span className="mobile-dock-shelf" aria-hidden="true" />
        {mobileItems.map((item) => {
          const { label, href, Icon } = item;
          const active = activeFor(href);
          return (
            <a
              key={href}
              href={href}
              className={`mobile-nav-item ${item.itemClass}${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={(event) => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(href); }}
            >
              <span className="mobile-nav-icon"><Icon /></span>
              <span className="mobile-nav-label">{label}</span>
            </a>
          );
        })}
        <button
          type="button"
          className={`mobile-nav-item more-item${moreActive || moreOpen ? ' active' : ''}`}
          aria-label="More"
          aria-expanded={moreOpen}
          aria-controls="paperplay-more-menu"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span className="mobile-nav-icon"><MarginMarksIcon /></span>
          <span className="mobile-nav-label">More</span>
        </button>
      </div>
    </nav>
  );
};
