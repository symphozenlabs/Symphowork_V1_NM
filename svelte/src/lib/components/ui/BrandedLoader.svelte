<script lang="ts">
import SvgIcon from "$lib/components/ui/Icon.svelte";


const cn=(...v:(string|undefined)[])=>v.filter(Boolean).join(' ');
const sizeConfig = {
  sm: {
    symbolSize: 24,
    ringSize: "size-9",
    textClass: "text-xs",
    subtextClass: "text-[10px]",
    containerClass: "py-3 px-4",
  },
  md: {
    symbolSize: 36,
    ringSize: "size-14",
    textClass: "text-sm",
    subtextClass: "text-xs",
    containerClass: "py-6 px-6",
  },
  lg: {
    symbolSize: 48,
    ringSize: "size-20",
    textClass: "text-base",
    subtextClass: "text-xs",
    containerClass: "py-10 px-8",
  },
};


let{message='Loading your workspace...',subtext,size='md',inline=false,class:className=''}:{message?:string;subtext?:string;size?:'sm'|'md'|'lg';inline?:boolean;class?:string}=$props();
const conf=$derived(sizeConfig[size]);
</script>
{#if inline}<div role="status" aria-live="polite" class={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1.5 shadow-2xs",
          className
        )}>
        <div class="relative flex size-5 shrink-0 items-center justify-center">
          
          <span class="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping motion-reduce:hidden" aria-hidden="true"></span>
          <img src="/symphowork-symbol.png" alt="SymphoWork" width={16} height={16} class="relative z-10 h-4 w-4 object-contain" />
        </div>
        <span class="text-xs font-semibold text-emerald-950">{message}</span>
      </div>{:else}<div role="status" aria-live="polite" class={cn(
        "flex flex-col items-center justify-center text-center select-none",
        conf.containerClass,
        className
      )}>
      
      <div class="relative flex items-center justify-center">
        
        <div class="absolute -inset-2 rounded-full bg-emerald-500/15 blur-lg animate-pulse motion-reduce:hidden" aria-hidden="true"></div>

        
        <div class={cn(
            "relative flex items-center justify-center rounded-full border border-emerald-200/90 bg-white/90 p-2 shadow-xs backdrop-blur-xs",
            conf.ringSize
          )}>
          
          <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-600 border-r-emerald-500/50 animate-spin motion-reduce:hidden" style:animation-duration={"1.6s"} aria-hidden="true"></div>

          
          <img src="/symphowork-symbol.png" alt="SymphoWork" width={conf.symbolSize} height={conf.symbolSize} class="relative z-10 h-auto w-auto object-contain drop-shadow-xs transition-transform" />
        </div>
      </div>

      
      {#if message}<div class="mt-3.5 space-y-0.5">
          <p class={cn(
              "font-semibold text-slate-800 tracking-tight flex items-center justify-center gap-1.5",
              conf.textClass
            )}>
            <span>{message}</span>
          </p>
          {#if subtext}<p class={cn("text-muted font-normal max-w-xs", conf.subtextClass)}>
              {subtext}
            </p>{/if}
        </div>{/if}
    </div>{/if}
