'use strict';
const { Router }=require('express');
const {authenticate,loginLimit}=require('../middleware/access');
module.exports=service=>{
  const r=Router();
  r.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
  r.post('/login',loginLimit,async(req,res)=>res.json({data:await service.login(req.body)}));
  r.get('/me',authenticate(service),(req,res)=>{const {session_hash,...user}=req.actor;res.json({data:user});});
  r.post('/logout',authenticate(service),async(req,res)=>{await service.logout(req.actor);res.status(204).end();});
  return r;
};
