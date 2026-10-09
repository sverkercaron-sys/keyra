import {requestResales,list,sendError,normalizeFeatureOptions} from '../lib/resales.js';
export default async function handler(req,res) {
  if(req.method!=='GET') {res.setHeader('Allow','GET');return res.status(405).json({message:'Metoden stöds inte.'});}
  try {
    const [locations,types,features]=await Promise.all([requestResales('SearchLocations',{P_SortType:'1'}),requestResales('SearchPropertyTypes'),requestResales('SearchFeatures')]);
    const names=list(locations.LocationData).flatMap(country=>list(country.ProvinceArea).flatMap(a=>list(a.Locations?.Location))).filter(x=>typeof x==='string');
    const options=[];
    function walk(x) {if(!x || typeof x!=='object') return; if(x.OptionValue && x.Type) options.push({value:String(x.OptionValue),label:String(x.Type)}); for(const v of Object.values(x)) {if(Array.isArray(v)) v.forEach(walk);else if(v && typeof v==='object') walk(v);}}
    walk(types.PropertyTypes);
    res.setHeader('Cache-Control','public, s-maxage=3600');return res.json({locations:[...new Set(names)].sort((a,b)=>a.localeCompare(b,'sv')),features:normalizeFeatureOptions(features),provinces:[...new Set(list(locations.LocationData).flatMap(country=>list(country.ProvinceArea).map(a=>a.ProvinceAreaName)).filter(Boolean))],types:options.filter((x,i,a)=>a.findIndex(y=>y.value===x.value)===i)});
  } catch(error) {return sendError(res,error);}
}
