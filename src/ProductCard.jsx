import React from 'react';
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
      onClick={() => { if (!disabled) onToggle && onToggle(id); }}
      className={`relative rounded-xl border p-3 bg-white shadow-md transform transition-all duration-150 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#2f83aa] ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-disabled={disabled}
      role="group"
      aria-label={`${title} - ${price} جنيه`}
      title={selected ? `محدد — ${quantity}x` : `اختر ${title}`}
    >
      <div className="relative w-full h-36 overflow-hidden rounded-md mb-3">
        <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${selected ? 'bg-green-500 text-white' : 'bg-white text-neutral-800 border'}`}>
          {selected ? 'محدد' : `${price} جنيه`}
        </div>

        {/* Selected overlay */}
        {selected && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <div className="bg-white/10 text-white px-3 py-1 rounded-full font-bold text-lg">✓</div>
          </div>
        )}
      </div>

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
          className={`px-3 py-1 rounded-full text-sm font-semibold transition ${selected ? 'bg-[#2f83aa] text-white' : 'bg-white border text-neutral-800'}`}
        >
          {selected ? '✓' : 'اختر'}
        </button>
      </div>

      {selected ? (
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!disabled) onDec && onDec(id); }}
            aria-label={`نقص ${title}`}
            disabled={disabled}
            className="p-2 bg-white border rounded-full disabled:opacity-60"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="font-semibold">{quantity}</div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!disabled) onInc && onInc(id); }}
            aria-label={`زيادة ${title}`}
            disabled={disabled}
            className="p-2 bg-white border rounded-full disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-xs text-neutral-500 mt-2">انقر للاختيار</div>
      )}
      {/* Quantity badge when selected */}
      {selected && (
        <div className="absolute top-2 left-2 bg-[#2f83aa] text-white px-2 py-0.5 rounded-full text-xs font-bold">{quantity}</div>
      )}
    </div>
  );
}
