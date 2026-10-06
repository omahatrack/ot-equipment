import {getCurrentUser} from './session';
export async function requireApiUser(roles=[]){const user=await getCurrentUser();if(!user)return{error:'Unauthorized',status:401};if(roles.length&&!roles.includes(user.role.name))return{error:'Forbidden',status:403};return{user}}
