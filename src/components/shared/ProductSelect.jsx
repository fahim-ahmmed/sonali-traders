"use client";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";

export default function ProductSelect({
  value = "",
  selectedProduct = null,
  onSelect,
  categoryId,
  label = "Product",
  placeholder = "Search product",
  error,
  disabled = false,
  inputProps = {},
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(selectedProduct);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const closeTimer = useRef(null);

  useEffect(() => {
    if (selectedProduct && selectedProduct.id === value) setSelected(selectedProduct);
    else if (!value) setSelected(null);
  }, [value, selectedProduct]);

  useEffect(() => {
    if (!value || selected?.id === value) return;
    const controller = new AbortController();
    fetch(`/api/products/${value}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((result) => {
        if (result.ok) setSelected(result.data);
        else setLoadError(result.error || "Unable to load the selected product");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError("Unable to load the selected product");
      });
    return () => controller.abort();
  }, [value, selected]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      const params = new URLSearchParams({ active: "1", limit: "30" });
      if (query.trim()) params.set("q", query.trim());
      if (categoryId) params.set("categoryId", categoryId);
      try {
        const response = await fetch(`/api/products?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Unable to load products");
        setItems(result.data.items);
      } catch (error) {
        if (error.name !== "AbortError") setLoadError(error.message || "Unable to load products");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [categoryId, open, query]);

  function choose(product) {
    setSelected(product);
    setQuery("");
    setOpen(false);
    onSelect?.(product);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlighted((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && items[highlighted]) {
      event.preventDefault();
      choose(items[highlighted]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div>
      {label && <label className="field-label">{label}</label>}
      <div className="relative">
        <input
          {...inputProps}
          className={`field ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15" : ""}`}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-invalid={!!error}
          aria-label={inputProps["aria-label"] || label || "Product"}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : selected?.name || ""}
          onFocus={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setOpen(true);
            setQuery("");
            setHighlighted(0);
          }}
          onBlur={() => {
            closeTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {open && (
          <ul className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-card-hover" role="listbox">
            {loading && <li className="px-3 py-2 text-xs text-slate-500">Loading products…</li>}
            {!loading && loadError && <li className="px-3 py-2 text-xs text-rose-600">{loadError}</li>}
            {!loading && !loadError && !items.length && <li className="px-3 py-2 text-xs text-slate-500">No active products found</li>}
            {!loading && items.map((product, index) => (
              <li
                key={product.id}
                role="option"
                aria-selected={index === highlighted}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  choose(product);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${index === highlighted ? "bg-brand-50 text-navy-900" : "text-slate-700"}`}
              >
                <span className="font-medium">{product.name}</span>
                <span className="ml-2 text-xs text-slate-500">{product.brand}</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  Stock {product.stock} · {formatMoney(product.sellPrice)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
