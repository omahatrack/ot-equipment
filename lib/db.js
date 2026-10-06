import mariadb from 'mariadb';

function options(){
  const required=['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD'];
  const missing=required.filter(k=>!process.env[k]);
  if(missing.length) throw new Error(`Missing GoDaddy database variables: ${missing.join(', ')}`);
  return {
    host:process.env.DB_HOST,
    port:Number(process.env.DB_PORT||3306),
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    allowPublicKeyRetrieval:true,
    connectionLimit:5,
    acquireTimeout:15000,
    connectTimeout:10000,
    bigIntAsNumber:true
  };
}
export function getPool(){
  if(!globalThis.__oteSqlPool) globalThis.__oteSqlPool=mariadb.createPool(options());
  return globalThis.__oteSqlPool;
}
export async function sql(query,params=[]){
  let conn;
  try{conn=await getPool().getConnection();return await conn.query(query,params)}finally{if(conn)conn.release()}
}

export async function closePool(){
  const pool=globalThis.__oteSqlPool;
  if(pool){
    try{ await pool.end(); }finally{ delete globalThis.__oteSqlPool; }
  }
}
