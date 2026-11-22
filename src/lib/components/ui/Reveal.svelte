<script lang="ts">
import{onMount,type Snippet}from'svelte';import type{HTMLAttributes}from'svelte/elements';
let{children,delayMs=0,class:className='',...rest}:HTMLAttributes<HTMLDivElement>&{children?:Snippet;delayMs?:number}=$props();let element:HTMLDivElement;let visible=$state(false);
onMount(()=>{if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){visible=true;return;}let timer:ReturnType<typeof setTimeout>|undefined;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){if(delayMs>0)timer=setTimeout(()=>visible=true,delayMs);else visible=true;observer.disconnect();}},{threshold:0.1,rootMargin:'0px 0px -40px 0px'});observer.observe(element);return()=>{observer.disconnect();if(timer)clearTimeout(timer);};});
</script>
<div bind:this={element} class={'transition-all duration-700 ease-out '+(visible?'opacity-100 translate-y-0':'opacity-0 translate-y-6 motion-reduce:opacity-100 motion-reduce:translate-y-0')+' '+className} {...rest}>{@render children?.()}</div>
