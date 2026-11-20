import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { canOpenPath } from '@/auth/roles';

const SCREEN_LINKS = [
  { path: '/garson', label: 'Garson' },
  { path: '/mutfak', label: 'Mutfak' },
  { path: '/kasa', label: 'Kasa' },
  { path: '/yonetim', label: 'Yönetici' },
] as const;

type ScreenMenuProps = {
  tone?: 'floor' | 'shell';
};

export function ScreenMenu({ tone = 'shell' }: ScreenMenuProps) {
  const { role } = useAuth();
  const links = SCREEN_LINKS.filter((link) => canOpenPath(role, link.path));
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prefix = tone === 'floor' ? 'floor-menu' : 'shell-menu';

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (links.length < 2) {
    return null;
  }

  return (
    <div className={prefix} ref={menuRef}>
      <button
        className={tone === 'floor' ? 'floor-icon-btn' : 'btn btn-icon'}
        type="button"
        aria-label="Ekranlar"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ScreenIcon className={tone === 'floor' ? undefined : 'theme-icon'} />
      </button>
      {open ? (
        <nav className={`${prefix}-panel`} aria-label="Ekranlar">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `${prefix}-link${isActive ? ' is-current' : ''}`
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

function ScreenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4Zm9 0A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 13 9.5v-4ZM4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-4Zm9 0a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4Z"
      />
    </svg>
  );
}
