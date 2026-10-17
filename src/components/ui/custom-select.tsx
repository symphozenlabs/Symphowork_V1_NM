"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  id?: string;
  name?: string;
  value?: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  /** Enables inline filtering input */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function CustomSelect({
  id: explicitId,
  name,
  value = "",
  onChange,
  options = [],
  placeholder = "Select an option…",
  disabled = false,
  required = false,
  error,
  searchable = false,
  searchPlaceholder = "Search options…",
  emptyMessage = "No matching options found",
  className,
  triggerClassName,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: CustomSelectProps) {
  const generatedId = useId();
  const selectId = explicitId || generatedId;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Filtered options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input or selected item when opened
  useEffect(() => {
    if (isOpen) {
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
      const selectedIdx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    } else {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [isOpen, searchable, value, filteredOptions]);

  // Keyboard navigation within the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;

      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < filteredOptions.length && filteredOptions[next].disabled) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const target = filteredOptions[highlightedIndex];
          if (!target.disabled) {
            onChange(target.value);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        }
        break;

      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full text-left", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submission integration */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Dropdown Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        id={selectId}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={!!error}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs transition-all duration-150 shadow-2xs select-none",
          "border-border text-foreground hover:border-slate-300",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          isOpen && "border-primary ring-2 ring-primary/15 shadow-xs",
          disabled && "cursor-not-allowed bg-slate-50 opacity-60 text-slate-400 hover:border-border",
          error && "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-200",
          triggerClassName
        )}
      >
        <span
          className={cn(
            "truncate text-left flex-1",
            !selectedOption?.label ? "text-muted font-normal" : "font-medium text-foreground"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span className="ml-2 flex shrink-0 items-center gap-1.5 text-muted">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                triggerRef.current?.focus();
              }}
              className="rounded-sm p-0.5 hover:bg-slate-100 hover:text-foreground transition-colors"
            >
              <X className="size-3 text-slate-400 hover:text-slate-600" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200 ease-out",
              isOpen ? "rotate-180 text-primary" : "text-slate-400"
            )}
            aria-hidden="true"
          />
        </span>
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1.5 w-full min-w-[200px] overflow-hidden rounded-xl border border-border/90 bg-white py-1 shadow-lg",
            "animate-fade-in transition-all"
          )}
        >
          {/* Optional Search Field */}
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 size-3.5 text-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {/* List of Options */}
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel || placeholder}
            className="max-h-56 overflow-y-auto px-1 py-1 text-xs [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-muted">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value || `empty-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => {
                      if (!opt.disabled) setHighlightedIndex(idx);
                    }}
                    className={cn(
                      "group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors select-none",
                      isSelected && "bg-[#E5F0E4] font-semibold text-primary",
                      isHighlighted && !isSelected && "bg-[#EFF4EE] text-primary",
                      !isSelected && !isHighlighted && "text-slate-700",
                      opt.disabled && "cursor-not-allowed opacity-40 pointer-events-none"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-muted font-normal truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Validation error message if passed */}
      {error && (
        <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}
