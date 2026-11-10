'use strict';
module.exports = {
  async up(q) {
    const indexes=await q.showIndex('supplier_products');
    if(!indexes.some(i=>!i.unique&&i.fields.map(f=>f.attribute).join(',')==='supplier_id,supplier_sku')) {
      await q.addIndex('supplier_products',['supplier_id','supplier_sku'],{name:'idx_supplier_products_supplier_sku',unique:false});
    }
  },
  async down(){throw new Error('Automatic index removal is disabled. Review a forward migration if needed.');},
};
