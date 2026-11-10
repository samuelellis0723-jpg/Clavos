'use strict';
const db=require('../models');
const {id}=require('../lib/validation');
(async()=>{
  const user_id=id(process.argv[2],'user_id');
  await db.sequelize.transaction(async transaction=>{
    const user=await db.users.findByPk(user_id,{transaction,lock:transaction.LOCK.UPDATE});
    if(!user)throw new Error('User not found');
    await user.update({status:'inactive'},{transaction});
    await db.auth_sessions.update({revoked_at:new Date()},{where:{user_id},transaction});
  });
  console.log('Account deactivated and sessions revoked. Business history retained.');
})().catch(()=>{console.error('Could not revoke access. Check user_id and database configuration.');process.exitCode=1;}).finally(()=>db.sequelize.close());
