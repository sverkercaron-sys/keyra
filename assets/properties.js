import {el,price,get,image} from './property-ui.js';
const form=document.querySelector('#filters'),grid=document.querySelector('#property-grid'),status=document.querySelector('#status'),pager=document.querySelector('#pager'),sort=document.querySelector('#sort');
let currentPage=1,queryId='',abort;
const initial=new URLSearchParams(location.search);
function restore(){for(const control of form.elements){if(control.name && control.name!=='feature' && initial.has(control.name))control.value=initial.get(control.name);}}
restore();if(initial.has('sort'))sort.value=initial.get('sort');
const advanced=document.querySelector('#advanced');
function countAdvanced(){const controls=[...advanced.querySelectorAll('input,select')];const count=controls.filter(c=>c.type==='checkbox'?c.checked:!!c.value && !['featureMode','rentalLogic'].includes(c.name)).length;document.querySelector('#advanced-count').textContent=count?`(${count} valda)`:'';return count;}
form.addEventListener('change',countAdvanced);form.addEventListener('input',countAdvanced);
function clearAdvanced(){for(const control of advanced.querySelectorAll('input,select')){if(control.type==='hidden'){control.remove();continue;}if(control.type==='checkbox')control.checked=false;else control.value=control.name==='featureMode'?'2':'';}countAdvanced();}
document.querySelector('#clear-advanced').addEventListener('click',clearAdvanced);

function card(p) {const article=el('article',null,'card'),link=el('a');link.href=`property.html?reference=${encodeURIComponent(p.reference)}`;link.append(p.image?image(p.image,`${p.type} i ${p.location}`):el('div','Bild saknas','no-photo'));const body=el('div',null,'card-body');body.append(el('p',`${p.area} · ${p.reference}`,'ref'),el('h3',p.location),el('p',p.type),el('div',price(p),'price'));const facts=el('div',null,'facts');for(const [v,label] of [[p.bedrooms,'sovrum'],[p.bathrooms,'badrum'],[p.built,'m² boyta']])if(v!=null)facts.append(el('span',`${v} ${label}`));body.append(facts,el('span','Se bostaden →','card-link'));link.append(body);article.append(link);return article;}
async function search(page=1) {
 abort?.abort();abort=new AbortController();const signal=abort.signal;form.setAttribute('aria-busy','true');grid.replaceChildren();pager.hidden=true;status.hidden=false;status.replaceChildren(el('h3','Hämtar bostadsutbudet…'));document.querySelector('#search-button').disabled=true;
 const params=new URLSearchParams(new FormData(form));if(!params.has('feature'))params.delete('featureMode');if(!params.get('rentalLicence') && !params.get('communityRentals'))params.delete('rentalLogic');if(params.has('references'))params.set('references',params.get('references').replace(/\s+/g,'').toUpperCase());for(const [k,v] of [...params])if(!v)params.delete(k);params.set('sort',sort.value||'0');const publicParams=new URLSearchParams(params);if(page>1){params.set('page',String(page));params.set('query',queryId);}
 history.replaceState(null,'',`${location.pathname}?${publicParams}#sok`);
 try{const data=await get(`/api/properties?${params}`,signal);currentPage=data.page;queryId=data.queryId;document.querySelector('#results-title').textContent=`${data.total.toLocaleString('sv-SE')} bostäder att upptäcka`;status.hidden=!!data.properties.length;
 if(!data.properties.length)status.replaceChildren(el('h3','Ingen bostad matchade din sökning'),el('p','Prova ett annat område, en bredare budget eller färre sovrum.'));
 data.properties.forEach(p=>grid.append(card(p)));const pages=Math.ceil(data.total/data.pageSize);pager.hidden=pages<2 || !queryId;document.querySelector('#page-label').textContent=`Sida ${currentPage} av ${pages}`;document.querySelector('#prev').disabled=currentPage===1;document.querySelector('#next').disabled=currentPage>=pages;
 }catch(error){if(error.name==='AbortError')return;document.querySelector('#results-title').textContent='Bostäder att upptäcka';status.replaceChildren(el('h3','Bostadsutbudet är inte tillgängligt just nu'),el('p',error.message));const guide=el('a','Förbered ditt köp med Keyra Insights →');guide.href='guide.html';status.append(guide);
 }finally{if(!signal.aborted){form.removeAttribute('aria-busy');document.querySelector('#search-button').disabled=false;}}
}
form.addEventListener('submit',e=>{e.preventDefault();queryId='';search();});form.addEventListener('reset',()=>{setTimeout(()=>{sort.value='0';queryId='';countAdvanced();search();},0);});sort.addEventListener('change',()=>{queryId='';search();});document.querySelector('#prev').addEventListener('click',()=>search(currentPage-1));document.querySelector('#next').addEventListener('click',()=>search(currentPage+1));
try {
 const data=await get('/api/property-options');
 for(const name of data.locations){const option=el('option');option.value=name;document.querySelector('#locations').append(option);}
 for(const name of data.provinces || []){const option=el('option');option.value=name;document.querySelector('#provinces').append(option);}
 for(const type of data.types){const option=el('option',type.label);option.value=type.value;document.querySelector('#types').append(option);}
 const groups=document.querySelector('#feature-groups');const selected=new Set(initial.getAll('feature'));
 for(const group of data.features || []){
  const details=el('details',null,'feature-category');details.append(el('summary',group.name));const checks=el('div',null,'feature-checks');
  for(const feature of group.features){const label=el('label');const checkbox=el('input');checkbox.type='checkbox';checkbox.name='feature';checkbox.value=feature.value;checkbox.checked=selected.has(feature.value);label.append(checkbox,el('span',feature.label));checks.append(label);if(checkbox.checked)details.open=true;}
  details.append(checks);groups.append(details);
 }
 document.querySelector('#feature-status').textContent=data.features?.length?'Välj egenskaper i kategorierna nedan.':'Inga egenskapsfilter är tillgängliga i detta utbud.';
 restore();if(countAdvanced())advanced.open=true;
} catch {
 document.querySelector('#feature-status').textContent='Egenskaperna visas när anslutningen till Resales Online är aktiverad. Du kan redan utforska de övriga sökvalen.';
 if(initial.get('type')){const option=el('option',`Vald bostadstyp (${initial.get('type')})`);option.value=initial.get('type');document.querySelector('#types').append(option);restore();}
 // Preserve selected URL filters: do not silently drop them on a temporary options error.
 for(const value of initial.getAll('feature')){const input=el('input');input.type='hidden';input.name='feature';input.value=value;document.querySelector('#feature-groups').append(input);}
 if(countAdvanced())advanced.open=true;
}
search();
