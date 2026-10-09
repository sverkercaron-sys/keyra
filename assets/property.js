import {el,price,get} from './property-ui.js';
const status=document.querySelector('#detail-status');
try {
 const reference=new URLSearchParams(location.search).get('reference');if(!reference)throw Error('Välj en bostad från sökresultatet.');
 const {property:p}=await get(`/api/properties?reference=${encodeURIComponent(reference)}`);
 document.title=`${p.type} i ${p.location} | Keyra Properties`;document.querySelector('#reference').textContent=`Objektreferens ${p.reference}`;document.querySelector('#contact-reference').textContent=`Referens: ${p.reference}`;document.querySelector('#title').textContent=`${p.type} i ${p.location}`;document.querySelector('#location').textContent=[p.area,p.province].filter(Boolean).join(' · ');document.querySelector('#price').textContent=price(p);
 const images=p.images.length?p.images:p.image?[p.image]:[];const main=document.querySelector('#main-image');
 main.addEventListener('error',()=>{main.hidden=true;});
 if(!images.length)main.replaceWith(el('div','Bild saknas','no-photo'));
 const thumbnails=document.querySelector('#thumbnails');function show(src,i){main.hidden=false;main.src=src;main.alt=`${p.type} i ${p.location}, bild ${i+1}`;[...thumbnails.children].forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));}
 images.forEach((src,i)=>{const button=el('button');button.type='button';button.setAttribute('aria-label',`Visa bild ${i+1}`);const img=el('img');img.src=src;img.alt='';img.loading='lazy';button.append(img);button.addEventListener('click',()=>show(src,i));thumbnails.append(button);});if(images.length)show(images[0],0);
 const specs=document.querySelector('#specs');for(const [label,v] of [['Sovrum',p.bedrooms],['Badrum',p.bathrooms],['Boyta',p.built==null?null:`${p.built} m²`],['Terrass',p.terrace==null?null:`${p.terrace} m²`],['Tomt',p.plot==null?null:`${p.plot} m²`],['Energiklass',p.energy||'Ej angiven']]){const div=el('div');div.append(el('dt',label),el('dd',v==null?'Ej angivet':String(v)));specs.append(div);}for(const [label,v] of [['Pool',p.pool],['Parkering',p.parking],['Trädgård',p.garden]])if(v){const div=el('div');div.append(el('dt',label),el('dd','Finns enligt annons'));specs.append(div);}
 document.querySelector('#description').textContent=p.description||'Beskrivning saknas. Kontakta Keyra med objektreferensen för mer information.';
 const features=document.querySelector('#features');if(p.features.length){features.append(el('h2','Egenskaper'));for(const f of p.features){features.append(el('h3',f.name),el('p',f.values.join(' · ')));}}
 status.hidden=true;document.querySelector('#property').hidden=false;
}catch(error){status.replaceChildren(el('h2','Bostaden kunde inte visas'),el('p',error.message));}
