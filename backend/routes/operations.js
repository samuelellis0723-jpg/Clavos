'use strict';
const { Router }=require('express');
const { Op }=require('sequelize');
const { roles }=require('../middleware/access');
const v=require('../lib/validation');
module.exports=db=>{
  const r=Router(), service=require('../services/workflow')(db), inventory=require('../services/inventory')(db), analytics=require('../services/analytics')(db);
  const command=(method,status=200)=>async(req,res)=>res.status(status).json({data:await method(req)});
  r.post('/requisitions',command(req=>service.createRequisition(req.body,req.actor),201));
  r.post('/requisitions/:id/submit',command(req=>service.submit(req.params.id,req.actor)));
  r.post('/requisitions/:id/decision',command(req=>service.decide(req.params.id,req.body,req.actor)));
  r.post('/requisitions/:id/orders',command(req=>service.createOrder(req.params.id,req.body,req.actor),201));
  r.post('/orders/:id/send',command(req=>service.sendOrder(req.params.id,req.actor)));
  r.post('/orders/:id/receipts',command(req=>service.receive(req.params.id,req.body,req.actor),201));
  r.post('/orders/:id/invoices',command(req=>service.invoice(req.params.id,req.body,req.actor),201));
  r.post('/invoices/:id/approve',command(req=>service.approveInvoice(req.params.id,req.actor)));
  r.post('/invoices/:id/payments',command(req=>service.schedulePayment(req.params.id,req.body,req.actor),201));
  r.post('/payments/:id/confirm',command(req=>service.confirmPayment(req.params.id,req.body,req.actor)));
  r.get('/inventory/balance',command(req=>inventory.getBalance(req.query,req.actor)));
  r.post('/inventory/transfers',command(req=>inventory.transfer(req.body,req.actor),201));
  r.get('/analytics/spend',roles('analyst','finance'),async(req,res)=>res.json(await analytics.spend(req.query)));
  r.get('/analytics/evaluations/:id',roles('analyst','buyer'),command(req=>analytics.evaluation(req.params.id)));
  r.get('/analytics/reorder',roles('analyst','warehouse','buyer'),async(req,res)=>res.json(await analytics.reorder(req.query)));
  r.get('/approvals',async(req,res)=>{
    const pg=v.page(req.query);
    const result=await db.requisition_approvals.findAndCountAll({where:{status:'pending'},include:[{model:db.approval_rules,as:'approvalRuleId',where:{approver_role_id:{[Op.in]:req.actor.role_ids}}},{model:db.requisitions,as:'requisitionId',where:{status:{[Op.in]:['submitted','under_review']}}}],limit:pg.limit,offset:pg.offset,order:[['requisition_approval_id','ASC']],distinct:true});
    res.json({data:result.rows,pagination:{page:pg.page,limit:pg.limit,total:result.count}});
  });
  const docs={requisitions:['requisitions','requisition_id',['requester','buyer','warehouse']],orders:['purchase_orders','purchase_order_id',['buyer','warehouse','finance']],receipts:['receipts','receipt_id',['buyer','warehouse','finance']],invoices:['supplier_invoices','invoice_id',['finance']],payments:['payments','payment_id',['finance']]};
  for(const [kind,[table,key,allowed]]of Object.entries(docs)){
    r.get(`/${kind}`,roles(...allowed),async(req,res)=>{
      const pg=v.page(req.query,['status']),where={};
      if(req.query.status!==undefined)where.status=v.text(req.query.status,'status',40);
      if(kind==='requisitions'&&!req.actor.roles.some(x=>['admin','buyer','warehouse'].includes(x)))where.requester_user_id=req.actor.user_id;
      const result=await db[table].findAndCountAll({where,limit:pg.limit,offset:pg.offset,order:[[key,'DESC']]});
      res.json({data:result.rows,pagination:{page:pg.page,limit:pg.limit,total:result.count}});
    });
    r.get(`/${kind}/:id`,command(req=>service.detail(kind,req.params.id,req.actor)));
  }
  return r;
};
