'use strict';
const db=require('./models');
const app=require('./app');
async function start(){
  const port=Number(process.env.PORT||3000);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
  if(!process.env.DB_NAME||!process.env.DB_USER||process.env.DB_PASSWORD===undefined)throw new Error('Database environment variables missing');
  await db.sequelize.authenticate();
  const server=app.listen(port,()=>console.log(`API lista en puerto ${port}`));
  server.on('error',()=>{console.error('No se pudo abrir el puerto del servidor.');process.exitCode=1;db.sequelize.close();});
  let stopping=false;
  const stop=()=>{if(stopping)return;stopping=true;const timer=setTimeout(()=>process.exit(1),10000);timer.unref();server.close(async()=>{await db.sequelize.close();clearTimeout(timer);});};
  process.on('SIGINT',stop);process.on('SIGTERM',stop);
  return server;
}
if(require.main===module)start().catch(()=>{console.error('No se pudo iniciar la API. Revisa variables de entorno, MySQL y migraciones.');process.exitCode=1;db.sequelize.close();});
module.exports={start};
