import { writable } from 'svelte/store';
export const toasts = writable<{id:number;type:'success'|'error'|'info';message:string}[]>([]);
let nextId=0;
export function notify(message:string,type:'success'|'error'|'info'='info') {
 const id=++nextId; toasts.update(items=>[...items,{id,type,message}]);
 setTimeout(()=>toasts.update(items=>items.filter(x=>x.id!==id)),6000);
}

