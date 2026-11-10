'use strict';
const { ApiError }=require('../lib/errors');
const v=require('../lib/validation');
const {scaled}=require('../lib/decimal');
// Deliberate allowlist: adding a controller does not expose new writes.
const editable={
  departments:['name','description','status'],cost_centers:['name','status'],currencies:['name','symbol','status'],
  units_of_measure:['name'],expense_categories:['name','description','status'],products:['name','description','brand','model','status'],
  suppliers:['trade_name','email','phone','website','address','status'],supplier_contacts:['full_name','email','phone','role_title','is_primary','status'],
  supplier_products:['status'],price_sources:['status'],warehouses:['name','address','status'],
};
const creatable=new Set([...Object.keys(editable),'product_identifiers','approval_rules','product_warehouse_policies','evaluation_criteria']);
const removable=new Set(['departments','cost_centers','units_of_measure','expense_categories','supplier_contacts','product_identifiers','warehouses']);
module.exports=(resource,operation)=>(req,res,next)=>{
  const allowed=operation==='create'?creatable.has(resource):operation==='update'?!!editable[resource]:removable.has(resource);
  if(!allowed)return next(new ApiError(405,'USE_CASE_REQUIRED','Escritura genérica deshabilitada. Utiliza el caso de uso documentado.'));
  if(operation==='update')v.object(req.body,editable[resource]);
  if(operation==='create'&&resource==='supplier_products')scaled(req.body?.pack_quantity??1,3,{positive:true,precision:12});
  if(operation==='create'&&resource==='approval_rules'){
    v.id(req.body?.step_order,'step_order');const min=scaled(req.body?.min_amount??0),max=req.body?.max_amount==null?null:scaled(req.body.max_amount);
    if(max!==null&&max<min)return next(new ApiError(400,'INVALID_RANGE','max_amount debe ser mayor o igual a min_amount.'));
    if(req.body.valid_from)v.date(req.body.valid_from);if(req.body.valid_to)v.date(req.body.valid_to);
    if(req.body.valid_from&&req.body.valid_to&&req.body.valid_to<req.body.valid_from)return next(new ApiError(400,'INVALID_RANGE','Vigencia inválida.'));
  }
  next();
};
module.exports.editable=editable;
module.exports.creatable=creatable;
module.exports.removable=removable;
