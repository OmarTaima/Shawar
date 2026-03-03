import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function ProductCard({
  id,
  title,
  price,
  image,
  selected,
  disabled,
  quantity = 0,
  onToggle,
  onInc,
  onDec,
}) {
  const [expanded, setExpanded] = useState(false);

  // lock body scroll when expanded and close on Escape
  useEffect(() => {
    if (expanded) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
      document.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener('keydown', onKey);
      };
    }
    return undefined;
  }, [expanded]);

  // ensure overlay doesn't open or stay open on desktop (lg and above)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return undefined;
      const mq = window.matchMedia ? window.matchMedia('(min-width:1024px)') : null;
      if (expanded && mq && mq.matches) {
        setExpanded(false);
      }
      const handler = (e) => { if (e.matches) setExpanded(false); };
      if (mq && mq.addEventListener) mq.addEventListener('change', handler);
      else if (mq && mq.addListener) mq.addListener(handler);
      return () => {
        if (mq && mq.removeEventListener) mq.removeEventListener('change', handler);
        else if (mq && mq.removeListener) mq.removeListener(handler);
      };
    } catch (err) {
      return undefined;
    }
  }, [expanded]);
  const handleKey = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle && onToggle(id);
    }
  };

  return (
    <div
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKey}
      onClick={(e) => { if (e.defaultPrevented) return; if (!disabled) onToggle && onToggle(id); }}
      className={`arabic relative rounded-xl border p-3 bg-white shadow-md transform transition-all duration-150 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#472500] ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-disabled={disabled}
      role="group"
      aria-label={`${title} - ${price} جنيه`}
      title={selected ? `محدد — ${quantity}x` : `اختر ${title}`}
    >
      <div className="flex items-center gap-3 lg:block">
        <div className="w-36 h-36 sm:w-40 sm:h-40 lg:w-full lg:h-36 overflow-hidden rounded-md flex-shrink-0">
            <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-200 ${expanded ? 'scale-105' : ''}`}
            loading="lazy"
            decoding="async"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (disabled) return;
              // On desktop (lg and above) clicking the photo should select the product
              if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width:1024px)').matches) {
                onToggle && onToggle(id);
                return;
              }
              setExpanded(true);
            }}
          />
        </div>

        <div className={`flex-1 transition-all duration-300 ${(expanded || selected) ? 'max-h-96' : 'max-h-20 overflow-hidden'} lg:max-h-none lg:overflow-visible`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-bold text-sm leading-tight">{title}</h4>
              <div className="text-xs text-neutral-500">{price} جنيه</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (!disabled) onToggle && onToggle(id); }}
              aria-pressed={selected}
              aria-label={selected ? `إلغاء اختيار ${title}` : `اختر ${title}`}
              disabled={disabled}
              className={`px-3 py-1 mt-3 rounded-full text-sm font-semibold transition ${selected ? 'bg-[#472500] text-white' : 'bg-white border text-neutral-800'}`}
            >
              {selected ? '✓' : 'اختر'}
            </button>
          </div>

          <div className="text-xs text-neutral-500 mt-2 lg:hidden">انقر للاختيار</div>

          {selected && (
            <div className="hidden lg:flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (!disabled) onDec && onDec(id); }}
                aria-label={`نقص ${title}`}
                disabled={disabled}
                className="p-1.5 bg-white border rounded-full disabled:opacity-60"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="font-semibold text-sm">{quantity}</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (!disabled) onInc && onInc(id); }}
                aria-label={`زيادة ${title}`}
                disabled={disabled}
                className="p-1.5 bg-white border rounded-full disabled:opacity-60"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile: show quantity controls on the left as an absolute group */}
        {selected && !expanded && (
          <div className="absolute left-3 bottom-3 flex items-center gap-2 bg-white/90 p-1 rounded shadow-lg lg:hidden">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (!disabled) onDec && onDec(id); }}
              aria-label={`نقص ${title}`}
              disabled={disabled}
              className="p-1 bg-white border rounded-full disabled:opacity-60"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="font-semibold text-sm">{quantity}</div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (!disabled) onInc && onInc(id); }}
              aria-label={`زيادة ${title}`}
              disabled={disabled}
              className="p-1 bg-white border rounded-full disabled:opacity-60"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quantity badge when selected */}
        {selected && (
          <div className="absolute top-2 left-2 bg-[#472500] text-white px-2 py-0.5 rounded-full text-xs font-bold">{quantity}</div>
        )}
      </div>

      {/* Full-page overlay when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(false)}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={image} alt={title} className="w-full h-auto max-h-[90vh] object-contain rounded-lg mx-auto" loading="eager" decoding="async" />
          </div>
        </div>
      )}
    </div>
  );
}
