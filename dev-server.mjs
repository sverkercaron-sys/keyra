import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import properties from './api/properties.js';
import options from './api/property-options.js';
const root=process.cwd();
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.status=n=>{res.statusCode=n;return res;};res.json=x=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(x));};
 if(url.pathname==='/api/properties')return properties(req,res);
 if(url.pathname==='/api/property-options')return options(req,res);
 try{const name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');const file=path.resolve(root,name);if(!file.startsWith(root+path.sep) || name.split('/').some(p=>p.startsWith('.')) || !['.html','.css','.js','.webp','.txt','.xml'].includes(path.extname(file)))throw Error();const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end('Not found');}
}).listen(3000,'127.0.0.1',()=>console.log('Keyra: http://localhost:3000'));
