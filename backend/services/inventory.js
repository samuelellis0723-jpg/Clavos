'use strict';
const { Op } = require('sequelize');
const v = require('../lib/validation');
const { fail } = require('../lib/errors');
const { scaled: d, format: f } = require('../lib/decimal');
const { permit } = require('./workflow');
module.exports = db => {
  async function balance(productId,warehouseId,transaction) {
    const where={product_id:productId,warehouse_id:warehouseId};
    const changes=await db.inventory_movement_lines.findAll({where,attributes:['quantity_change'],transaction});
    const reservations=await db.stock_reservations.findAll({where:{...where,released_at:null,[Op.or]:[{expires_at:null},{expires_at:{[Op.gt]:new Date()}}]},attributes:['quantity_reserved'],transaction});
    const stock=changes.reduce((s,r)=>s+d(r.quantity_change,3,{signed:true}),0n), reserved=reservations.reduce((s,r)=>s+d(r.quantity_reserved,3),0n);
    return {stock,reserved,available:stock-reserved};
  }
  return {
    balance,
    async getBalance(query,actor) {
      permit(actor,['warehouse','buyer','analyst']);v.object(query,['product_id','warehouse_id'],['product_id','warehouse_id']);
      const product_id=v.id(query.product_id),warehouse_id=v.id(query.warehouse_id);
      if(!await db.products.findByPk(product_id)||!await db.warehouses.findByPk(warehouse_id))fail(404,'NOT_FOUND','Producto o almacén no encontrado.');
      return db.sequelize.transaction(async transaction=>{
        const b=await balance(product_id,warehouse_id,transaction);
        return {product_id,warehouse_id,on_hand:f(b.stock,3),reserved:f(b.reserved,3),available:f(b.available,3)};
      });
    },
    async transfer(body,actor) {
      permit(actor,['warehouse']);v.object(body,['movement_number','product_id','from_warehouse_id','to_warehouse_id','quantity'],['movement_number','product_id','from_warehouse_id','to_warehouse_id','quantity']);
      const product_id=v.id(body.product_id),from=v.id(body.from_warehouse_id),to=v.id(body.to_warehouse_id),q=d(body.quantity,3,{positive:true});
      if(from===to)fail(400,'SAME_WAREHOUSE','Los almacenes deben ser distintos.');
      const number=v.text(body.movement_number,'movement_number',35);
      return db.sequelize.transaction(async t=>{
        // All stock writers lock the product, so transfers and receipts cannot overspend stock.
        const p=await db.products.findByPk(product_id,{transaction:t,lock:t.LOCK.UPDATE});
        if(!p||p.status!=='active'||!p.is_stockable)fail(409,'INVALID_PRODUCT','Se requiere un producto activo inventariable.');
        const unit=await db.units_of_measure.findByPk(p.unit_id,{transaction:t});
        if(!unit.allows_decimal&&q%1000n!==0n)fail(400,'FRACTIONAL_QUANTITY','La unidad no admite fracciones.');
        for(const id of [from,to].sort((a,b)=>a-b)) {
          const warehouse=await db.warehouses.findByPk(id,{transaction:t,lock:t.LOCK.UPDATE});
          if(!warehouse||warehouse.status!=='active')fail(409,'INVALID_WAREHOUSE','Almacén no activo.');
        }
        if(await db.inventory_movement_lines.findOne({where:{product_id,warehouse_id:from,lot_id:{[Op.ne]:null}},transaction:t}))fail(409,'LOT_POLICY_REQUIRED','Este producto requiere selección de lotes; ese flujo aún no está habilitado.');
        const b=await balance(product_id,from,t);
        if(b.available<q)fail(409,'INSUFFICIENT_STOCK','Existencias disponibles insuficientes.');
        const out=await db.inventory_movements.create({movement_number:`${number}:out`,movement_type:'transfer_out',created_by_user_id:actor.user_id,reference_type:'transfer'},{transaction:t});
        const incoming=await db.inventory_movements.create({movement_number:`${number}:in`,movement_type:'transfer_in',created_by_user_id:actor.user_id,reference_type:'transfer',reference_id:out.inventory_movement_id},{transaction:t});
        await out.update({reference_id:incoming.inventory_movement_id},{transaction:t});
        for(const [movement,warehouse_id,quantity] of [[out,from,-q],[incoming,to,q]]) await db.inventory_movement_lines.create({inventory_movement_id:movement.inventory_movement_id,product_id,warehouse_id,quantity_change:f(quantity,3)},{transaction:t});
        return {outgoing_movement_id:out.inventory_movement_id,incoming_movement_id:incoming.inventory_movement_id};
      });
    },
  };
};
