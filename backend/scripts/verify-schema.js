'use strict';
const fs=require('fs');
const path=require('path');
const db=require('../models');
(async()=>{
  const source=fs.readFileSync(path.join(__dirname,'../dbml.md'),'utf8'), expected=[];
  for(const [,name,body]of source.matchAll(/Table\s+(\w+)\s*\{([\s\S]*?)\n\}/g)){
    const item={name,columns:[],pk:[],indexes:[]};let inIndexes=false;
    for(const raw of body.split('\n')){
      const line=raw.trim();if(line==='indexes {'){inIndexes=true;continue;}
      if(inIndexes){if(line==='}'){inIndexes=false;continue;}const ix=line.match(/^\(([^)]+)\)(?:\s*\[([^\]]+)\])?/);if(ix){const cols=ix[1].split(',').map(x=>x.trim());if(ix[2]?.includes('pk'))item.pk.push(...cols);else item.indexes.push({fields:cols,unique:!!ix[2]?.includes('unique')});}continue;}
      // Parse declarations independently of the generator, ignoring comments/notes.
      const declaration=line.match(/^(\w+)\s+([a-z_]+(?:\([\d,]+\))?)(?:\s+\[(.*)\])?$/);
      if(!declaration||line.startsWith('Note:'))continue;
      const attrs=(declaration[3]||'').split(',').map(x=>x.trim());item.columns.push(declaration[1]);
      if(attrs.includes('pk'))item.pk.push(declaration[1]);if(attrs.includes('unique'))item.indexes.push({fields:[declaration[1]],unique:true});
    }expected.push(item);
  }
  const [columns]=await db.sequelize.query('SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()');
  const [foreignKeys]=await db.sequelize.query('SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL');
  const issues=[];let checks=0;
  for(const item of expected){
    const names=columns.filter(c=>c.TABLE_NAME===item.name).map(c=>c.COLUMN_NAME).sort();
    if(names.join(',')!==item.columns.sort().join(','))issues.push(`${item.name}: columns differ`);
    const indexes=await db.sequelize.getQueryInterface().showIndex(item.name);
    const pk=indexes.find(i=>i.primary);
    if(!pk||pk.fields.map(f=>f.attribute).join(',')!==item.pk.join(','))issues.push(`${item.name}: primary key differs`);
    for(const ix of item.indexes){checks++;if(!indexes.some(i=>!!i.unique===ix.unique&&i.fields.map(f=>f.attribute).join(',')===ix.fields.join(',')))issues.push(`${item.name}: missing index ${ix.fields.join(',')}`);}
  }
  const refs=[...source.matchAll(/Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/g)].map(m=>`${m[1]}.${m[2]}>${m[3]}.${m[4]}`);
  const actual=foreignKeys.map(f=>`${f.TABLE_NAME}.${f.COLUMN_NAME}>${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME}`);
  for(const ref of refs)if(!actual.includes(ref))issues.push(`Missing FK ${ref}`);
  console.log(JSON.stringify({tables:expected.length,foreignKeys:refs.length,indexesChecked:checks,issues}));
  if(issues.length)process.exitCode=1;
})().catch(e=>{console.error('Schema verification failed:',e.name,e.original?.code||'');process.exitCode=1;}).finally(()=>db.sequelize.close());
