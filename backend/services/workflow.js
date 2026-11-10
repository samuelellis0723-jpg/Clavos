'use strict';
const { Op } = require('sequelize');
const v = require('../lib/validation');
const { fail } = require('../lib/errors');
const { scaled: d, format: f, amounts, round } = require('../lib/decimal');
function permit(actor, roles) {
  if (!actor || !actor.roles?.some(x => roles.includes(x) || x === 'admin')) fail(403, 'FORBIDDEN', 'No tienes permiso para esta operación.');
}
function state(record, allowed) { if (!allowed.includes(record.status)) fail(409, 'INVALID_STATE', `Estado ${record.status} no permite la operación.`); }
function unique(values) { if (new Set(values).size !== values.length) fail(400, 'DUPLICATE_LINES', 'No se permiten filas repetidas.'); }
function selectRules(rules, req, today) {
  const total = d(req.estimated_total);
  const matching = rules.filter(r => r.is_active && r.currency_code === req.currency_code && (r.department_id == null || r.department_id === req.department_id) && (!r.valid_from || r.valid_from <= today) && (!r.valid_to || r.valid_to >= today) && total >= d(r.min_amount) && (r.max_amount == null || total <= d(r.max_amount)));
  if (!matching.length) fail(409, 'APPROVAL_POLICY_MISSING', 'No existe una regla de aprobación aplicable.');
  const steps = matching.map(r => v.id(r.step_order, 'step_order'));
  if (new Set(steps).size !== steps.length) fail(409, 'APPROVAL_POLICY_AMBIGUOUS', 'Hay reglas solapadas en el mismo paso.');
  return matching.sort((a,b) => a.step_order - b.step_order);
}
module.exports = db => {
  const tx = fn => db.sequelize.transaction(fn);
  const get = async (model, id, transaction, active = false) => {
    const row = await db[model].findByPk(id, { transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}) });
    if (!row) fail(404, 'NOT_FOUND', `No existe el recurso ${model}.`);
    if (active && row.status !== 'active') fail(409, 'INACTIVE_REFERENCE', `${model} no está activo.`);
    return row;
  };
  async function currency(code, t) { const c = await get('currencies', v.text(code, 'currency_code', 3), t, true); if (c.decimal_places !== 2) fail(409, 'UNSUPPORTED_CURRENCY_PRECISION', 'El circuito inicial admite monedas de dos decimales.'); return c; }
  async function quantity(product, value, t) {
    const qty = d(value, 3, { positive: true });
    const unit = await get('units_of_measure', product.unit_id, t);
    if (!unit.allows_decimal && qty % 1000n !== 0n) fail(400, 'FRACTIONAL_QUANTITY', 'La unidad no admite fracciones.');
    return qty;
  }
  return {
    async createRequisition(body, actor) {
      permit(actor, ['requester','buyer']);
      v.object(body, ['requisition_number','cost_center_id','currency_code','business_justification','needed_by_date','lines'], ['requisition_number','cost_center_id','currency_code','business_justification','lines']);
      v.lines(body.lines); unique(body.lines.map(l => v.id(l?.product_id)));
      return tx(async t => {
        const user = await get('users', actor.user_id, t, true);
        const center = await get('cost_centers', v.id(body.cost_center_id), t, true);
        if (!user.department_id || center.department_id !== user.department_id) fail(409, 'DEPARTMENT_MISMATCH', 'El centro de costo debe pertenecer al departamento del solicitante.');
        await get('departments', user.department_id, t, true); await currency(body.currency_code, t);
        const rows = []; let total = 0n;
        for (const line of body.lines) {
          v.object(line, ['product_id','quantity_requested','estimated_unit_price'], ['product_id','quantity_requested','estimated_unit_price']);
          const p = await get('products', v.id(line.product_id), t, true);
          await get('expense_categories', p.category_id, t, true);
          const qty = await quantity(p, line.quantity_requested, t), price = d(line.estimated_unit_price, 4, { positive: true });
          total += round(qty * price, 100000n);
          rows.push({ product_id: p.product_id, category_id: p.category_id, quantity_requested: f(qty,3), unit_id: p.unit_id, estimated_unit_price: f(price,4), currency_code: body.currency_code });
        }
        d(f(total));
        const req = await db.requisitions.create({ requisition_number: v.text(body.requisition_number, 'requisition_number', 40), requester_user_id: actor.user_id, department_id: user.department_id, cost_center_id: center.cost_center_id, currency_code: body.currency_code, business_justification: v.text(body.business_justification, 'business_justification', 10000), needed_by_date: body.needed_by_date ? v.date(body.needed_by_date) : null, estimated_total: f(total), status: 'draft' }, { transaction: t });
        for (const line of rows) await db.requisition_lines.create({ ...line, requisition_id: req.requisition_id }, { transaction: t });
        return req;
      });
    },
    async submit(id, actor) {
      permit(actor, ['requester','buyer']);
      return tx(async t => {
        const req = await get('requisitions', v.id(id), t); state(req, ['draft']);
        if (req.requester_user_id !== actor.user_id) fail(403, 'FORBIDDEN', 'Solo el solicitante puede enviar la requisición.');
        const reqLines = await db.requisition_lines.findAll({ where: { requisition_id: req.requisition_id }, transaction: t });
        if (!reqLines.length || reqLines.some(l => l.currency_code !== req.currency_code || l.estimated_unit_price == null)) fail(409, 'INVALID_REQUISITION', 'Líneas incompletas o monedas inconsistentes.');
        const recomputed = reqLines.reduce((sum, l) => sum + amounts(l.quantity_requested, l.estimated_unit_price, '0').subtotal, 0n);
        if (recomputed !== d(req.estimated_total)) fail(409, 'TOTAL_MISMATCH', 'El presupuesto no coincide con las líneas.');
        const rules = await db.approval_rules.findAll({ where: { is_active: true, currency_code: req.currency_code }, transaction: t, lock: t.LOCK.UPDATE });
        const selected = selectRules(rules, req, new Date().toISOString().slice(0,10));
        for (const rule of selected) await db.requisition_approvals.create({ requisition_id: req.requisition_id, approval_rule_id: rule.approval_rule_id, step_order: rule.step_order, status: 'pending' }, { transaction: t });
        return req.update({ status: 'submitted', submitted_at: new Date() }, { transaction: t });
      });
    },
    async decide(id, body, actor) {
      v.object(body, ['decision','comments'], ['decision']);
      if (!['approved','rejected'].includes(body.decision)) fail(400, 'INVALID_DECISION', 'decision debe ser approved o rejected.');
      return tx(async t => {
        const req = await get('requisitions', v.id(id), t); state(req, ['submitted','under_review']);
        if (req.requester_user_id === actor.user_id) fail(403, 'SELF_APPROVAL', 'El solicitante no puede aprobar su requisición.');
        const steps = await db.requisition_approvals.findAll({ where: { requisition_id: req.requisition_id }, order: [['step_order','ASC']], transaction: t, lock: t.LOCK.UPDATE });
        const pending = steps.find(s => s.status === 'pending');
        if (!pending) fail(409, 'NO_PENDING_APPROVAL', 'No hay un paso pendiente.');
        const rule = await get('approval_rules', pending.approval_rule_id, t);
        const assignment = await db.user_roles.findOne({ where: { user_id: actor.user_id, role_id: rule.approver_role_id }, transaction: t, lock: t.LOCK.UPDATE });
        if (!assignment) fail(403, 'APPROVER_ROLE_REQUIRED', 'Se requiere el rol del paso actual; admin no lo reemplaza.');
        await pending.update({ status: body.decision, approver_user_id: actor.user_id, decided_at: new Date(), comments: body.comments ? v.text(body.comments, 'comments', 10000) : null }, { transaction: t });
        const next = body.decision === 'rejected' ? 'rejected' : steps.some(s => s.status === 'pending') ? 'under_review' : 'approved';
        return req.update({ status: next }, { transaction: t });
      });
    },
    async createOrder(id, body, actor) {
      permit(actor, ['buyer']);
      v.object(body, ['po_number','supplier_id','lines','expected_delivery_date'], ['po_number','supplier_id','lines']);
      v.lines(body.lines); unique(body.lines.map(l => v.id(l?.requisition_line_id)));
      return tx(async t => {
        const req = await get('requisitions', v.id(id), t); state(req, ['approved']);
        await get('suppliers', v.id(body.supplier_id), t, true);
        const reqLines = await db.requisition_lines.findAll({ where: { requisition_id: req.requisition_id }, transaction: t });
        if (reqLines.length !== body.lines.length) fail(409, 'COMPLETE_ORDER_REQUIRED', 'El recorrido inicial ordena todas las líneas en un único proveedor.');
        if (await db.purchase_orders.findOne({ where: { requisition_id: req.requisition_id }, transaction: t })) fail(409, 'ORDER_EXISTS', 'La requisición ya tiene una orden.');
        const rows = []; let subtotal = 0n, tax = 0n;
        for (const line of body.lines) {
          v.object(line, ['requisition_line_id','supplier_product_id','unit_price','tax_rate'], ['requisition_line_id','supplier_product_id','unit_price','tax_rate']);
          const r = reqLines.find(x => x.requisition_line_id === v.id(line.requisition_line_id));
          if (!r) fail(409, 'LINE_MISMATCH', 'Línea ajena a la requisición.');
          const p = await get('products', r.product_id, t, true), sp = await get('supplier_products', v.id(line.supplier_product_id), t, true);
          if (sp.product_id !== r.product_id || sp.supplier_id !== Number(body.supplier_id)) fail(409, 'EQUIVALENT_MISMATCH', 'Producto equivalente/proveedor no coincide.');
          if (sp.purchase_unit_id !== r.unit_id || p.unit_id !== r.unit_id || d(sp.pack_quantity,3) !== 1000n) fail(409, 'UNIT_CONVERSION_REQUIRED', 'Solo se admite presentación de una unidad base en este circuito.');
          if (sp.currency_code !== req.currency_code) fail(409, 'CURRENCY_MISMATCH', 'Monedas diferentes requieren una conversión no definida.');
          if (sp.minimum_order_quantity != null && d(r.quantity_requested,3) < d(sp.minimum_order_quantity,3)) fail(409, 'MINIMUM_QUANTITY', 'No alcanza el mínimo del proveedor.');
          await quantity(p, r.quantity_requested, t);
          const a = amounts(r.quantity_requested, line.unit_price, line.tax_rate); subtotal += a.subtotal; tax += a.tax;
          rows.push({ r, supplier_product_id: sp.supplier_product_id, unit_price: f(d(line.unit_price,4),4), tax_rate: f(d(line.tax_rate,4),4), line_total: f(a.total) });
        }
        if (subtotal + tax > d(req.estimated_total)) fail(409, 'APPROVED_BUDGET_EXCEEDED', 'El total con impuestos supera el presupuesto aprobado.');
        const approvals = await db.requisition_approvals.findAll({ where: { requisition_id: req.requisition_id }, order: [['step_order','DESC']], transaction: t });
        if (!approvals.length || approvals.some(a => a.status !== 'approved')) fail(409, 'APPROVAL_REQUIRED', 'No existe una aprobación registrada.');
        const order = await db.purchase_orders.create({ po_number: v.text(body.po_number,'po_number',40), supplier_id: Number(body.supplier_id), requisition_id: req.requisition_id, created_by_user_id: actor.user_id, approved_by_user_id: approvals[0].approver_user_id, currency_code: req.currency_code, subtotal: f(subtotal), tax_total: f(tax), total_amount: f(subtotal+tax), status: 'draft', expected_delivery_date: body.expected_delivery_date ? v.date(body.expected_delivery_date) : null }, { transaction: t });
        for (const { r, ...line } of rows) {
          const poLine = await db.purchase_order_lines.create({ ...line, purchase_order_id: order.purchase_order_id, product_id: r.product_id, quantity_ordered: r.quantity_requested, unit_id: r.unit_id, category_id: r.category_id }, { transaction: t });
          await db.requisition_order_allocations.create({ requisition_line_id: r.requisition_line_id, purchase_order_line_id: poLine.purchase_order_line_id, quantity_allocated: r.quantity_requested }, { transaction: t });
        }
        await req.update({ status: 'ordered' }, { transaction: t });
        return order;
      });
    },
    async sendOrder(id, actor) {
      permit(actor, ['buyer']);
      return tx(async t => { const order = await get('purchase_orders', v.id(id), t); state(order, ['draft']); return order.update({ status: 'sent', ordered_at: new Date() }, { transaction: t }); });
    },
    async receive(id, body, actor) {
      permit(actor, ['warehouse']);
      v.object(body, ['receipt_number','warehouse_id','lines'], ['receipt_number','warehouse_id','lines']);
      v.lines(body.lines); unique(body.lines.map(l => v.id(l?.purchase_order_line_id)));
      return tx(async t => {
        const order = await get('purchase_orders', v.id(id), t); state(order, ['sent','acknowledged','partially_received']);
        const warehouse = await get('warehouses', v.id(body.warehouse_id), t, true);
        const orderLines = await db.purchase_order_lines.findAll({ where: { purchase_order_id: order.purchase_order_id }, order: [['product_id','ASC']], transaction: t });
        const prior = await db.receipt_lines.findAll({ where: { purchase_order_line_id: { [Op.in]: orderLines.map(l => l.purchase_order_line_id) } }, include: [{ model: db.receipts, as: 'receiptId', where: { status: 'posted' } }], transaction: t });
        const accepted = new Map(orderLines.map(l => [l.purchase_order_line_id, prior.filter(r => r.purchase_order_line_id === l.purchase_order_line_id).reduce((s,r) => s+d(r.quantity_accepted,3),0n)]));
        const receipt = await db.receipts.create({ receipt_number: v.text(body.receipt_number,'receipt_number',40), purchase_order_id: order.purchase_order_id, received_by_user_id: actor.user_id, status: 'posted' }, { transaction: t });
        let movement;
        for (const line of [...body.lines].sort((a,b)=>a.purchase_order_line_id-b.purchase_order_line_id)) {
          v.object(line,['purchase_order_line_id','quantity_received','quantity_accepted','quantity_rejected','rejection_reason'],['purchase_order_line_id','quantity_received','quantity_accepted','quantity_rejected']);
          const po = orderLines.find(x => x.purchase_order_line_id === v.id(line.purchase_order_line_id));
          if (!po) fail(409,'LINE_MISMATCH','La línea no pertenece a la orden.');
          const p = await get('products',po.product_id,t,true);
          const received = await quantity(p,line.quantity_received,t), accept = d(line.quantity_accepted,3), reject = d(line.quantity_rejected,3);
          if (accept+reject !== received || accepted.get(po.purchase_order_line_id)+received > d(po.quantity_ordered,3)) fail(409,'RECEIPT_QUANTITY','Cantidades inconsistentes o superiores al pendiente.');
          if (accept > 0n) await quantity(p,line.quantity_accepted,t);
          if (reject > 0n) await quantity(p,line.quantity_rejected,t);
          const receiptLine = await db.receipt_lines.create({ receipt_id: receipt.receipt_id, purchase_order_line_id: po.purchase_order_line_id, quantity_received: f(received,3), quantity_accepted: f(accept,3), quantity_rejected: f(reject,3), rejection_reason: reject > 0n ? v.text(line.rejection_reason,'rejection_reason',10000) : null }, { transaction: t });
          accepted.set(po.purchase_order_line_id,accepted.get(po.purchase_order_line_id)+accept);
          if (p.is_stockable && accept > 0n) {
            if (!movement) movement = await db.inventory_movements.create({ movement_number: `receipt:${receipt.receipt_id}`, movement_type: 'receipt', created_by_user_id: actor.user_id, reference_type: 'receipt', reference_id: receipt.receipt_id }, { transaction: t });
            await db.inventory_movement_lines.create({ inventory_movement_id: movement.inventory_movement_id, product_id: p.product_id, warehouse_id: warehouse.warehouse_id, quantity_change: f(accept,3), unit_cost: po.unit_price, currency_code: order.currency_code, receipt_line_id: receiptLine.receipt_line_id }, { transaction: t });
          }
        }
        const complete = orderLines.every(l=>accepted.get(l.purchase_order_line_id) === d(l.quantity_ordered,3));
        await order.update({ status: complete ? 'received' : 'partially_received' },{ transaction: t });
        return receipt;
      });
    },
    async invoice(id, body, actor) {
      permit(actor,['finance']); v.object(body,['invoice_number','invoice_date','due_date','subtotal','tax_total','total_amount','lines'],['invoice_number','invoice_date','subtotal','tax_total','total_amount','lines']);
      v.lines(body.lines); unique(body.lines.map(l=>v.id(l?.purchase_order_line_id)));
      return tx(async t => {
        const order=await get('purchase_orders',v.id(id),t); state(order,['received']);
        if (await db.supplier_invoices.findOne({where:{purchase_order_id:order.purchase_order_id},transaction:t})) fail(409,'INVOICE_EXISTS','La orden ya está facturada.');
        for (const field of ['subtotal','tax_total','total_amount']) if (d(body[field])!==d(order[field])) fail(409,'INVOICE_AMOUNT_MISMATCH','La factura real no coincide con la orden; requiere resolver discrepancias.');
        const invoiceDate=v.date(body.invoice_date), due=body.due_date ? v.date(body.due_date) : null;
        if (due && due<invoiceDate) fail(400,'INVALID_DUE_DATE','El vencimiento no puede preceder a la fecha de factura.');
        const lines=await db.purchase_order_lines.findAll({where:{purchase_order_id:order.purchase_order_id},transaction:t});
        if(lines.length!==body.lines.length)fail(409,'INVOICE_LINE_MISMATCH','Se requiere la factura completa para esta orden.');
        for(const line of lines){
          const supplied=body.lines.find(x=>Number(x.purchase_order_line_id)===line.purchase_order_line_id);
          if(!supplied)fail(409,'INVOICE_LINE_MISMATCH','Falta una línea de la orden.');
          v.object(supplied,['purchase_order_line_id','quantity_invoiced','unit_price','tax_rate'],['purchase_order_line_id','quantity_invoiced','unit_price','tax_rate']);
          if(d(supplied.quantity_invoiced,3)!==d(line.quantity_ordered,3)||d(supplied.unit_price,4)!==d(line.unit_price,4)||d(supplied.tax_rate,4)!==d(line.tax_rate,4))fail(409,'INVOICE_LINE_MISMATCH','Cantidad, precio o impuesto de factura no coincide.');
        }
        const invoice=await db.supplier_invoices.create({supplier_id:order.supplier_id,purchase_order_id:order.purchase_order_id,invoice_number:v.text(body.invoice_number,'invoice_number',100),invoice_date:invoiceDate,due_date:due,currency_code:order.currency_code,subtotal:order.subtotal,tax_total:order.tax_total,total_amount:order.total_amount,status:'matched'}, {transaction:t});
        for(const line of lines) {
          const received=await db.receipt_lines.findAll({where:{purchase_order_line_id:line.purchase_order_line_id},include:[{model:db.receipts,as:'receiptId',where:{status:'posted'}}],transaction:t});
          if(received.reduce((s,r)=>s+d(r.quantity_accepted,3),0n)!==d(line.quantity_ordered,3)) fail(409,'UNMATCHED_INVOICE','La recepción no coincide con la orden.');
          const invLine=await db.invoice_lines.create({invoice_id:invoice.invoice_id,purchase_order_line_id:line.purchase_order_line_id,product_id:line.product_id,description:line.description||`Producto ${line.product_id}`,quantity_invoiced:line.quantity_ordered,unit_id:line.unit_id,unit_price:line.unit_price,tax_rate:line.tax_rate,line_total:line.line_total,category_id:line.category_id},{transaction:t});
          for(const r of received) if(d(r.quantity_accepted,3)>0n) await db.invoice_receipt_allocations.create({invoice_line_id:invLine.invoice_line_id,receipt_line_id:r.receipt_line_id,quantity_matched:r.quantity_accepted},{transaction:t});
        }
        return invoice;
      });
    },
    async approveInvoice(id,actor) { permit(actor,['finance']); return tx(async t=>{const row=await get('supplier_invoices',v.id(id),t);state(row,['matched']);return row.update({status:'approved',reviewed_by_user_id:actor.user_id},{transaction:t});}); },
    async schedulePayment(id,body,actor) {
      permit(actor,['finance']);v.object(body,['payment_reference','payment_method'],['payment_reference','payment_method']);
      return tx(async t=>{
        const invoice=await get('supplier_invoices',v.id(id),t);state(invoice,['approved']);
        if(await db.payment_allocations.findOne({where:{invoice_id:invoice.invoice_id},transaction:t})) fail(409,'PAYMENT_EXISTS','Ya existe un pago asociado.');
        if(d(invoice.total_amount)<=0n) fail(409,'INVALID_AMOUNT','El total debe ser positivo.');
        const payment=await db.payments.create({payment_reference:v.text(body.payment_reference,'payment_reference',100),currency_code:invoice.currency_code,amount:invoice.total_amount,payment_method:v.text(body.payment_method,'payment_method',40),status:'scheduled',created_by_user_id:actor.user_id},{transaction:t});
        await db.payment_allocations.create({payment_id:payment.payment_id,invoice_id:invoice.invoice_id,amount_applied:invoice.total_amount},{transaction:t});
        return payment;
      });
    },
    async confirmPayment(id,body,actor) {
      permit(actor,['finance']);v.object(body,['payment_date','bank_reference'],['payment_date','bank_reference']);
      return tx(async t=>{
        const payment=await get('payments',v.id(id),t);state(payment,['scheduled']);
        const allocations=await db.payment_allocations.findAll({where:{payment_id:payment.payment_id},transaction:t});
        if(allocations.length!==1) fail(409,'UNSUPPORTED_ALLOCATION','Solo se admite un pago completo a una factura.');
        const invoice=await get('supplier_invoices',allocations[0].invoice_id,t);state(invoice,['approved']);
        if(payment.currency_code!==invoice.currency_code || d(payment.amount)!==d(invoice.total_amount)||d(allocations[0].amount_applied)!==d(payment.amount)) fail(409,'PAYMENT_MISMATCH','Monto o moneda del pago no coincide.');
        const day=v.date(body.payment_date);
        if(day<invoice.invoice_date || day>new Date().toISOString().slice(0,10)) fail(400,'INVALID_PAYMENT_DATE','Fecha de pago fuera del intervalo permitido.');
        await payment.update({status:'completed',payment_date:day,bank_reference:v.text(body.bank_reference,'bank_reference',120),confirmed_by_user_id:actor.user_id},{transaction:t});
        await invoice.update({status:'paid'},{transaction:t});
        return payment;
      });
    },
    async detail(kind,id,actor) {
      const definitions={requisitions:['requisitions','requisition_lines','requisition_id'],orders:['purchase_orders','purchase_order_lines','purchase_order_id'],receipts:['receipts','receipt_lines','receipt_id'],invoices:['supplier_invoices','invoice_lines','invoice_id'],payments:['payments','payment_allocations','payment_id']};
      const spec=definitions[kind];if(!spec) fail(404,'NOT_FOUND','Recurso no encontrado.');
      const row=await get(spec[0],v.id(id));
      if(kind==='requisitions' && row.requester_user_id===actor.user_id) { /* owner can read */ }
      else if(kind==='requisitions' && await db.requisition_approvals.findOne({where:{requisition_id:row.requisition_id},include:[{model:db.approval_rules,as:'approvalRuleId',where:{approver_role_id:{[Op.in]:actor.role_ids}}}]})) { /* assigned approver can read */ }
      else permit(actor, kind==='payments'||kind==='invoices' ? ['finance'] : ['buyer','warehouse','finance']);
      const result={...row.toJSON(),lines:await db[spec[1]].findAll({where:{[spec[2]]:Number(id)}})};
      if(kind==='requisitions') result.approvals=await db.requisition_approvals.findAll({where:{requisition_id:Number(id)},order:[['step_order','ASC']]});
      return result;
    },
  };
};
module.exports.permit=permit;
module.exports.selectRules=selectRules;
module.exports.state=state;
