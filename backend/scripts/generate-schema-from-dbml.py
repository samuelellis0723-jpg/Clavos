#!/usr/bin/env python3
"""Generate Sequelize models and the first migration from backend/dbml.md."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DBML = (ROOT / "dbml.md").read_text()

enums = {}
for name, body in re.findall(r"Enum\s+(\w+)\s*\{([^}]*)\}", DBML, re.S):
    enums[name] = [x.strip() for x in body.splitlines() if x.strip()]

tables = []
for name, body in re.findall(r"Table\s+(\w+)\s*\{(.*?)\n\}", DBML, re.S):
    fields = []
    indexes = []
    lines = body.splitlines()
    in_indexes = False
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("//") or line.startswith("Note:"):
            continue
        if line == "indexes {":
            in_indexes = True
            continue
        if in_indexes:
            if line == "}":
                in_indexes = False
                continue
            m = re.match(r"\(([^)]+)\)\s*\[([^]]+)\]", line)
            if m:
                indexes.append({"fields": [x.strip() for x in m.group(1).split(",")], "attrs": m.group(2)})
            continue
        m = re.match(r"(\w+)\s+([\w]+(?:\([^)]*\))?)\s*(?:\[([^]]*)\])?\s*$", line)
        if not m:
            continue
        col, typ, attrs = m.groups()
        fields.append({"name": col, "type": typ, "attrs": attrs or ""})
    tables.append({"name": name, "fields": fields, "indexes": indexes})

refs = []
for a, b, c, d in re.findall(r"Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)", DBML):
    refs.append({"table": a, "field": b, "target": c, "targetField": d})
refs_by_col = {(r["table"], r["field"]): r for r in refs}
tables_by_name = {t["name"]: t for t in tables}

def js_type(typ):
    if typ in enums:
        return "DataTypes.ENUM(" + ", ".join(json.dumps(x) for x in enums[typ]) + ")"
    m = re.fullmatch(r"(\w+)(?:\(([^)]*)\))?", typ)
    base, arg = m.groups()
    names = {"int": "INTEGER", "varchar": "STRING", "char": "CHAR", "text": "TEXT",
             "timestamp": "DATE", "date": "DATEONLY", "boolean": "BOOLEAN", "decimal": "DECIMAL"}
    if base not in names:
        raise ValueError(f"Unsupported DBML type {typ}")
    return f"DataTypes.{names[base]}({arg})" if arg else f"DataTypes.{names[base]}"

def attr_parts(attr):
    # Attribute expressions used by this DBML are simple except Note strings, which are ignored.
    out = {}
    for piece in re.split(r",\s*(?![^']*'\s*\])", attr):
        piece = piece.strip()
        if piece in ("pk", "increment", "not null", "unique"):
            out[piece] = True
        elif ":" in piece:
            k, v = piece.split(":", 1)
            k, v = k.strip(), v.strip()
            if k == "default":
                out[k] = v
    return out

for t in tables:
    for f in t["fields"]:
        f["parsed"] = attr_parts(f["attrs"])
    for ix in t["indexes"]:
        attrs = [x.strip() for x in ix["attrs"].split(",")]
        if "pk" in attrs:
            for col in ix["fields"]:
                next(f for f in t["fields"] if f["name"] == col)["parsed"]["pk"] = True

# Render a standalone migration: it does not need to read or parse the DBML at deploy time.
lines = ["'use strict';", "", "const { DataTypes, Sequelize } = require('sequelize');", "", "module.exports = {", "  async up(queryInterface) {"]
for t in tables:
    lines.append(f"    if (!(await queryInterface.tableExists({json.dumps(t['name'])}))) {{")
    lines.append(f"      await queryInterface.createTable({json.dumps(t['name'])}, {{")
    for f in t["fields"]:
        p = f["parsed"]
        opts = [f"type: {js_type(f['type'])}"]
        if p.get("pk"): opts.append("primaryKey: true")
        if p.get("increment"): opts.append("autoIncrement: true")
        if p.get("not null"): opts.append("allowNull: false")
        if p.get("unique"): opts.append("unique: true")
        if "default" in p:
            v = p["default"]
            if v.startswith("`") and v.endswith("`"):
                opts.append("defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')")
            elif v.startswith("'") and v.endswith("'"):
                opts.append("defaultValue: " + json.dumps(v[1:-1]))
            elif v in ("true", "false"):
                opts.append("defaultValue: " + v)
            else:
                opts.append("defaultValue: " + v)
        ref = refs_by_col.get((t["name"], f["name"]))
        if ref:
            opts.append("references: { model: " + json.dumps(ref["target"]) + ", key: " + json.dumps(ref["targetField"]) + " }")
            opts.append("onUpdate: 'CASCADE'")
            opts.append("onDelete: 'RESTRICT'")
        lines.append(f"        {json.dumps(f['name'])}: {{ " + ", ".join(opts) + " },")
    lines.append("      });")
    lines.append("    }")
for t in tables:
    for ix in t["indexes"]:
        attrs = [x.strip() for x in ix["attrs"].split(",")]
        if "pk" in attrs:
            continue
        name = ("uq_" if "unique" in attrs else "idx_") + t["name"][:24] + "_" + "_".join(col[:8] for col in ix["fields"])
        unique = str("unique" in attrs).lower()
        lines.append(f"    {{ const fields = {json.dumps(ix['fields'])}; const unique = {unique};")
        lines.append(f"      const indexes = await queryInterface.showIndex({json.dumps(t['name'])});")
        lines.append("      const exists = indexes.some(index => Boolean(index.unique) === unique && index.fields.map(field => field.attribute || field.name || field.column).join(',') === fields.join(','));")
        lines.append(f"      if (!exists) await queryInterface.addIndex({json.dumps(t['name'])}, fields, {{ name: {json.dumps(name)}, unique }});")
        lines.append("    }")
lines += ["  },", "  async down(queryInterface) {"]
for t in reversed(tables):
    lines.append(f"    await queryInterface.dropTable({json.dumps(t['name'])});")
lines += ["  }", "};", ""]
migrations = ROOT / "migrations"
migrations.mkdir(exist_ok=True)
(migrations / "20261109000000-create-dbml-schema.js").write_text("\n".join(lines))

# Each model uses explicit physical names; associations follow every DBML Ref.
models = ROOT / "models"
for t in tables:
    model_lines = ["'use strict';", "", "module.exports = (sequelize, DataTypes) => {", "  const Model = sequelize.define(" + json.dumps(t["name"]) + ", {"]
    for f in t["fields"]:
        p = f["parsed"]
        opts = [f"type: {js_type(f['type']).replace('DataTypes.', 'DataTypes.')}"]
        if p.get("pk"): opts.append("primaryKey: true")
        if p.get("increment"): opts.append("autoIncrement: true")
        if p.get("not null"): opts.append("allowNull: false")
        if p.get("unique"): opts.append("unique: true")
        if "default" in p:
            v = p["default"]
            if v.startswith("`") and v.endswith("`"): opts.append("defaultValue: DataTypes.NOW")
            elif v.startswith("'") and v.endswith("'"): opts.append("defaultValue: " + json.dumps(v[1:-1]))
            elif v in ("true", "false"): opts.append("defaultValue: " + v)
            else: opts.append("defaultValue: " + v)
        model_lines.append(f"    {json.dumps(f['name'])}: {{ " + ", ".join(opts) + " },")
    model_lines += ["  }, { tableName: " + json.dumps(t["name"]) + ", timestamps: false, freezeTableName: true });", "  Model.associate = (models) => {"]
    for ref in [r for r in refs if r["table"] == t["name"]]:
        alias = re.sub(r"_([a-z])", lambda m: m.group(1).upper(), ref["field"])
        inv = re.sub(r"_([a-z])", lambda m: m.group(1).upper(), t["name"] + "By" + ref["field"].title().replace("_", ""))
        # Lowercase the first character of the generated inverse alias.
        inv = inv[0].lower() + inv[1:]
        model_lines.append(f"    Model.belongsTo(models[{json.dumps(ref['target'])}], {{ foreignKey: {json.dumps(ref['field'])}, targetKey: {json.dumps(ref['targetField'])}, as: {json.dumps(alias)} }});")
        # The inverse is installed once from each source association below.
        model_lines.append(f"    models[{json.dumps(ref['target'])}].hasMany(Model, {{ foreignKey: {json.dumps(ref['field'])}, sourceKey: {json.dumps(ref['targetField'])}, as: {json.dumps(inv)} }});")
    model_lines += ["  };", "  return Model;", "};", ""]
    (models / (t["name"] + ".js")).write_text("\n".join(model_lines))

print(f"Generated {len(tables)} tables, {len(refs)} references, {sum(len(t['indexes']) for t in tables)} indexes")
