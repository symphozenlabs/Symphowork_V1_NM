<script lang="ts">
const cn=(...values:(string|boolean|null|undefined)[])=>values.filter(Boolean).join(" ");
import SvgIcon from "$lib/components/ui/Icon.svelte";


import {untrack} from "svelte";
import {page as routePage,navigating} from "$app/state";
import {goto,invalidateAll} from "$app/navigation";
import {notify} from "$lib/client/toast";
export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}
interface CustomSelectProps {
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
  class?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}
let {
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
  class:className,
  triggerClassName,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}:CustomSelectProps=$props();
const generatedId=$props.id();
const selectId=$derived(explicitId || generatedId);
const listboxId=$derived(`${selectId}-listbox`);
let isOpen=$state(untrack(()=>(false)));
const setIsOpen=(next:typeof isOpen|((previous:typeof isOpen)=>typeof isOpen))=>{isOpen=typeof next==="function"?(next as (previous:typeof isOpen)=>typeof isOpen)(isOpen):next;};
let searchQuery=$state(untrack(()=>("")));
const setSearchQuery=(next:typeof searchQuery|((previous:typeof searchQuery)=>typeof searchQuery))=>{searchQuery=typeof next==="function"?(next as (previous:typeof searchQuery)=>typeof searchQuery)(searchQuery):next;};
let highlightedIndex=$state<number>(untrack(()=>(-1)));
const setHighlightedIndex=(next:typeof highlightedIndex|((previous:typeof highlightedIndex)=>typeof highlightedIndex))=>{highlightedIndex=typeof next==="function"?(next as (previous:typeof highlightedIndex)=>typeof highlightedIndex)(highlightedIndex):next;};
let containerRef=$state({current:null as HTMLDivElement|null});
let triggerRef=$state({current:null as HTMLButtonElement|null});
let searchInputRef=$state({current:null as HTMLInputElement|null});
let listboxRef=$state({current:null as HTMLUListElement|null});
const filteredOptions=$derived.by(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  });
const selectedOption=$derived(options.find((opt) => opt.value === value));
$effect(()=>{isOpen;return untrack(() => {
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
  });});
$effect(()=>{isOpen;searchable;value;filteredOptions;return untrack(() => {
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
  });});
const handleKeyDown = (e: KeyboardEvent) => {
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
$effect(()=>{highlightedIndex;isOpen;return untrack(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  });});
</script>
<div bind:this={containerRef.current} class={cn("relative w-full text-left", className)}>
      
      {#if name}<input type="hidden" name={name} value={value} required={required} />{/if}

      
      <button bind:this={triggerRef.current} type="button" role="combobox" onkeydown={handleKeyDown} aria-activedescendant={isOpen&&highlightedIndex>=0?listboxId+"-option-"+highlightedIndex:undefined} id={selectId} disabled={disabled} onclick={() => setIsOpen((prev) => !prev)} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listboxId} aria-invalid={!!error} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} class={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-xs transition-all duration-150 shadow-2xs select-none",
          "border-border text-foreground hover:border-slate-300",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          isOpen && "border-primary ring-2 ring-primary/15 shadow-xs",
          disabled && "cursor-not-allowed bg-slate-50 opacity-60 text-slate-400 hover:border-border",
          error && "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-200",
          triggerClassName
        )}>
        <span class={cn(
            "truncate text-left flex-1",
            !selectedOption?.label ? "text-muted font-normal" : "font-medium text-foreground"
          )}>
          {#if selectedOption}{selectedOption.label}{:else}{placeholder}{/if}
        </span>

        <span class="ml-2 flex shrink-0 items-center gap-1.5 text-muted">
          {#if value && !disabled}<span class="size-4"></span>{/if}
          <SvgIcon name="ChevronDown" class={cn(
              "size-4 transition-transform duration-200 ease-out",
              isOpen ? "rotate-180 text-primary" : "text-slate-400"
            )} aria-hidden="true" />
        </span>
      </button>
      {#if value&&!disabled}<button type="button" aria-label="Clear selection" class="absolute right-9 top-3 rounded-sm p-0.5 text-muted hover:bg-slate-100 hover:text-foreground" onclick={()=>{onChange("");triggerRef.current?.focus();}}><SvgIcon name="X" class="size-3"/></button>{/if}
      
      {#if isOpen}<div class={cn(
            "absolute left-0 top-full z-50 mt-1.5 w-full min-w-[200px] overflow-hidden rounded-xl border border-border/90 bg-white py-1 shadow-lg",
            "animate-fade-in transition-all"
          )}>
          
          {#if searchable}<div class="p-2 border-b border-slate-100 bg-slate-50/50">
              <div class="relative flex items-center">
                <SvgIcon name="Search" class="absolute left-2.5 size-3.5 text-muted pointer-events-none" />
                <input onkeydown={handleKeyDown} aria-label={searchPlaceholder} bind:this={searchInputRef.current} type="text" value={searchQuery} oninput={(e) => {
                    setSearchQuery(e.currentTarget.value);
                    setHighlightedIndex(0);
                  }} placeholder={searchPlaceholder} class="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20" />
              </div>
            </div>{/if}

          
          <ul bind:this={listboxRef.current} id={listboxId} role="listbox" tabindex={-1} aria-label={ariaLabel || placeholder} class="max-h-56 overflow-y-auto px-1 py-1 text-xs [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
            {#if filteredOptions.length === 0}<li class="px-3 py-3 text-center text-xs text-muted">
                {emptyMessage}
              </li>{:else}{#each filteredOptions as opt, idx}{@const isSelected = opt.value === value}{@const isHighlighted = idx === highlightedIndex}<li id={listboxId+"-option-"+idx} tabindex={-1} onkeydown={handleKeyDown} role="option" aria-selected={isSelected} aria-disabled={opt.disabled} onclick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }} onmouseenter={() => {
                      if (!opt.disabled) setHighlightedIndex(idx);
                    }} class={cn(
                      "group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors select-none",
                      isSelected && "bg-[#E5F0E4] font-semibold text-primary",
                      isHighlighted && !isSelected && "bg-[#EFF4EE] text-primary",
                      !isSelected && !isHighlighted && "text-slate-700",
                      opt.disabled && "cursor-not-allowed opacity-40 pointer-events-none"
                    )}>
                    <div class="flex flex-col min-w-0 pr-2">
                      <span class="truncate">{opt.label}</span>
                      {#if opt.sublabel}<span class="text-[10px] text-muted font-normal truncate">
                          {opt.sublabel}
                        </span>{/if}
                    </div>

                    {#if isSelected}<SvgIcon name="Check" class="size-3.5 shrink-0 text-primary" aria-hidden="true" />{/if}
                  </li>{/each}{/if}
          </ul>
        </div>{/if}

      
      {#if error}<p class="mt-1 text-[11px] font-medium text-rose-600">{error}</p>{/if}
    </div>
