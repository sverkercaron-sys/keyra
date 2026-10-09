import {requestResales,searchParams,normalize,list,PublicError,sendError,addFeatureParams} from '../lib/resales.js';
export default async function handler(req,res) {
  if(req.method !== 'GET') {res.setHeader('Allow','GET');return res.status(405).json({message:'Metoden stöds inte.'});}
  try {
    const q=new URL(req.url,'https://keyra.local').searchParams;
    if(q.get('reference')) {
      const reference=q.get('reference'); if(!/^R\d{1,12}$/i.test(reference)) throw new PublicError(400,'Ogiltig objektreferens.');
      const data=await requestResales('PropertyDetails',{P_RefId:reference});
      const property=list(data.Property)[0]; if(!property?.Reference) throw new PublicError(404,'Bostaden är inte längre tillgänglig.');
      res.setHeader('Cache-Control','public, s-maxage=60'); return res.json({property:normalize(property)});
    }
    const data=await requestResales('SearchProperties',await addFeatureParams(q,searchParams(q)));
    res.setHeader('Cache-Control','public, s-maxage=60');
    return res.json({properties:list(data.Property).map(normalize),total:Number(data.QueryInfo?.PropertyCount)||0,page:Number(data.QueryInfo?.CurrentPage)||1,pageSize:Number(data.QueryInfo?.PropertiesPerPage)||12,queryId:String(data.QueryInfo?.QueryId || '')});
  } catch(error) {return sendError(res,error);}
}
