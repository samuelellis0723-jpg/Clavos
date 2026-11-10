'use strict';
// Operator-only CLI. Read credentials from stdin; never echo them or accept passwords in argv.
const db=require('../models');
const v=require('../lib/validation');
const {hashPassword}=require('../lib/password');
(async()=>{
  let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>10000)throw new Error('Input too large');}
  const body=JSON.parse(input);v.object(body,['email','full_name','password','roles','department_id'],['email','password','roles']);
  const email=v.text(body.email,'email',180);
  if(typeof body.password!=='string'||body.password.length<12||body.password.length>1024)throw new Error('Password must contain 12 to 1024 characters');
  v.lines(body.roles,20);for(const role of body.roles)v.text(role,'role',80);
  const hash=await hashPassword(body.password);
  await db.sequelize.transaction(async t=>{
    let user=await db.users.findOne({where:{email},transaction:t,lock:t.LOCK.UPDATE});
    if(!user)user=await db.users.create({email,full_name:v.text(body.full_name,'full_name',160),department_id:body.department_id? v.id(body.department_id):null,status:'active'},{transaction:t});
    if(user.status!=='active')throw new Error('Account is inactive');
    const existing=await db.auth_credentials.findByPk(user.user_id,{transaction:t});
    if(existing&&!process.argv.includes('--reset'))throw new Error('Existing credential; use --reset explicitly');
    if(existing){await existing.update({password_hash:hash,failed_attempts:0,locked_until:null},{transaction:t});await db.auth_sessions.update({revoked_at:new Date()},{where:{user_id:user.user_id},transaction:t});}
    else await db.auth_credentials.create({user_id:user.user_id,password_hash:hash},{transaction:t});
    for(const name of body.roles){const [role]=await db.roles.findOrCreate({where:{name},defaults:{name},transaction:t});await db.user_roles.findOrCreate({where:{user_id:user.user_id,role_id:role.role_id},defaults:{user_id:user.user_id,role_id:role.role_id},transaction:t});}
  });
  console.log('Access provisioned. No password or token is printed.');
})().catch(error=>{console.error(['ApiError','Error'].includes(error.name)?error.message:'Provisioning failed; check database configuration and migration status.');process.exitCode=1;}).finally(()=>db.sequelize.close());
