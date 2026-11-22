// Narrow input checks matching the authoritative department schema. Backend authorization remains mandatory.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function invalidRelayInput(request:Request):Promise<boolean> {
  const path=new URL(request.url).pathname;
  const detail=path.match(/^\/api\/app\/(employees|departments)\/([^/]+)$/);
  if(detail && ['PATCH','DELETE'].includes(request.method) && !uuid.test(detail[2])) return true;
  const department=path==='/api/app/departments' && request.method==='POST'
    || detail?.[1]==='departments' && request.method==='PATCH';
  if(!department) return false;
  let body:Record<string,unknown>;
  try {body=await request.clone().json();} catch {return true;}
  if(!body || typeof body!=='object' || Array.isArray(body)) return true;
  const required=request.method==='POST';
  for(const [key,max] of [['name',120],['code',40]] as const){
    const value=body[key];
    if(value===undefined && !required) continue;
    if(typeof value!=='string' || value.trim().length<2 || value.trim().length>max) return true;
    if(key==='code' && !/^[A-Za-z0-9_-]+$/.test(value.trim())) return true;
  }
  if(body.description!==undefined && (typeof body.description!=='string' || body.description.trim().length>500)) return true;
  if(body.headEmployeeId!==undefined && body.headEmployeeId!==null && body.headEmployeeId!=='' && (typeof body.headEmployeeId!=='string' || !uuid.test(body.headEmployeeId))) return true;
  if(body.status!==undefined && (typeof body.status!=='string' || !['active','inactive'].includes(body.status))) return true;
  return false;
}
