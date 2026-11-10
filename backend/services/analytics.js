'use strict';
const { Op } = require('sequelize');
const v=require('../lib/validation');
const {fail}=require('../lib/errors');
const {scaled:d,format:f,round}=require('../lib/decimal');
module.exports = db => ({
  async spend(query) {
    v.object(query,['date_from','date_to'],['date_from','date_to']);const from=v.date(query.date_from),to=v.date(query.date_to);
    if(from>to)fail(400,'INVALID_RANGE','Rango de fechas inválido.');
    const lines=await db.invoice_lines.findAll({include:[{model:db.supplier_invoices,as:'invoiceId',where:{invoice_date:{[Op.between]:[from,to]},status:{[Op.in]:['approved','partially_paid','paid']}}}]});
    const groups=new Map();
    for(const line of lines){const key=`${line.invoiceId.currency_code}|${line.category_id??'uncategorized'}`;const g=groups.get(key)||{currency_code:line.invoiceId.currency_code,category_id:line.category_id,total:0n};g.total+=d(line.line_total);groups.set(key,g);}
    return {data:[...groups.values()].map(g=>({currency_code:g.currency_code,category_id:g.category_id,total_amount:f(g.total)})),meta:{basis:'approved_invoice_lines_including_tax',conversion:'none',date_from:from,date_to:to}};
  },
  async evaluation(id) {
    const evaluation=await db.supplier_evaluations.findByPk(v.id(id));if(!evaluation)fail(404,'NOT_FOUND','Evaluación no encontrada.');
    const scores=await db.supplier_evaluation_scores.findAll({where:{evaluation_id:evaluation.evaluation_id},include:[{model:db.evaluation_criteria,as:'criterionId'}]});
    let weighted=0n,weights=0n;
    for(const row of scores){const w=d(row.weight_used,4,{precision:7}),s=d(row.score,4,{precision:7});weighted+=w*s;weights+=w;}
    return {evaluation_id:evaluation.evaluation_id,supplier_id:evaluation.supplier_id,scores,weight_sum:f(weights,4),weighted_average:weights>0n?f(round(weighted,weights),4):null,meta:{score_scale:'not_defined',cross_supplier_ranking:false,normalization:'none',higher_is_better:'not_normalized',requires:['common score scale','weight policy','criterion direction normalization']}};
  },
  async reorder(query) {
    const pg=v.page(query,['product_id','warehouse_id']),where={};for(const k of ['product_id','warehouse_id'])if(query[k]!==undefined)where[k]=v.id(query[k]);
    const policies=await db.product_warehouse_policies.findAndCountAll({where,limit:pg.limit,offset:pg.offset,order:[['product_warehouse_policy_id','ASC']]});
    const inventory=require('./inventory')(db),data=[];
    for(const p of policies.rows){
      const b=await inventory.balance(p.product_id,p.warehouse_id);
      const ready=p.average_daily_demand!=null&&p.lead_time_days!=null&&p.lead_time_days>=0;
      const point=ready?round(d(p.average_daily_demand,4)*BigInt(p.lead_time_days),10n)+d(p.safety_stock,3):null;
      data.push({product_id:p.product_id,warehouse_id:p.warehouse_id,available:f(b.available,3),configured_reorder_point:p.reorder_point,calculated_reorder_point:point===null?null:f(point,3),needs_reorder:point===null?null:b.available<=point,inputs:{average_daily_demand:p.average_daily_demand,lead_time_days:p.lead_time_days,safety_stock:p.safety_stock,last_calculated_at:p.last_calculated_at},missing:ready?[]:['average_daily_demand and lead_time_days'],demand_source:'stored_policy_not_inferred'});
    }
    return {data,pagination:{page:pg.page,limit:pg.limit,total:policies.count}};
  },
});
