'use strict';

const { DataTypes, Sequelize } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    if (!(await queryInterface.tableExists("departments"))) {
      await queryInterface.createTable("departments", {
        "department_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "name": { type: DataTypes.STRING(120), allowNull: false, unique: true },
        "description": { type: DataTypes.TEXT },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("cost_centers"))) {
      await queryInterface.createTable("cost_centers", {
        "cost_center_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "code": { type: DataTypes.STRING(30), allowNull: false, unique: true },
        "name": { type: DataTypes.STRING(120), allowNull: false },
        "department_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "departments", key: "department_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
      });
    }
    if (!(await queryInterface.tableExists("users"))) {
      await queryInterface.createTable("users", {
        "user_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "department_id": { type: DataTypes.INTEGER, references: { model: "departments", key: "department_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "full_name": { type: DataTypes.STRING(160), allowNull: false },
        "email": { type: DataTypes.STRING(180), allowNull: false, unique: true },
        "job_title": { type: DataTypes.STRING(120) },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("roles"))) {
      await queryInterface.createTable("roles", {
        "role_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "name": { type: DataTypes.STRING(80), allowNull: false, unique: true },
        "description": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("user_roles"))) {
      await queryInterface.createTable("user_roles", {
        "user_id": { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "role_id": { type: DataTypes.INTEGER, primaryKey: true, allowNull: false, references: { model: "roles", key: "role_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "assigned_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("currencies"))) {
      await queryInterface.createTable("currencies", {
        "currency_code": { type: DataTypes.CHAR(3), primaryKey: true },
        "name": { type: DataTypes.STRING(60), allowNull: false },
        "symbol": { type: DataTypes.STRING(8) },
        "decimal_places": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
      });
    }
    if (!(await queryInterface.tableExists("units_of_measure"))) {
      await queryInterface.createTable("units_of_measure", {
        "unit_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "code": { type: DataTypes.STRING(20), allowNull: false, unique: true },
        "name": { type: DataTypes.STRING(80), allowNull: false },
        "allows_decimal": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      });
    }
    if (!(await queryInterface.tableExists("expense_categories"))) {
      await queryInterface.createTable("expense_categories", {
        "category_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "parent_category_id": { type: DataTypes.INTEGER, references: { model: "expense_categories", key: "category_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "code": { type: DataTypes.STRING(40), allowNull: false, unique: true },
        "name": { type: DataTypes.STRING(120), allowNull: false },
        "description": { type: DataTypes.TEXT },
        "is_capital_expense": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("products"))) {
      await queryInterface.createTable("products", {
        "product_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "sku": { type: DataTypes.STRING(60), allowNull: false, unique: true },
        "barcode": { type: DataTypes.STRING(80), unique: true },
        "name": { type: DataTypes.STRING(180), allowNull: false },
        "description": { type: DataTypes.TEXT },
        "brand": { type: DataTypes.STRING(100) },
        "model": { type: DataTypes.STRING(100) },
        "unit_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "units_of_measure", key: "unit_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "category_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "expense_categories", key: "category_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "is_stockable": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "updated_at": { type: DataTypes.DATE },
      });
    }
    if (!(await queryInterface.tableExists("product_identifiers"))) {
      await queryInterface.createTable("product_identifiers", {
        "identifier_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "identifier_type": { type: DataTypes.STRING(40), allowNull: false },
        "identifier_value": { type: DataTypes.STRING(120), allowNull: false },
        "source_name": { type: DataTypes.STRING(100) },
      });
    }
    if (!(await queryInterface.tableExists("suppliers"))) {
      await queryInterface.createTable("suppliers", {
        "supplier_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "supplier_code": { type: DataTypes.STRING(40), allowNull: false, unique: true },
        "legal_name": { type: DataTypes.STRING(180), allowNull: false },
        "trade_name": { type: DataTypes.STRING(180) },
        "tax_id": { type: DataTypes.STRING(50) },
        "email": { type: DataTypes.STRING(180) },
        "phone": { type: DataTypes.STRING(40) },
        "website": { type: DataTypes.STRING(255) },
        "address": { type: DataTypes.TEXT },
        "default_currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "payment_terms_days": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("supplier_contacts"))) {
      await queryInterface.createTable("supplier_contacts", {
        "contact_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "supplier_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "full_name": { type: DataTypes.STRING(160), allowNull: false },
        "email": { type: DataTypes.STRING(180) },
        "phone": { type: DataTypes.STRING(40) },
        "role_title": { type: DataTypes.STRING(100) },
        "is_primary": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
      });
    }
    if (!(await queryInterface.tableExists("supplier_products"))) {
      await queryInterface.createTable("supplier_products", {
        "supplier_product_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "supplier_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "supplier_sku": { type: DataTypes.STRING(100) },
        "supplier_product_name": { type: DataTypes.STRING(180) },
        "pack_quantity": { type: DataTypes.DECIMAL(12,3), allowNull: false, defaultValue: 1 },
        "purchase_unit_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "units_of_measure", key: "unit_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "minimum_order_quantity": { type: DataTypes.DECIMAL(12,3) },
        "lead_time_days": { type: DataTypes.INTEGER },
        "last_known_price": { type: DataTypes.DECIMAL(14,4) },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "is_preferred": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("price_sources"))) {
      await queryInterface.createTable("price_sources", {
        "price_source_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "source_name": { type: DataTypes.STRING(120), allowNull: false, unique: true },
        "source_type": { type: DataTypes.STRING(40), allowNull: false },
        "base_url": { type: DataTypes.STRING(255) },
        "update_frequency": { type: DataTypes.STRING(60) },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("price_import_batches"))) {
      await queryInterface.createTable("price_import_batches", {
        "import_batch_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "price_source_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "price_sources", key: "price_source_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "started_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "completed_at": { type: DataTypes.DATE },
        "imported_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "records_received": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        "records_imported": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        "records_rejected": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        "status": { type: DataTypes.STRING(30), allowNull: false },
        "error_summary": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("supplier_price_observations"))) {
      await queryInterface.createTable("supplier_price_observations", {
        "price_observation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "supplier_product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "supplier_products", key: "supplier_product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "price_source_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "price_sources", key: "price_source_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "import_batch_id": { type: DataTypes.INTEGER, references: { model: "price_import_batches", key: "import_batch_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "observed_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "price_includes_tax": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        "available_quantity": { type: DataTypes.DECIMAL(14,3) },
        "source_product_url": { type: DataTypes.STRING(500) },
        "external_reference": { type: DataTypes.STRING(150) },
        "is_validated": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      });
    }
    if (!(await queryInterface.tableExists("contracts"))) {
      await queryInterface.createTable("contracts", {
        "contract_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "supplier_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "contract_number": { type: DataTypes.STRING(80), allowNull: false, unique: true },
        "title": { type: DataTypes.STRING(180), allowNull: false },
        "start_date": { type: DataTypes.DATEONLY, allowNull: false },
        "end_date": { type: DataTypes.DATEONLY },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "status": { type: DataTypes.STRING(30), allowNull: false },
        "document_url": { type: DataTypes.STRING(500) },
        "created_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("contract_lines"))) {
      await queryInterface.createTable("contract_lines", {
        "contract_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "contract_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "contracts", key: "contract_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "agreed_unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "minimum_quantity": { type: DataTypes.DECIMAL(14,3) },
        "maximum_quantity": { type: DataTypes.DECIMAL(14,3) },
        "unit_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "units_of_measure", key: "unit_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("approval_rules"))) {
      await queryInterface.createTable("approval_rules", {
        "approval_rule_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "rule_name": { type: DataTypes.STRING(120), allowNull: false },
        "min_amount": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
        "max_amount": { type: DataTypes.DECIMAL(14,2) },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "step_order": { type: DataTypes.INTEGER, allowNull: false },
        "approver_role_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "roles", key: "role_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "department_id": { type: DataTypes.INTEGER, references: { model: "departments", key: "department_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "is_active": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        "valid_from": { type: DataTypes.DATEONLY },
        "valid_to": { type: DataTypes.DATEONLY },
        "description": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("requisitions"))) {
      await queryInterface.createTable("requisitions", {
        "requisition_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "requisition_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
        "requester_user_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "department_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "departments", key: "department_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "cost_center_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "cost_centers", key: "cost_center_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "requested_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "needed_by_date": { type: DataTypes.DATEONLY },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "estimated_total": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
        "business_justification": { type: DataTypes.TEXT, allowNull: false },
        "status": { type: DataTypes.ENUM("draft", "submitted", "under_review", "approved", "rejected", "cancelled", "partially_ordered", "ordered", "closed"), allowNull: false, defaultValue: "draft" },
        "submitted_at": { type: DataTypes.DATE },
        "closed_at": { type: DataTypes.DATE },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("requisition_lines"))) {
      await queryInterface.createTable("requisition_lines", {
        "requisition_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "requisition_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "requisitions", key: "requisition_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "category_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "expense_categories", key: "category_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quantity_requested": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "unit_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "units_of_measure", key: "unit_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "estimated_unit_price": { type: DataTypes.DECIMAL(14,4) },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "preferred_supplier_id": { type: DataTypes.INTEGER, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "needed_by_date": { type: DataTypes.DATEONLY },
        "specification": { type: DataTypes.TEXT },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }
    if (!(await queryInterface.tableExists("requisition_approvals"))) {
      await queryInterface.createTable("requisition_approvals", {
        "requisition_approval_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "requisition_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "requisitions", key: "requisition_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "approval_rule_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "approval_rules", key: "approval_rule_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "step_order": { type: DataTypes.INTEGER, allowNull: false },
        "approver_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "status": { type: DataTypes.ENUM("pending", "approved", "rejected", "skipped"), allowNull: false, defaultValue: "pending" },
        "assigned_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "decided_at": { type: DataTypes.DATE },
        "comments": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("price_comparisons"))) {
      await queryInterface.createTable("price_comparisons", {
        "comparison_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "comparison_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
        "requisition_id": { type: DataTypes.INTEGER, references: { model: "requisitions", key: "requisition_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "created_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "status": { type: DataTypes.ENUM("draft", "completed", "cancelled"), allowNull: false, defaultValue: "draft" },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("price_comparison_items"))) {
      await queryInterface.createTable("price_comparison_items", {
        "comparison_item_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "comparison_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "price_comparisons", key: "comparison_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "supplier_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "supplier_product_id": { type: DataTypes.INTEGER, references: { model: "supplier_products", key: "supplier_product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "price_observation_id": { type: DataTypes.INTEGER, references: { model: "supplier_price_observations", key: "price_observation_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quoted_unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quantity_quoted": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "lead_time_days": { type: DataTypes.INTEGER },
        "quality_note": { type: DataTypes.TEXT },
        "payment_terms_days": { type: DataTypes.INTEGER },
        "is_selected": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        "selection_reason": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("purchase_orders"))) {
      await queryInterface.createTable("purchase_orders", {
        "purchase_order_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "po_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
        "supplier_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "requisition_id": { type: DataTypes.INTEGER, references: { model: "requisitions", key: "requisition_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "contract_id": { type: DataTypes.INTEGER, references: { model: "contracts", key: "contract_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "comparison_id": { type: DataTypes.INTEGER, references: { model: "price_comparisons", key: "comparison_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "approved_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "ordered_at": { type: DataTypes.DATE },
        "expected_delivery_date": { type: DataTypes.DATEONLY },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "subtotal": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
        "tax_total": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
        "total_amount": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
        "status": { type: DataTypes.ENUM("draft", "sent", "acknowledged", "partially_received", "received", "cancelled", "closed"), allowNull: false, defaultValue: "draft" },
        "supplier_reference": { type: DataTypes.STRING(100) },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("purchase_order_lines"))) {
      await queryInterface.createTable("purchase_order_lines", {
        "purchase_order_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "purchase_order_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "purchase_orders", key: "purchase_order_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "contract_line_id": { type: DataTypes.INTEGER, references: { model: "contract_lines", key: "contract_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "supplier_product_id": { type: DataTypes.INTEGER, references: { model: "supplier_products", key: "supplier_product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "description": { type: DataTypes.STRING(250) },
        "quantity_ordered": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "unit_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "units_of_measure", key: "unit_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
        "tax_rate": { type: DataTypes.DECIMAL(7,4), allowNull: false, defaultValue: 0 },
        "line_total": { type: DataTypes.DECIMAL(14,2), allowNull: false },
        "category_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "expense_categories", key: "category_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "expected_delivery_date": { type: DataTypes.DATEONLY },
      });
    }
    if (!(await queryInterface.tableExists("requisition_order_allocations"))) {
      await queryInterface.createTable("requisition_order_allocations", {
        "allocation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "requisition_line_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "requisition_lines", key: "requisition_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "purchase_order_line_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "purchase_order_lines", key: "purchase_order_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quantity_allocated": { type: DataTypes.DECIMAL(14,3), allowNull: false },
      });
    }
    if (!(await queryInterface.tableExists("receipts"))) {
      await queryInterface.createTable("receipts", {
        "receipt_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "receipt_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
        "purchase_order_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "purchase_orders", key: "purchase_order_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "received_by_user_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "received_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "status": { type: DataTypes.ENUM("draft", "posted", "cancelled"), allowNull: false, defaultValue: "draft" },
        "delivery_note_number": { type: DataTypes.STRING(100) },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("receipt_lines"))) {
      await queryInterface.createTable("receipt_lines", {
        "receipt_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "receipt_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "receipts", key: "receipt_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "purchase_order_line_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "purchase_order_lines", key: "purchase_order_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quantity_received": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "quantity_accepted": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "quantity_rejected": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
        "rejection_reason": { type: DataTypes.TEXT },
        "lot_number": { type: DataTypes.STRING(100) },
        "expiration_date": { type: DataTypes.DATEONLY },
      });
    }
    if (!(await queryInterface.tableExists("supplier_invoices"))) {
      await queryInterface.createTable("supplier_invoices", {
        "invoice_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "supplier_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "purchase_order_id": { type: DataTypes.INTEGER, references: { model: "purchase_orders", key: "purchase_order_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "invoice_number": { type: DataTypes.STRING(100), allowNull: false },
        "invoice_date": { type: DataTypes.DATEONLY, allowNull: false },
        "due_date": { type: DataTypes.DATEONLY },
        "received_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "subtotal": { type: DataTypes.DECIMAL(14,2), allowNull: false },
        "tax_total": { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
        "total_amount": { type: DataTypes.DECIMAL(14,2), allowNull: false },
        "status": { type: DataTypes.ENUM("received", "under_review", "matched", "disputed", "approved", "partially_paid", "paid", "cancelled"), allowNull: false, defaultValue: "received" },
        "document_url": { type: DataTypes.STRING(500) },
        "reviewed_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("invoice_lines"))) {
      await queryInterface.createTable("invoice_lines", {
        "invoice_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "invoice_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "supplier_invoices", key: "invoice_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "purchase_order_line_id": { type: DataTypes.INTEGER, references: { model: "purchase_order_lines", key: "purchase_order_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "description": { type: DataTypes.STRING(250), allowNull: false },
        "quantity_invoiced": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "unit_id": { type: DataTypes.INTEGER, references: { model: "units_of_measure", key: "unit_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "unit_price": { type: DataTypes.DECIMAL(14,4), allowNull: false },
        "tax_rate": { type: DataTypes.DECIMAL(7,4), allowNull: false, defaultValue: 0 },
        "line_total": { type: DataTypes.DECIMAL(14,2), allowNull: false },
        "category_id": { type: DataTypes.INTEGER, references: { model: "expense_categories", key: "category_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
      });
    }
    if (!(await queryInterface.tableExists("invoice_receipt_allocations"))) {
      await queryInterface.createTable("invoice_receipt_allocations", {
        "invoice_receipt_allocation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "invoice_line_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "invoice_lines", key: "invoice_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "receipt_line_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "receipt_lines", key: "receipt_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quantity_matched": { type: DataTypes.DECIMAL(14,3), allowNull: false },
      });
    }
    if (!(await queryInterface.tableExists("payments"))) {
      await queryInterface.createTable("payments", {
        "payment_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "payment_reference": { type: DataTypes.STRING(100), unique: true },
        "payment_date": { type: DataTypes.DATEONLY },
        "currency_code": { type: DataTypes.CHAR(3), allowNull: false, references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "amount": { type: DataTypes.DECIMAL(14,2), allowNull: false },
        "payment_method": { type: DataTypes.STRING(40) },
        "status": { type: DataTypes.ENUM("scheduled", "processing", "completed", "failed", "cancelled"), allowNull: false, defaultValue: "scheduled" },
        "created_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "confirmed_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "bank_reference": { type: DataTypes.STRING(120) },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("payment_allocations"))) {
      await queryInterface.createTable("payment_allocations", {
        "payment_allocation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "payment_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "payments", key: "payment_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "invoice_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "supplier_invoices", key: "invoice_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "amount_applied": { type: DataTypes.DECIMAL(14,2), allowNull: false },
      });
    }
    if (!(await queryInterface.tableExists("warehouses"))) {
      await queryInterface.createTable("warehouses", {
        "warehouse_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "code": { type: DataTypes.STRING(30), allowNull: false, unique: true },
        "name": { type: DataTypes.STRING(120), allowNull: false },
        "address": { type: DataTypes.TEXT },
        "status": { type: DataTypes.ENUM("active", "inactive"), allowNull: false, defaultValue: "active" },
      });
    }
    if (!(await queryInterface.tableExists("product_warehouse_policies"))) {
      await queryInterface.createTable("product_warehouse_policies", {
        "product_warehouse_policy_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "warehouse_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "warehouses", key: "warehouse_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "minimum_stock": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
        "safety_stock": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
        "reorder_point": { type: DataTypes.DECIMAL(14,3), allowNull: false, defaultValue: 0 },
        "target_stock": { type: DataTypes.DECIMAL(14,3) },
        "average_daily_demand": { type: DataTypes.DECIMAL(14,4) },
        "lead_time_days": { type: DataTypes.INTEGER },
        "review_period_days": { type: DataTypes.INTEGER },
        "last_calculated_at": { type: DataTypes.DATE },
        "calculation_method": { type: DataTypes.STRING(80) },
      });
    }
    if (!(await queryInterface.tableExists("stock_lots"))) {
      await queryInterface.createTable("stock_lots", {
        "lot_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "warehouse_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "warehouses", key: "warehouse_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "lot_number": { type: DataTypes.STRING(100), allowNull: false },
        "received_at": { type: DataTypes.DATE },
        "expiration_date": { type: DataTypes.DATEONLY },
        "unit_cost": { type: DataTypes.DECIMAL(14,4) },
        "currency_code": { type: DataTypes.CHAR(3), references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "status": { type: DataTypes.STRING(30), allowNull: false, defaultValue: "available" },
      });
    }
    if (!(await queryInterface.tableExists("inventory_movements"))) {
      await queryInterface.createTable("inventory_movements", {
        "inventory_movement_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "movement_number": { type: DataTypes.STRING(40), allowNull: false, unique: true },
        "movement_type": { type: DataTypes.ENUM("receipt", "sale", "return", "transfer_in", "transfer_out", "adjustment_in", "adjustment_out", "reservation", "release", "damage", "stock_count"), allowNull: false },
        "movement_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "reference_type": { type: DataTypes.STRING(40) },
        "reference_id": { type: DataTypes.INTEGER },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("inventory_movement_lines"))) {
      await queryInterface.createTable("inventory_movement_lines", {
        "inventory_movement_line_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "inventory_movement_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "inventory_movements", key: "inventory_movement_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "warehouse_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "warehouses", key: "warehouse_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "lot_id": { type: DataTypes.INTEGER, references: { model: "stock_lots", key: "lot_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quantity_change": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "unit_cost": { type: DataTypes.DECIMAL(14,4) },
        "currency_code": { type: DataTypes.CHAR(3), references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "receipt_line_id": { type: DataTypes.INTEGER, references: { model: "receipt_lines", key: "receipt_line_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("stock_reservations"))) {
      await queryInterface.createTable("stock_reservations", {
        "reservation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "product_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "warehouse_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "warehouses", key: "warehouse_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "quantity_reserved": { type: DataTypes.DECIMAL(14,3), allowNull: false },
        "reserved_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "expires_at": { type: DataTypes.DATE },
        "reference_type": { type: DataTypes.STRING(40) },
        "reference_id": { type: DataTypes.INTEGER },
        "released_at": { type: DataTypes.DATE },
        "created_by_user_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("evaluation_criteria"))) {
      await queryInterface.createTable("evaluation_criteria", {
        "criterion_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "name": { type: DataTypes.STRING(100), allowNull: false, unique: true },
        "description": { type: DataTypes.TEXT },
        "default_weight": { type: DataTypes.DECIMAL(7,4), allowNull: false },
        "higher_is_better": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        "is_active": { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      });
    }
    if (!(await queryInterface.tableExists("supplier_evaluations"))) {
      await queryInterface.createTable("supplier_evaluations", {
        "evaluation_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "supplier_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "evaluation_period_start": { type: DataTypes.DATEONLY },
        "evaluation_period_end": { type: DataTypes.DATEONLY },
        "evaluated_by_user_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "evaluated_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "status": { type: DataTypes.ENUM("draft", "submitted", "approved", "rejected"), allowNull: false, defaultValue: "draft" },
        "total_weighted_score": { type: DataTypes.DECIMAL(8,4) },
        "recommendation": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("supplier_evaluation_scores"))) {
      await queryInterface.createTable("supplier_evaluation_scores", {
        "evaluation_score_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "evaluation_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "supplier_evaluations", key: "evaluation_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "criterion_id": { type: DataTypes.INTEGER, allowNull: false, references: { model: "evaluation_criteria", key: "criterion_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "weight_used": { type: DataTypes.DECIMAL(7,4), allowNull: false },
        "score": { type: DataTypes.DECIMAL(7,4), allowNull: false },
        "weighted_score": { type: DataTypes.DECIMAL(8,4), allowNull: false },
        "evidence": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("spend_anomalies"))) {
      await queryInterface.createTable("spend_anomalies", {
        "anomaly_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "anomaly_type": { type: DataTypes.ENUM("duplicate_purchase", "duplicate_invoice", "off_contract", "overprice", "unusual_quantity", "split_purchase"), allowNull: false },
        "status": { type: DataTypes.ENUM("open", "under_review", "confirmed", "dismissed", "resolved"), allowNull: false, defaultValue: "open" },
        "detected_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "detected_by": { type: DataTypes.STRING(40), allowNull: false },
        "supplier_id": { type: DataTypes.INTEGER, references: { model: "suppliers", key: "supplier_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "product_id": { type: DataTypes.INTEGER, references: { model: "products", key: "product_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "category_id": { type: DataTypes.INTEGER, references: { model: "expense_categories", key: "category_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "requisition_id": { type: DataTypes.INTEGER, references: { model: "requisitions", key: "requisition_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "purchase_order_id": { type: DataTypes.INTEGER, references: { model: "purchase_orders", key: "purchase_order_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "invoice_id": { type: DataTypes.INTEGER, references: { model: "supplier_invoices", key: "invoice_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "related_invoice_id": { type: DataTypes.INTEGER, references: { model: "supplier_invoices", key: "invoice_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "benchmark_price": { type: DataTypes.DECIMAL(14,4) },
        "observed_price": { type: DataTypes.DECIMAL(14,4) },
        "currency_code": { type: DataTypes.CHAR(3), references: { model: "currencies", key: "currency_code" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "variance_percent": { type: DataTypes.DECIMAL(9,4) },
        "explanation": { type: DataTypes.TEXT, allowNull: false },
        "reviewed_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "reviewed_at": { type: DataTypes.DATE },
        "resolution_notes": { type: DataTypes.TEXT },
      });
    }
    if (!(await queryInterface.tableExists("spend_analysis_runs"))) {
      await queryInterface.createTable("spend_analysis_runs", {
        "analysis_run_id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        "started_at": { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        "completed_at": { type: DataTypes.DATE },
        "created_by_user_id": { type: DataTypes.INTEGER, references: { model: "users", key: "user_id" }, onUpdate: 'CASCADE', onDelete: 'RESTRICT' },
        "date_from": { type: DataTypes.DATEONLY, allowNull: false },
        "date_to": { type: DataTypes.DATEONLY, allowNull: false },
        "rules_version": { type: DataTypes.STRING(40) },
        "anomalies_found": { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        "status": { type: DataTypes.STRING(30), allowNull: false },
        "summary": { type: DataTypes.TEXT },
      });
    }
    { const fields = ["identifier_type", "identifier_value"]; const unique = true;
      const indexes = await queryInterface.showIndex("product_identifiers");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("product_identifiers", fields, { name: "uq_product_identifiers_identifi_identifi", unique });
    }
    { const fields = ["supplier_id", "product_id"]; const unique = true;
      const indexes = await queryInterface.showIndex("supplier_products");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("supplier_products", fields, { name: "uq_supplier_products_supplier_product_", unique });
    }
    { const fields = ["contract_id", "product_id"]; const unique = true;
      const indexes = await queryInterface.showIndex("contract_lines");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("contract_lines", fields, { name: "uq_contract_lines_contract_product_", unique });
    }
    { const fields = ["requisition_id", "step_order"]; const unique = true;
      const indexes = await queryInterface.showIndex("requisition_approvals");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("requisition_approvals", fields, { name: "uq_requisition_approvals_requisit_step_ord", unique });
    }
    { const fields = ["requisition_line_id", "purchase_order_line_id"]; const unique = true;
      const indexes = await queryInterface.showIndex("requisition_order_allocations");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("requisition_order_allocations", fields, { name: "uq_requisition_order_alloca_requisit_purchase", unique });
    }
    { const fields = ["supplier_id", "invoice_number"]; const unique = true;
      const indexes = await queryInterface.showIndex("supplier_invoices");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("supplier_invoices", fields, { name: "uq_supplier_invoices_supplier_invoice_", unique });
    }
    { const fields = ["invoice_line_id", "receipt_line_id"]; const unique = true;
      const indexes = await queryInterface.showIndex("invoice_receipt_allocations");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("invoice_receipt_allocations", fields, { name: "uq_invoice_receipt_allocati_invoice__receipt_", unique });
    }
    { const fields = ["payment_id", "invoice_id"]; const unique = true;
      const indexes = await queryInterface.showIndex("payment_allocations");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("payment_allocations", fields, { name: "uq_payment_allocations_payment__invoice_", unique });
    }
    { const fields = ["product_id", "warehouse_id"]; const unique = true;
      const indexes = await queryInterface.showIndex("product_warehouse_policies");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("product_warehouse_policies", fields, { name: "uq_product_warehouse_polici_product__warehous", unique });
    }
    { const fields = ["product_id", "warehouse_id", "lot_number"]; const unique = true;
      const indexes = await queryInterface.showIndex("stock_lots");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("stock_lots", fields, { name: "uq_stock_lots_product__warehous_lot_numb", unique });
    }
    { const fields = ["evaluation_id", "criterion_id"]; const unique = true;
      const indexes = await queryInterface.showIndex("supplier_evaluation_scores");
      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));
      if (!exists) await queryInterface.addIndex("supplier_evaluation_scores", fields, { name: "uq_supplier_evaluation_scor_evaluati_criterio", unique });
    }
  },
  async down(queryInterface) {
    await queryInterface.dropTable("spend_analysis_runs");
    await queryInterface.dropTable("spend_anomalies");
    await queryInterface.dropTable("supplier_evaluation_scores");
    await queryInterface.dropTable("supplier_evaluations");
    await queryInterface.dropTable("evaluation_criteria");
    await queryInterface.dropTable("stock_reservations");
    await queryInterface.dropTable("inventory_movement_lines");
    await queryInterface.dropTable("inventory_movements");
    await queryInterface.dropTable("stock_lots");
    await queryInterface.dropTable("product_warehouse_policies");
    await queryInterface.dropTable("warehouses");
    await queryInterface.dropTable("payment_allocations");
    await queryInterface.dropTable("payments");
    await queryInterface.dropTable("invoice_receipt_allocations");
    await queryInterface.dropTable("invoice_lines");
    await queryInterface.dropTable("supplier_invoices");
    await queryInterface.dropTable("receipt_lines");
    await queryInterface.dropTable("receipts");
    await queryInterface.dropTable("requisition_order_allocations");
    await queryInterface.dropTable("purchase_order_lines");
    await queryInterface.dropTable("purchase_orders");
    await queryInterface.dropTable("price_comparison_items");
    await queryInterface.dropTable("price_comparisons");
    await queryInterface.dropTable("requisition_approvals");
    await queryInterface.dropTable("requisition_lines");
    await queryInterface.dropTable("requisitions");
    await queryInterface.dropTable("approval_rules");
    await queryInterface.dropTable("contract_lines");
    await queryInterface.dropTable("contracts");
    await queryInterface.dropTable("supplier_price_observations");
    await queryInterface.dropTable("price_import_batches");
    await queryInterface.dropTable("price_sources");
    await queryInterface.dropTable("supplier_products");
    await queryInterface.dropTable("supplier_contacts");
    await queryInterface.dropTable("suppliers");
    await queryInterface.dropTable("product_identifiers");
    await queryInterface.dropTable("products");
    await queryInterface.dropTable("expense_categories");
    await queryInterface.dropTable("units_of_measure");
    await queryInterface.dropTable("currencies");
    await queryInterface.dropTable("user_roles");
    await queryInterface.dropTable("roles");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("cost_centers");
    await queryInterface.dropTable("departments");
  }
};
