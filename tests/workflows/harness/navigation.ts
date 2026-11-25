export const goto=async()=>{};
export const invalidateAll=async()=>{};

export const replaceState=(url:string)=>{history.replaceState({},'',url);};
export const pushState=(url:string)=>{history.pushState({},'',url);};
