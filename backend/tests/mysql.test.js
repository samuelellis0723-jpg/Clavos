'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes}=require('crypto');
const {once}=require('events');
const {Op}=require('sequelize');
const {hashPassword,tokenHash}=require('../lib/password');
test('MySQL + HTTP: private purchase circuit, catalogue, imports and permissions (rollback only)',{skip:process.env.RUN_MYSQL_TESTS!=='1'},async t=>{
  const db=require('../models');
  try{await db.sequelize.authenticate();}catch(e){await db.sequelize.close();throw new Error(`MYSQL_UNAVAILABLE: ${e.original?.code||e.name}`);}
  const originalTransaction=db.sequelize.transaction.bind(db.sequelize),outer=await originalTransaction();
  const suffix=randomBytes(5).toString('hex'),createdUserIds=[];
  const hooks=['beforeFind','beforeCount','beforeSave','beforeBulkCreate','beforeBulkUpdate','beforeBulkDestroy'];
  for(const hook of hooks)db.sequelize.addHook(hook,'rollback-fixtures',(...args)=>{const opts=args[args.length-1];if(!opts.transaction)opts.transaction=outer;});
  db.sequelize.transaction=(options,callback)=>{
    if(typeof options==='function'){callback=options;options={};}
    return originalTransaction({...options,transaction:options?.transaction||outer},callback);
  };
  let server;
  t.after(async()=>{
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    db.sequelize.transaction=originalTransaction;
    for(const hook of hooks)db.sequelize.removeHook(hook,'rollback-fixtures');
    await outer.rollback();
    assert.equal(await db.users.count({where:{user_id:{[Op.in]:createdUserIds}}}),0,'fixture users must not persist');
    await db.sequelize.close();
  });
  const create=(model,values)=>db[model].create(values,{transaction:outer});
  const dept=await create('departments',{name:`test-${suffix}`});
  const center=await create('cost_centers',{code:`t-${suffix}`,name:'TEST rollback only',department_id:dept.department_id});
  let cur=await db.currencies.findByPk('XTS');
  if(!cur)cur=await create('currencies',{currency_code:'XTS',name:'ISO testing currency',decimal_places:2});
  assert.equal(cur.status,'active');
  const unit=await create('units_of_measure',{code:`t${suffix}`,name:'Test unit',allows_decimal:false});
  const category=await create('expense_categories',{code:`t${suffix}`,name:'Test category'});
  const product=await create('products',{sku:`t${suffix}`,name:`Test-${suffix}`,unit_id:unit.unit_id,category_id:category.category_id});
  await create('products',{sku:`i${suffix}`,name:`Inactive-${suffix}`,unit_id:unit.unit_id,category_id:category.category_id,status:'inactive'});
  const supplier=await create('suppliers',{supplier_code:`t${suffix}`,legal_name:'Synthetic test supplier - not EPA',default_currency_code:'XTS'});
  const equivalent=await create('supplier_products',{supplier_id:supplier.supplier_id,product_id:product.product_id,purchase_unit_id:unit.unit_id,pack_quantity:'1',currency_code:'XTS'});
  const source=await create('price_sources',{source_name:`test-${suffix}`,source_type:'manual'});
  const warehouse=await create('warehouses',{code:`a${suffix}`,name:'Test A'}),destination=await create('warehouses',{code:`b${suffix}`,name:'Test B'});
  const password=`Test-only-${randomBytes(12).toString('hex')}`,hash=await hashPassword(password),actors={};
  for(const name of ['requester','buyer','warehouse','finance','admin',`approver-${suffix}`]){
    const user=await create('users',{email:`${name}-${suffix}@example.invalid`,full_name:`Test ${name}`,department_id:dept.department_id});createdUserIds.push(user.user_id);
    let role=await db.roles.findOne({where:{name}});if(!role)role=await create('roles',{name});
    await create('user_roles',{user_id:user.user_id,role_id:role.role_id});
    const token=randomBytes(32).toString('hex');await create('auth_sessions',{token_hash:tokenHash(token),user_id:user.user_id,created_at:new Date(),expires_at:new Date(Date.now()+3600000)});
    actors[name]={...user.toJSON(),roles:[name],role_ids:[role.role_id],token};
    if(name==='requester')await create('auth_credentials',{user_id:user.user_id,password_hash:hash});
  }
  const approver=actors[`approver-${suffix}`];
  await create('approval_rules',{rule_name:`test-${suffix}`,min_amount:'0',max_amount:'1000',currency_code:'XTS',step_order:1,approver_role_id:approver.role_ids[0],department_id:dept.department_id});
  await create('approval_rules',{rule_name:`test-step2-${suffix}`,min_amount:'0',max_amount:'1000',currency_code:'XTS',step_order:2,approver_role_id:approver.role_ids[0],department_id:dept.department_id});
  const {createApp}=require('../app');server=createApp(db).listen(0,'127.0.0.1');await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}`;
  async function request(path,method='GET',body,actor,headers={}){
    const response=await fetch(base+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(actor?{Authorization:`Bearer ${actor.token}`} :{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
    const data=response.status===204?null:await response.json();return {status:response.status,...data};
  }
  async function ok(path,method,body,actor,status=200){const result=await request(path,method,body,actor);assert.equal(result.status,status,JSON.stringify(result));return result.data;}
  let req,order,receipt,invoice,payment;
  await t.test('HTTP boundary: CORS, JSON errors, 404, anonymous and insufficient permissions',async()=>{
    assert.equal((await request('/api/payments')).status,401);
    assert.equal((await request('/api/payments','GET',undefined,actors.requester)).status,403);
    assert.equal((await request('/api/purchase_orders','POST',{},actors.admin)).status,405);
    assert.equal((await request('/api/user_roles','POST',{},actors.admin)).status,405);
    assert.equal((await request('/api/products','POST',{sku:product.sku,name:'duplicate',unit_id:unit.unit_id,category_id:category.category_id},actors.admin)).status,409);
    assert.equal((await request('/api/operations/requisitions','POST',{requisition_number:'invalid',cost_center_id:center.cost_center_id,currency_code:'XTS',business_justification:'invalid',lines:[null]},actors.requester)).status,400);
    assert.equal((await request('/does-not-exist')).status,404);
    assert.equal((await request('/health','GET',undefined,null,{Origin:'https://evil.invalid'})).status,403);
    const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(response.status,400);assert.equal((await response.json()).error.code,'INVALID_JSON');
    assert.equal((await request('/api/operations/requisitions','GET',undefined,{token:'0'.repeat(64)})).status,401);
  });
  await t.test('login verifies password; logout revokes sessions and expiry is enforced',async()=>{
    const login=await ok('/api/auth/login','POST',{email:actors.requester.email,password},null);
    const logged={token:login.access_token};assert.equal((await ok('/api/auth/me','GET',undefined,logged)).user_id,actors.requester.user_id);
    await ok('/api/auth/logout','POST',{},logged,204);
    assert.equal((await request('/api/auth/me','GET',undefined,logged)).status,401);
    const token=randomBytes(32).toString('hex');await create('auth_sessions',{token_hash:tokenHash(token),user_id:actors.requester.user_id,created_at:new Date(0),expires_at:new Date(1)});
    assert.equal((await request('/api/auth/me','GET',undefined,{token})).status,401);
    assert.equal((await request('/api/auth/login','POST',{email:actors.requester.email,password:'wrong'})).status,401);
    const credential=await db.auth_credentials.findByPk(actors.requester.user_id);assert.equal(credential.failed_attempts,1);
    const missing=await request('/api/auth/login','POST',{email:`missing-${suffix}@example.invalid`,password:'wrong'}),wrong=await request('/api/auth/login','POST',{email:actors.requester.email,password:'wrong'});assert.deepEqual(missing.error,wrong.error);
  });
  await t.test('catalogue lists active products with relations and initially has no offers',async()=>{
    const list=await request(`/api/catalog/products?q=${suffix}`);assert.equal(list.status,200);assert.equal(list.data.length,1);assert.equal(list.data[0].category.category_id,category.category_id);assert.equal(list.data[0].unit.unit_id,unit.unit_id);
    const comparison=await ok(`/api/catalog/products/${product.product_id}/comparison`);assert.deepEqual(comparison.offers,[]);
  });
  await t.test('manual import persists row errors, excludes unvalidated data and deduplicates repeated batches',async()=>{
    const row={supplier_product_id:equivalent.supplier_product_id,observed_at:'2020-01-01T00:00:00Z',unit_price:'100.0000',currency_code:'XTS',price_includes_tax:true,available_quantity:'5.000',source_product_url:'https://example.invalid/test-fixture',is_validated:true};
    const body={price_source_id:source.price_source_id,price_basis:'per_purchase_unit',rows:[row,row,{...row,unit_price:'-1'},{...row,observed_at:'2020-01-02T00:00:00Z',is_validated:false}]};
    assert.equal((await request('/api/admin/price-imports','POST',body,actors.buyer)).status,403);
    const result=await ok('/api/admin/price-imports','POST',body,actors.admin,201);assert.equal(result.records_imported,2);assert.equal(result.records_rejected,2);assert.deepEqual(result.errors.map(e=>e.row),[2,3]);
    const persisted=await db.price_import_batches.findByPk(result.import_batch_id);assert.deepEqual(JSON.parse(persisted.error_summary).errors.map(e=>e.row),[2,3]);
    const repeated=await ok('/api/admin/price-imports','POST',{...body,rows:[row]},actors.admin,201);assert.equal(repeated.records_imported,0);assert.equal(repeated.errors[0].code,'DUPLICATE_OBSERVATION');
    const comparison=await ok(`/api/catalog/products/${product.product_id}/comparison`);assert.equal(comparison.offers.length,1);assert.equal(comparison.offers[0].observed_at,'2020-01-01T00:00:00.000Z');assert.equal(comparison.offers[0].unit_price,'100.0000');assert.ok(comparison.offers[0].comparison_group);assert.equal(comparison.offers[0].is_current_price_guaranteed,false);assert.equal(comparison.offers[0].supplier.email,undefined);
    await source.update({status:'inactive'},{transaction:outer});assert.deepEqual((await ok(`/api/catalog/products/${product.product_id}/comparison`)).offers,[]);await source.update({status:'active'},{transaction:outer});
  });
  await t.test('requisition approval is sequential and requires the actual assigned role',async()=>{
    req=await ok('/api/operations/requisitions','POST',{requisition_number:`R-${suffix}`,cost_center_id:center.cost_center_id,currency_code:'XTS',business_justification:'Synthetic transactional test',lines:[{product_id:product.product_id,quantity_requested:'2',estimated_unit_price:'120'}]},actors.requester,201);
    assert.equal(req.status,'draft');assert.equal(req.estimated_total,'240.00');
    assert.equal((await request(`/api/operations/requisitions/${req.requisition_id}/decision`,'POST',{decision:'approved'},approver)).status,409);
    await ok(`/api/operations/requisitions/${req.requisition_id}/submit`,'POST',{},actors.requester);
    assert.equal((await request(`/api/operations/requisitions/${req.requisition_id}/submit`,'POST',{},actors.requester)).status,409);
    assert.equal((await request(`/api/operations/requisitions/${req.requisition_id}/decision`,'POST',{decision:'approved'},actors.requester)).status,403);
    assert.equal((await request(`/api/operations/requisitions/${req.requisition_id}/decision`,'POST',{decision:'approved'},actors.admin)).status,403);
    assert.equal((await ok(`/api/operations/requisitions/${req.requisition_id}/decision`,'POST',{decision:'approved'},approver)).status,'under_review');
    assert.equal((await ok(`/api/operations/requisitions/${req.requisition_id}/decision`,'POST',{decision:'approved'},approver)).status,'approved');
  });
  await t.test('purchase order respects the approved budget and rollback leaves no invalid order',async()=>{
    const line=await db.requisition_lines.findOne({where:{requisition_id:req.requisition_id}});
    const body={po_number:`PO-${suffix}`,supplier_id:supplier.supplier_id,lines:[{requisition_line_id:line.requisition_line_id,supplier_product_id:equivalent.supplier_product_id,unit_price:'200',tax_rate:'0.13'}]};
    assert.equal((await request(`/api/operations/requisitions/${req.requisition_id}/orders`,'POST',body,actors.buyer)).status,409);
    assert.equal(await db.purchase_orders.count({where:{requisition_id:req.requisition_id}}),0);
    body.lines[0].unit_price='100';order=await ok(`/api/operations/requisitions/${req.requisition_id}/orders`,'POST',body,actors.buyer,201);assert.equal(order.total_amount,'226.00');
    await ok(`/api/operations/orders/${order.purchase_order_id}/send`,'POST',{},actors.buyer);
  });
  await t.test('receipts enforce quantities, rollback failed writes and add stock exactly once',async()=>{
    const line=await db.purchase_order_lines.findOne({where:{purchase_order_id:order.purchase_order_id}});
    const body={receipt_number:`RC-${suffix}`,warehouse_id:warehouse.warehouse_id,lines:[{purchase_order_line_id:line.purchase_order_line_id,quantity_received:'3',quantity_accepted:'3',quantity_rejected:'0'}]};
    assert.equal((await request(`/api/operations/orders/${order.purchase_order_id}/receipts`,'POST',body,actors.warehouse)).status,409);
    assert.equal(await db.receipts.count({where:{purchase_order_id:order.purchase_order_id}}),0);
    body.lines[0].quantity_received='1';body.lines[0].quantity_accepted='1';receipt=await ok(`/api/operations/orders/${order.purchase_order_id}/receipts`,'POST',body,actors.warehouse,201);
    assert.equal((await db.purchase_orders.findByPk(order.purchase_order_id)).status,'partially_received');
    assert.equal((await request(`/api/operations/orders/${order.purchase_order_id}/receipts`,'POST',body,actors.warehouse)).status,409);
    body.receipt_number=`RC2-${suffix}`;await ok(`/api/operations/orders/${order.purchase_order_id}/receipts`,'POST',body,actors.warehouse,201);
    const balance=await ok(`/api/operations/inventory/balance?product_id=${product.product_id}&warehouse_id=${warehouse.warehouse_id}`,'GET',undefined,actors.warehouse);assert.equal(balance.available,'2.000');
  });
  await t.test('real invoice values must match; approved invoice can be paid only once',async()=>{
    const line=await db.purchase_order_lines.findOne({where:{purchase_order_id:order.purchase_order_id}}),day=new Date().toISOString().slice(0,10);
    const body={invoice_number:`INV-${suffix}`,invoice_date:day,subtotal:'200.00',tax_total:'26.00',total_amount:'999.00',lines:[{purchase_order_line_id:line.purchase_order_line_id,quantity_invoiced:'2',unit_price:'100',tax_rate:'0.13'}]};
    assert.equal((await request(`/api/operations/orders/${order.purchase_order_id}/invoices`,'POST',body,actors.finance)).status,409);
    body.total_amount='226.00';invoice=await ok(`/api/operations/orders/${order.purchase_order_id}/invoices`,'POST',body,actors.finance,201);assert.equal(invoice.status,'matched');
    assert.equal((await request(`/api/operations/invoices/${invoice.invoice_id}/payments`,'POST',{payment_reference:`PAY-${suffix}`,payment_method:'transfer'},actors.finance)).status,409);
    await ok(`/api/operations/invoices/${invoice.invoice_id}/approve`,'POST',{},actors.finance);
    payment=await ok(`/api/operations/invoices/${invoice.invoice_id}/payments`,'POST',{payment_reference:`PAY-${suffix}`,payment_method:'transfer'},actors.finance,201);
    await ok(`/api/operations/payments/${payment.payment_id}/confirm`,'POST',{payment_date:day,bank_reference:'test-only'},actors.finance);
    assert.equal((await request(`/api/operations/payments/${payment.payment_id}/confirm`,'POST',{payment_date:day,bank_reference:'test-only'},actors.finance)).status,409);
    assert.equal((await db.supplier_invoices.findByPk(invoice.invoice_id)).status,'paid');
  });
  await t.test('stock transfers reject insufficient stock and preserve total quantities',async()=>{
    const body={movement_number:`TR-${suffix}`,product_id:product.product_id,from_warehouse_id:warehouse.warehouse_id,to_warehouse_id:destination.warehouse_id,quantity:'3'};
    assert.equal((await request('/api/operations/inventory/transfers','POST',body,actors.warehouse)).status,409);
    await create('stock_reservations',{product_id:product.product_id,warehouse_id:warehouse.warehouse_id,quantity_reserved:'1',created_by_user_id:actors.requester.user_id});
    body.quantity='2';assert.equal((await request('/api/operations/inventory/transfers','POST',body,actors.warehouse)).status,409);
    body.quantity='1';await ok('/api/operations/inventory/transfers','POST',body,actors.warehouse,201);
    const a=await ok(`/api/operations/inventory/balance?product_id=${product.product_id}&warehouse_id=${warehouse.warehouse_id}`,'GET',undefined,actors.warehouse),b=await ok(`/api/operations/inventory/balance?product_id=${product.product_id}&warehouse_id=${destination.warehouse_id}`,'GET',undefined,actors.warehouse);
    assert.equal(a.on_hand,'1.000');assert.equal(a.available,'0.000');assert.equal(b.on_hand,'1.000');
  });
  await t.test('analytics derives spend, evaluation and reorder from stored rows',async()=>{
    const day=new Date().toISOString().slice(0,10);
    const spending=await ok(`/api/operations/analytics/spend?date_from=${day}&date_to=${day}`,'GET',undefined,actors.finance);
    assert.equal(spending.find(x=>x.category_id===category.category_id&&x.currency_code==='XTS').total_amount,'226.00');
    const evaluation=await create('supplier_evaluations',{supplier_id:supplier.supplier_id,evaluated_by_user_id:actors.buyer.user_id});
    for(const [i,weight,score,weighted]of [[1,'0.25','2','0.5'],[2,'0.75','4','3']]){
      const criterion=await create('evaluation_criteria',{name:`test-${suffix}-${i}`,default_weight:weight});
      await create('supplier_evaluation_scores',{evaluation_id:evaluation.evaluation_id,criterion_id:criterion.criterion_id,weight_used:weight,score,weighted_score:weighted});
    }
    const calculation=await ok(`/api/operations/analytics/evaluations/${evaluation.evaluation_id}`,'GET',undefined,actors.buyer);assert.equal(calculation.weighted_average,'3.5000');assert.equal(calculation.meta.cross_supplier_ranking,false);
    await create('product_warehouse_policies',{product_id:product.product_id,warehouse_id:warehouse.warehouse_id,average_daily_demand:'2.5000',lead_time_days:4,safety_stock:'1.000'});
    const reorder=await ok(`/api/operations/analytics/reorder?product_id=${product.product_id}`,'GET',undefined,actors.warehouse);assert.equal(reorder[0].calculated_reorder_point,'11.000');assert.equal(reorder[0].needs_reorder,true);
  });

});
