export const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const safeImage = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
export function normalize(p) {
  return { reference: String(p.Reference || ''), location: String(p.Location || ''), province: String(p.Province || ''), area: String(p.Area || ''), type: String(p.PropertyType?.NameType || p.PropertyType?.Type || ''), price: number(p.Price), currency: String(p.Currency || 'EUR'), bedrooms: number(p.Bedrooms), bathrooms: number(p.Bathrooms), built: number(p.Built), terrace: number(p.Terrace), plot: number(p.GardenPlot), pool: String(p.Pool) === '1', parking: String(p.Parking) === '1', garden: String(p.Garden) === '1', description: typeof p.Description === 'string' ? p.Description : '', image: safeImage(p.MainImage), images: list(p.Pictures?.Picture).map(x => safeImage(x.PictureURL)).filter(Boolean), energy: String(p.EnergyRating?.EnergyRated || p.EnergyRated || ''), features: list(p.PropertyFeatures?.Category).map(c => ({name: String(c.Type || ''), values: list(c.Value).filter(x => typeof x === 'string')})) };
}
export class PublicError extends Error { constructor(status, message) { super(message); this.status = status; } }
function textParam(q, name, max, pattern) {
  const v = q.get(name) || '';
  if (v.length > max || (v && pattern && !pattern.test(v))) throw new PublicError(400, 'Kontrollera sökfiltren.');
  return v;
}
export function searchParams(q) {
  const out = { P_PageSize: '12', P_SortType: '0' };
  const location = textParam(q,'location',1000); if(location) out.P_Location = location;
  const type = textParam(q,'type',300,/^\d+-\d+(,\d+-\d+)*$/); if(type) out.P_PropertyTypes = type;
  for(const [key,remote,max] of [['min','P_Min',100000000],['max','P_Max',100000000],['beds','P_Beds',20],['baths','P_Baths',20],['builtMin','P_Built_Min',1000000],['builtMax','P_Built_Max',1000000],['plotMin','P_Plot_Min',100000000],['plotMax','P_Plot_Max',100000000],['page','P_PageNo',10000],['sort','P_SortType',6]]) {
    const v = q.get(key); if(v != null && v !== '') { if(!/^\d+$/.test(v) || Number(v)>max || (key==='page' && Number(v)<1)) throw new PublicError(400,'Kontrollera sökfiltren.'); out[remote] = ['beds','baths'].includes(key) ? `${v}x` : v; }
  }
  if(out.P_Min && out.P_Max && Number(out.P_Min)>Number(out.P_Max)) throw new PublicError(400,'Lägsta pris måste vara lägre än högsta pris.');
  for(const [min,max] of [['P_Built_Min','P_Built_Max'],['P_Plot_Min','P_Plot_Max']]) if(out[min] && out[max] && Number(out[min])>Number(out[max])) throw new PublicError(400,'Minsta yta måste vara mindre än största yta.');
  for(const [key,remote,allowed] of [
    ['energy','P_EnergyRating',Array.from({length:16},(_,i)=>String(i+1))],
    ['newDevelopments','p_new_devs',['include','exclude','only']],
    ['keyReady','p_keyready',['0','1']],['includeRented','P_IncludeRented',['0','1']],
    ['rentalLicence','P_stl',['0','1','2']],['communityRentals','P_cvs',['0','1','2','3']],
    ['rentalLogic','P_stlop',['1','2']],['licenceNumber','P_RTA',['0','1','2']],
    ['decree','P_onlydecree218',['0','1']],['featureMode','P_MustHaveFeatures',['0','1','2']]
  ]) {const v=q.get(key);if(v){if(!allowed.includes(v))throw new PublicError(400,'Kontrollera sökfiltren.');out[remote]=v;}}
  for(const [key,remote,max,pattern] of [['province','P_Province',100],['excludeLocations','P_RemoveLocation',1000],['references','P_RefId',1000,/^R\d+(,R\d+)*$/i]]) {const v=textParam(q,key,max,pattern);if(v)out[remote]=v;}
  if(out.P_Location && out.P_RemoveLocation) throw new PublicError(400,'Välj områden eller uteslut områden, inte båda samtidigt.');
  const query = textParam(q,'query',80,/^[a-zA-Z0-9-]+$/); if(query) out.P_QueryId=query;
  if(Number(out.P_PageNo || 1)>1 && !query) throw new PublicError(400,'Starta en ny sökning före nästa sida.');
  return out;
}
export async function requestResales(service, params = {}, env = process.env, fetcher = fetch) {
  if(!env.RESALES_P1 || !env.RESALES_P2 || !env.RESALES_FILTER_ID) throw new PublicError(503,'Bostadsutbudet öppnar när anslutningen är aktiverad.');
  const url = new URL(`https://webapi.resales-online.com/V6/${service}`);
  url.search = new URLSearchParams({p1:env.RESALES_P1,p2:env.RESALES_P2,p_agency_filterid:env.RESALES_FILTER_ID,P_Lang:'8',P_Currency:'EUR',P_Dimension:'1',...(env.RESALES_SANDBOX === 'true' ? {P_sandbox:'true'} : {}),...params});
  // Never return upstream transaction metadata: it may echo credentials and IPs.
  let data;
  try { const response=await fetcher(url,{signal:AbortSignal.timeout(12000),redirect:'error'}); if(!response.ok) throw new Error(); data=await response.json(); } catch { throw new PublicError(502,'Bostadsutbudet kunde inte hämtas. Försök igen om en stund.'); }
  if(data.transaction?.status !== 'success') throw new PublicError(502,'Bostadsutbudet kunde inte hämtas. Försök igen om en stund.');
  return data;
}
export function sendError(res,error) { res.setHeader('Cache-Control','no-store'); return res.status(error instanceof PublicError ? error.status : 500).json({message:error instanceof PublicError ? error.message : 'Ett fel uppstod. Försök igen.'}); }

export function normalizeFeatureOptions(data) {
 return list(data.FeaturesData?.Category).map(c=>({name:String(c['@attributes']?.Name || c.Name || ''),features:list(c.Feature).filter(f=>typeof f.ParamName==='string' && f.ParamName.length<=100).map(f=>({label:String(f.Name || ''),value:f.ParamName}))}));
}
export async function addFeatureParams(q,params,fetchOptions=()=>requestResales('SearchFeatures')) {
 const selected=[...new Set(q.getAll('feature'))];if(!selected.length)return params;
 if(selected.length>300 || selected.some(x=>x.length>100))throw new PublicError(400,'Kontrollera egenskapsfiltren.');
 const allowed=new Set(normalizeFeatureOptions(await fetchOptions()).flatMap(c=>c.features.map(f=>f.value)));
 if(selected.some(x=>!allowed.has(x)))throw new PublicError(400,'En vald egenskap är inte längre tillgänglig. Uppdatera sidan.');
 for(const feature of selected)params[feature]='1';
 params.P_MustHaveFeatures ||= '2';return params;
}
