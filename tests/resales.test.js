import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/properties.js';
import options from '../api/property-options.js';
import {normalize,requestResales,searchParams,addFeatureParams,normalizeFeatureOptions} from '../lib/resales.js';
const fixture=async name=>JSON.parse(await readFile(new URL(`./${name}.json`,import.meta.url)));
const env={RESALES_P1:'client-test',RESALES_P2:'secret-test',RESALES_FILTER_ID:'1'};
function response(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};}
test('documented detail and search shapes normalize including gallery',async()=>{const d=normalize((await fixture('detail')).Property);assert.equal(d.reference,'R3479767');assert.equal(d.images.length,13);assert.equal(d.price,179000);assert.equal(d.pool,true);assert.equal(normalize((await fixture('search')).Property[0]).reference,'R3479851');assert.equal(normalize({Price:'not a number',MainImage:'javascript:alert(1)'}).image,null);});
test('search validates bounds and preserves pagination QueryId and min bedrooms',()=>{assert.deepEqual(searchParams(new URLSearchParams('beds=3&page=2&query=abc-123&max=600000')),{P_PageSize:'12',P_SortType:'0',P_Max:'600000',P_Beds:'3x',P_PageNo:'2',P_QueryId:'abc-123'});for(const q of ['min=600&max=500','page=2','max=-1','sort=7','type=bad','beds=1.5'])assert.throws(()=>searchParams(new URLSearchParams(q)));});
test('request builds documented server-side credentials and Swedish sale params',async()=>{let url;const data=await requestResales('SearchProperties',{P_Beds:'3x'},env,async u=>{url=u;return {ok:true,json:()=>fixture('search')};});assert.equal(url.origin,'https://webapi.resales-online.com');assert.equal(url.searchParams.get('P_Lang'),'8');assert.equal(url.searchParams.get('p2'),'secret-test');assert.equal(data.transaction.status,'success');});
test('missing config and echoed upstream credential errors do not leak',async()=>{await assert.rejects(requestResales('SearchProperties',{},{}),e=>e.status===503);await assert.rejects(requestResales('SearchProperties',{},env,async()=>({ok:true,json:async()=>({transaction:{status:'error',parsedparameters:{p2:'secret-test'}}})})),e=>e.status===502&&!e.message.includes('secret'));});
test('public endpoints normalize official fixtures; no transaction metadata',async()=>{const oldFetch=global.fetch;const old={...process.env};Object.assign(process.env,env);global.fetch=async u=>({ok:true,json:()=>fixture(u.pathname.endsWith('PropertyDetails')?'detail':u.pathname.endsWith('SearchFeatures')?'features':u.pathname.endsWith('SearchLocations')?'locations':u.pathname.endsWith('SearchPropertyTypes')?'types':'search')});try{let res=response();await handler({method:'GET',url:'/api/properties?beds=3'},res);assert.equal(res.code,200);assert.equal(res.data.total,42);assert.ok(!JSON.stringify(res.data).includes('transaction'));res=response();await handler({method:'GET',url:'/api/properties?reference=R3479767'},res);assert.equal(res.data.property.images.length,13);res=response();await options({method:'GET'},res);assert.ok(res.data.locations.includes('Fuengirola'));assert.ok(res.data.features.some(c=>c.features.some(f=>f.value==='1Pool2')));assert.ok(res.data.types.some(x=>x.value==='2-2'));res=response();await handler({method:'POST',url:'/api/properties'},res);assert.equal(res.code,405);}finally{global.fetch=oldFetch;for(const k of Object.keys(env)){if(old[k]==null)delete process.env[k];else process.env[k]=old[k];}}});

test('advanced ranges, enums and multi-type selection map to V6',()=>{
 const p=searchParams(new URLSearchParams('type=1-1,2-2&baths=2&builtMin=100&builtMax=200&plotMin=500&newDevelopments=only&keyReady=1&energy=5&rentalLicence=1&communityRentals=1&featureMode=2&province=Málaga'));
 assert.equal(p.P_Baths,'2x');assert.equal(p.P_Built_Min,'100');assert.equal(p.P_PropertyTypes,'1-1,2-2');assert.equal(p.P_EnergyRating,'5');assert.equal(p.p_new_devs,'only');assert.equal(p.P_stl,'1');
 for(const q of ['builtMin=200&builtMax=100','plotMin=200&plotMax=100','energy=17','newDevelopments=bad','featureMode=3','location=Mijas&excludeLocations=Marbella','references=bad'])assert.throws(()=>searchParams(new URLSearchParams(q)));
});
test('feature selection accepts account metadata only; preserves spaces and matching mode',async()=>{
 const fetchOptions=()=>fixture('features');const f=normalizeFeatureOptions(await fetchOptions());assert.ok(f.length>10);
 const p=await addFeatureParams(new URLSearchParams('feature=1Pool2&feature=1Climate+Control1&featureMode=2'),{P_MustHaveFeatures:'2'},fetchOptions);
 assert.equal(p['1Pool2'],'1');assert.equal(p['1Climate Control1'],'1');assert.equal(p.P_MustHaveFeatures,'2');
 await assert.rejects(addFeatureParams(new URLSearchParams('feature=p2'),{},fetchOptions),e=>e.status===400);
});
