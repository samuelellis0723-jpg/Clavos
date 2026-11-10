'use strict';
const { randomBytes } = require('crypto');
const { Op } = require('sequelize');
const v = require('../lib/validation');
const { fail } = require('../lib/errors');
const { verifyPassword, tokenHash } = require('../lib/password');
module.exports = db => {
  async function identity(user) {
    const assignments = await db.user_roles.findAll({ where: { user_id: user.user_id }, include: [{ model: db.roles, as: 'roleId' }] });
    return { user_id: user.user_id, full_name: user.full_name, email: user.email, department_id: user.department_id, role_ids: assignments.map(x=>x.role_id), roles: assignments.map(x=>x.roleId.name) };
  }
  return {
    async login(body) {
      v.object(body,['email','password'],['email','password']);
      const email=v.text(body.email,'email',180);
      if(typeof body.password!=='string'||body.password.length>1024)fail(400,'INVALID_PASSWORD','Formato de contraseña inválido.');
      const user=await db.users.findOne({where:{email}});
      if(!user || user.status!=='active') { await verifyPassword(body.password,null);fail(401,'INVALID_CREDENTIALS','Credenciales inválidas o acceso temporalmente bloqueado.'); }
      const result=await db.sequelize.transaction(async t=>{
        const credential=await db.auth_credentials.findByPk(user.user_id,{transaction:t,lock:t.LOCK.UPDATE});
        if(!credential){await verifyPassword(body.password,null);return null;}
        if(credential.locked_until && new Date(credential.locked_until)>new Date()){await verifyPassword(body.password,null);return null;}
        if(!await verifyPassword(body.password,credential.password_hash)){
          const attempts=(credential.locked_until ? 0 : credential.failed_attempts)+1;
          await credential.update({failed_attempts:attempts,locked_until:attempts>=5?new Date(Date.now()+15*60*1000):null},{transaction:t});return null;
        }
        await credential.update({failed_attempts:0,locked_until:null},{transaction:t});
        const token=randomBytes(32).toString('hex'),hours=Number(process.env.SESSION_HOURS||8);
        if(!Number.isFinite(hours)||hours<=0||hours>24)fail(500,'INVALID_SESSION_CONFIG','Configuración de sesiones inválida.');
        const expires_at=new Date(Date.now()+hours*3600000);
        await db.auth_sessions.create({token_hash:tokenHash(token),user_id:user.user_id,created_at:new Date(),expires_at},{transaction:t});
        return {access_token:token,token_type:'Bearer',expires_at:expires_at.toISOString()};
      });
      if(!result)fail(401,'INVALID_CREDENTIALS','Credenciales inválidas o acceso temporalmente bloqueado.');
      return {...result,user:await identity(user)};
    },
    async authenticate(header) {
      if(typeof header!=='string'||!/^Bearer [a-f0-9]{64}$/.test(header))fail(401,'UNAUTHORIZED','Se requiere una sesión válida.');
      const hash=tokenHash(header.slice(7));
      const session=await db.auth_sessions.findOne({where:{token_hash:hash,revoked_at:null,expires_at:{[Op.gt]:new Date()}}});
      if(!session)fail(401,'UNAUTHORIZED','Sesión inválida o expirada.');
      const user=await db.users.findByPk(session.user_id);
      if(!user||user.status!=='active')fail(401,'UNAUTHORIZED','La cuenta no está activa.');
      return {...await identity(user),session_hash:hash};
    },
    async logout(actor) { await db.auth_sessions.update({revoked_at:new Date()},{where:{token_hash:actor.session_hash}}); },
  };
};
