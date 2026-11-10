'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {UniqueConstraintError,ValidationError,ValidationErrorItem}=require('sequelize');
const {errorHandler}=require('../lib/errors');
const v=require('../lib/validation');
const decimal=require('../lib/decimal');
const {selectRules,state,permit}=require('../services/workflow');
const {offerDTO}=require('../services/catalog');
const {validateRow}=require('../services/price-import');
const policy=require('../middleware/crud-policy');
const {hashPassword,verifyPassword}=require('../lib/password');
test('central errors distinguish uniqueness from validation and hide database details',()=>{
  const run=error=>{let status,result;errorHandler(error,{}, {status(n){status=n;return this;},json(x){result=x;}},()=>{});return {status,result};};
  assert.equal(run(new UniqueConstraintError({errors:[]})).status,409);
  assert.equal(run(new ValidationError('private', [new ValidationErrorItem('secret value','validation','name')])).status,400);
  const response=run({name:'SequelizeDatabaseError',message:'password=private SQL'});assert.equal(response.status,500);assert.ok(!JSON.stringify(response).includes('private'));
  assert.equal(run({type:'entity.parse.failed'}).status,400);
});
test('fixed-point totals round per line, without floating-point accumulation',()=>{
  assert.deepEqual(decimal.amounts('3.000','0.1000','0.1300'),{subtotal:30n,tax:4n,total:34n});
  assert.equal(decimal.format(decimal.scaled('9999999999.9999',4),4),'9999999999.9999');
  assert.throws(()=>decimal.amounts('1','2','1.01'),{code:'INVALID_TAX_RATE'});
  assert.throws(()=>decimal.scaled('1e4'),{code:'INVALID_DECIMAL'});
  assert.throws(()=>decimal.scaled([1]),{code:'INVALID_DECIMAL'});
  assert.throws(()=>decimal.scaled('1.00001',4),{code:'INVALID_DECIMAL'});
});
test('date, ID, object and pagination validation reject malformed input',()=>{
  assert.throws(()=>v.date('2026-02-30'),{code:'INVALID_DATE'});
  assert.throws(()=>v.date('2026-99-99'),{code:'INVALID_DATE'});
  assert.throws(()=>v.id('1 OR 1'),{code:'INVALID_ID'});
  assert.throws(()=>v.id([1]),{code:'INVALID_ID'});
  assert.throws(()=>v.page({limit:101}),{code:'INVALID_PAGINATION'});
  assert.throws(()=>v.page({status:'inactive'}),{code:'UNKNOWN_FIELDS'});
});
test('approval policy fails closed on missing or overlapping rules and sorts steps',()=>{
  const req={department_id:1,currency_code:'CRC',estimated_total:'100.00'};
  const base={is_active:true,currency_code:'CRC',department_id:1,min_amount:'0',max_amount:'100',step_order:1};
  assert.throws(()=>selectRules([],req,'2026-01-01'),{code:'APPROVAL_POLICY_MISSING'});
  assert.throws(()=>selectRules([base,{...base}],req,'2026-01-01'),{code:'APPROVAL_POLICY_AMBIGUOUS'});
  assert.deepEqual(selectRules([{...base,step_order:3},base],req,'2026-01-01').map(r=>r.step_order),[1,3]);
  assert.throws(()=>selectRules([{...base,valid_to:'2025-01-01'}],req,'2026-01-01'),{code:'APPROVAL_POLICY_MISSING'});
});
test('invalid transitions and roles are rejected',()=>{
  assert.throws(()=>state({status:'paid'},['approved']),{code:'INVALID_STATE'});
  assert.throws(()=>permit({roles:['requester']},['finance']),{status:403});
  assert.throws(()=>permit(null,['admin']),{status:403});
});
test('price groups separate currency, tax and packaging; legacy basis is not comparable',()=>{
  const sp={supplier_product_id:1,purchase_unit_id:1,pack_quantity:'1.000',supplierId:{supplier_id:1},purchaseUnitId:{unit_id:1}};
  const obs={price_observation_id:1,unit_price:'100',currency_code:'CRC',price_includes_tax:true,observed_at:'2020-01-01T00:00:00Z',importBatchId:{error_summary:JSON.stringify({version:1,price_basis:'per_purchase_unit'})}};
  const a=offerDTO(sp,obs,new Date('2026-01-01'),24);
  assert.equal(a.freshness,'stale');assert.equal(a.is_current_price_guaranteed,false);
  assert.notEqual(a.comparison_group,offerDTO(sp,{...obs,currency_code:'USD'}).comparison_group);
  assert.notEqual(a.comparison_group,offerDTO(sp,{...obs,price_includes_tax:false}).comparison_group);
  assert.notEqual(a.comparison_group,offerDTO({...sp,pack_quantity:'10'},obs).comparison_group);
  assert.equal(offerDTO(sp,{...obs,importBatchId:null}).comparison_group,null);
  assert.equal(offerDTO(sp,obs,new Date('2026-01-01'),'').freshness,'age_policy_not_configured');
});
test('import validates actual date, money, explicit tax and provenance URL',()=>{
  const row={supplier_product_id:1,observed_at:'2020-01-01T00:00:00Z',unit_price:'100.25',currency_code:'CRC',price_includes_tax:true,is_validated:true};
  assert.equal(validateRow(row).unit_price,'100.2500');
  assert.throws(()=>validateRow({...row,unit_price:-1}),{code:'INVALID_DECIMAL'});
  assert.throws(()=>validateRow({...row,price_includes_tax:'true'}),{code:'INVALID_BOOLEAN'});
  assert.throws(()=>validateRow({...row,observed_at:'2099-01-01T00:00:00Z'}),{code:'FUTURE_OBSERVATION'});
  assert.throws(()=>validateRow({...row,source_product_url:'file:///etc/passwd'}),{code:'INVALID_URL'});
});
test('generic historical writes are blocked even for administrators',()=>{
  for(const resource of ['payments','purchase_orders','requisition_approvals','inventory_movements','supplier_price_observations','user_roles']){
    let err;policy(resource,'create')({body:{}},{},e=>{err=e;});assert.equal(err.status,405);
  }
  assert.throws(()=>policy('products','update')({body:{unit_id:2}},{},()=>{}),{code:'UNKNOWN_FIELDS'});
});
test('catalog query constrains active records and validates pagination before querying',async()=>{
  let options;
  const db={products:{findAndCountAll:async opts=>{options=opts;return {rows:[],count:0};}},expense_categories:{},units_of_measure:{}};
  const catalog=require('../services/catalog')(db);
  assert.deepEqual((await catalog.list({q:'clavo',category_id:'1',page:'2',limit:'10'})).data,[]);
  assert.equal(options.where.status,'active');assert.equal(options.where.category_id,1);assert.equal(options.offset,10);assert.equal(options.include[0].where.status,'active');
  await assert.rejects(()=>catalog.list({limit:'-1'}),{code:'INVALID_ID'});
});
test('password derivation verifies authentic input and rejects invalid hashes',async()=>{
  const password='unit-test-only-not-an-account';
  const hash=await hashPassword(password);
  assert.equal(await verifyPassword(password,hash),true);
  assert.equal(await verifyPassword('incorrect',hash),false);
  assert.equal(await verifyPassword(password,'invalid'),false);
});
