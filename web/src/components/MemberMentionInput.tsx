import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { api, type DiscordMember } from '../services/api';

const MENTION_TOKEN_RE = /<@!?(\d+)>/g;
const MAX_SUGGESTIONS = 5;

export interface MemberMentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

function extractMentionIds(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_TOKEN_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      ids.push(m[1]);
    }
  }
  return ids;
}

function getActiveMentionQuery(
  text: string,
  cursorPos: number
): { start: number; query: string } | null {
  const before = text.slice(0, cursorPos);
  const at = before.lastIndexOf('@');
  if (at === -1) return null;
  
  // Verificar si el @ está precedido por < (mención completa)
  if (at > 0 && before[at - 1] === '<') {
    // Verificar si es una mención ya completa: <@números>
    const afterAt = before.slice(at + 1);
    if (/^\d+>/.test(afterAt)) {
      return null; // Es una mención completa, no activar autocompletado
    }
  }
  
  // No activar si está precedido por una letra (email, etc)
  if (at > 0 && /\w/.test(before[at - 1]!)) return null;
  
  const afterAt = before.slice(at + 1);
  // No activar si hay espacios después del @
  if (/\s/.test(afterAt)) return null;
  
  return { start: at, query: afterAt };
}

function memberAvatarUrl(m: DiscordMember): string {
  try {
    if (m.avatar) {
      return `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=64`;
    }
    // Validar que el ID sea numérico antes de convertir a BigInt
    if (!/^\d+$/.test(m.id)) {
      // Si no es numérico, usar avatar por defecto
      return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
    const idx = Number((BigInt(m.id) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch (error) {
    return `https://cdn.discordapp.com/embed/avatars/0.png`;
  }
}

/** Viewport coordinates for fixed-position dropdown */
function getCaretViewportPosition(
  textarea: HTMLTextAreaElement,
  position: number
): { top: number; bottom: number; left: number; lineHeight: number } {
  let mirror: HTMLDivElement | null = null;
  try {
    mirror = document.createElement('div');
    const inner = document.createElement('div');
    const cs = window.getComputedStyle(textarea);
    const taRect = textarea.getBoundingClientRect();

    mirror.style.position = 'fixed';
    mirror.style.top = `${taRect.top}px`;
    mirror.style.left = `${taRect.left}px`;
    mirror.style.width = `${textarea.clientWidth}px`;
    mirror.style.height = `${textarea.clientHeight}px`;
    mirror.style.overflow = 'hidden';
    mirror.style.visibility = 'hidden';
    mirror.style.pointerEvents = 'none';
    mirror.style.zIndex = '-1';

    inner.style.whiteSpace = 'pre-wrap';
    inner.style.wordWrap = 'break-word';
    inner.style.boxSizing = cs.boxSizing;
    inner.style.fontFamily = cs.fontFamily;
    inner.style.fontSize = cs.fontSize;
    inner.style.fontWeight = cs.fontWeight;
    inner.style.lineHeight = cs.lineHeight;
    inner.style.letterSpacing = cs.letterSpacing;
    inner.style.padding = cs.padding;
    inner.style.border = cs.border;
    inner.style.width = '100%';
    inner.style.transform = `translateY(${-textarea.scrollTop}px)`;

    const before = document.createTextNode(textarea.value.slice(0, position));
    const caretProbe = document.createElement('span');
    caretProbe.textContent = textarea.value.slice(position) || '\u200b';
    inner.appendChild(before);
    inner.appendChild(caretProbe);
    mirror.appendChild(inner);
    document.body.appendChild(mirror);

    const probeRect = caretProbe.getBoundingClientRect();
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.55;

    document.body.removeChild(mirror);

    return {
      top: probeRect.top,
      bottom: probeRect.bottom,
      left: probeRect.left,
      lineHeight: lh,
    };
  } catch (error) {
    console.error('Error calculating caret position:', error);
    if (mirror && mirror.parentNode) {
      document.body.removeChild(mirror);
    }
    const taRect = textarea.getBoundingClientRect();
    return {
      top: taRect.top,
      bottom: taRect.bottom,
      left: taRect.left,
      lineHeight: 20,
    };
  }
}

function renderHighlightedChunks(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(MENTION_TOKEN_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<span key={`t-${last}`}>{text.slice(last, m.index)}</span>);
    }
    parts.push(
      <span key={`m-${m.index}`} className="text-[var(--bmw-interactive)]">
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(<span key={`t-${last}`}>{text.slice(last)}</span>);
  }
  return parts;
}

function filterMembers(members: DiscordMember[], query: string): DiscordMember[] {
  const q = query.trim().toLowerCase();
  const list =
    q.length === 0
      ? members
      : members.filter(
          (m) =>
            m.display_name.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.tag.toLowerCase().includes(q)
        );
  return list.slice(0, MAX_SUGGESTIONS);
}

export function MemberMentionInput({
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
}: MemberMentionInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropInnerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 320 });

  const suggestions = useMemo(
    () => filterMembers(members, mentionQuery),
    [members, mentionQuery]
  );

  const syncMentionUi = useCallback(
    (text: string, selectionStart: number) => {
      if (disabled) {
        setDropdownVisible(false);
        setMentionQuery('');
        return;
      }
      try {
        const ctx = getActiveMentionQuery(text, selectionStart);
        if (!ctx) {
          setDropdownVisible(false);
          setMentionQuery('');
          return;
        }
        setMentionQuery(ctx.query);
        const nextSuggestions = filterMembers(members, ctx.query);
        setDropdownVisible(nextSuggestions.length > 0);
        setHighlightIndex(0);
      } catch (error) {
        console.error('Error in syncMentionUi:', error);
        setDropdownVisible(false);
        setMentionQuery('');
      }
    },
    [disabled, members]
  );

  useEffect(() => {
    if (disabled) return;
    let cancelled = false;
    api
      .getMembers()
      .then((data) => {
        if (!cancelled) setMembers(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Error loading members:', error);
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [disabled]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || disabled) return;
    syncMentionUi(ta.value, ta.selectionStart);
  }, [disabled, members, syncMentionUi]);

  useEffect(() => {
    setHighlightIndex((i) =>
      suggestions.length === 0 ? 0 : Math.min(i, suggestions.length - 1)
    );
  }, [suggestions.length]);

  const updateDropdownPlacement = useCallback(() => {
    try {
      const ta = textareaRef.current;
      const wrap = wrapperRef.current;
      if (!ta || !wrap || !dropdownVisible) return;

      const ctx = getActiveMentionQuery(ta.value, ta.selectionStart);
      if (!ctx || filterMembers(members, ctx.query).length === 0) return;

      const caret = getCaretViewportPosition(ta, ta.selectionStart);
      const width = Math.max(240, wrap.getBoundingClientRect().width);
      const pad = 4;
      let top = caret.bottom + pad;
      let left = Math.min(caret.left, window.innerWidth - width - 8);
      left = Math.max(8, left);
      const maxH = 280;
      if (top + maxH > window.innerHeight) {
        top = Math.max(8, caret.top - maxH - pad);
      }
      setDropdownPos({ top, left, width });
    } catch (error) {
      console.error('Error in updateDropdownPlacement:', error);
      setDropdownVisible(false);
    }
  }, [dropdownVisible, members]);

  useLayoutEffect(() => {
    if (!dropdownVisible) return;
    updateDropdownPlacement();
  }, [dropdownVisible, value, mentionQuery, updateDropdownPlacement]);

  useEffect(() => {
    if (!dropdownVisible) return;

    const onScrollPass = () => updateDropdownPlacement();
    const onReposition = () => updateDropdownPlacement();

    window.addEventListener('scroll', onScrollPass, true);
    window.addEventListener('resize', onReposition);

    return () => {
      window.removeEventListener('scroll', onScrollPass, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [dropdownVisible, updateDropdownPlacement]);

  useEffect(() => {
    if (!dropdownVisible) return;

    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if (listRef.current?.contains(t)) return;
      setDropdownVisible(false);
      setMentionQuery('');
    };

    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [dropdownVisible]);

  const syncBackdropScroll = useCallback(() => {
    const ta = textareaRef.current;
    const inner = backdropInnerRef.current;
    if (!ta || !inner) return;
    inner.style.minHeight = `${ta.scrollHeight}px`;
    inner.style.transform = `translateY(${-ta.scrollTop}px)`;
  }, []);

  useLayoutEffect(() => {
    syncBackdropScroll();
  }, [value, syncBackdropScroll]);

  const emitChange = (next: string) => {
    onChange(next, extractMentionIds(next));
  };

  const insertMention = (member: DiscordMember) => {
    try {
      const ta = textareaRef.current;
      if (!ta || disabled) return;
      const ctx = getActiveMentionQuery(ta.value, ta.selectionStart);
      if (!ctx) return;

      const { start } = ctx;
      const cursor = ta.selectionStart;
      const current = ta.value;
      const before = current.slice(0, start);
      const after = current.slice(cursor);
      const insert = `<@${member.id}>`;
      let next = before + insert + after;
      if (maxLength !== undefined && next.length > maxLength) {
        next = next.slice(0, maxLength);
      }
      emitChange(next);
      setDropdownVisible(false);
      setMentionQuery('');

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        const pos = Math.min(before.length + insert.length, next.length);
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    } catch (error) {
      console.error('Error inserting mention:', error);
      setDropdownVisible(false);
      setMentionQuery('');
    }
  };

  const onChangeTextarea = (e: ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const next = e.target.value;
      if (maxLength !== undefined && next.length > maxLength) return;
      emitChange(next);
      syncMentionUi(next, e.target.selectionStart);
    } catch (error) {
      console.error('Error in onChangeTextarea:', error);
    }
  };

  const onSelectTextarea = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    syncMentionUi(ta.value, ta.selectionStart);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      if (dropdownVisible) {
        e.preventDefault();
        setDropdownVisible(false);
        setMentionQuery('');
      }
      return;
    }

    if (!dropdownVisible || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const pick = suggestions[highlightIndex];
      if (pick) insertMention(pick);
    }
  };

  const len = value.length;
  const countLabel =
    maxLength !== undefined ? (
      <div className="bmw-body-xs mt-1 text-right text-[var(--bmw-muted)] transition-opacity duration-200">
        {len} / {maxLength}
      </div>
    ) : null;

  const dropdown =
    dropdownVisible && suggestions.length > 0 ? (
      <div
        ref={listRef}
        role="listbox"
        className="bmw-card elevation-2 fixed z-[200] max-h-[280px] overflow-y-auto p-0 transition-[opacity,transform] duration-200 ease-out"
        style={{
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          backgroundColor: 'var(--bmw-surface-1)',
        }}
      >
        {suggestions.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="option"
            aria-selected={i === highlightIndex}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 ${
              i === highlightIndex
                ? 'bg-[var(--bmw-surface-strong)]'
                : 'bg-transparent hover:bg-[var(--bmw-surface-soft)]'
            }`}
            onMouseEnter={() => setHighlightIndex(i)}
            onMouseDown={(ev) => {
              ev.preventDefault();
              insertMention(m);
            }}
          >
            <img
              src={memberAvatarUrl(m)}
              alt=""
              className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <div className="bmw-title-sm truncate text-[var(--bmw-ink)]">{m.display_name}</div>
              <div className="bmw-body-xs truncate text-[var(--bmw-muted)]">
                {m.username}
                {m.tag ? ` · ${m.tag}` : ''}
              </div>
            </div>
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative min-h-[120px] w-full">
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-none border border-transparent"
          aria-hidden
        >
          <div
            ref={backdropInnerRef}
            className="bmw-input box-border min-h-[120px] whitespace-pre-wrap break-words border-transparent bg-[var(--bmw-surface-card)] px-[16px] py-[14px] text-[16px] font-light leading-[1.55] text-[var(--bmw-ink)]"
          >
            {value.length === 0 ? (
              <span className="text-[var(--bmw-muted-soft)]">{placeholder ?? '\u00a0'}</span>
            ) : (
              renderHighlightedChunks(value)
            )}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChangeTextarea}
          onSelect={onSelectTextarea}
          onKeyDown={onKeyDown}
          onScroll={syncBackdropScroll}
          onFocus={(e) => syncMentionUi(e.currentTarget.value, e.currentTarget.selectionStart)}
          placeholder={placeholder !== undefined && placeholder !== '' ? '' : undefined}
          aria-label={placeholder || 'Message'}
          maxLength={maxLength}
          disabled={disabled}
          rows={4}
          spellCheck={false}
          className="bmw-input relative z-10 min-h-[120px] w-full resize-y bg-transparent !h-auto text-transparent caret-[var(--bmw-ink)] transition-[border-color] duration-200 focus:border-[var(--bmw-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {countLabel}
      {typeof document !== 'undefined' && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
