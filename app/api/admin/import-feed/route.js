import {NextResponse} from 'next/server';
import {z} from 'zod';
import {parseFeed} from '@/lib/feed-importer';
const ImportRequest=z.object({token:z.string(),type:z.enum(['csv','json','xml']),content:z.string()});
export async function POST(req){const parsed=ImportRequest.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:'Invalid import request'},{status:400});if(parsed.data.token!==process.env.ADMIN_IMPORT_TOKEN)return NextResponse.json({error:'Unauthorised'},{status:401});const products=parseFeed(parsed.data.content,parsed.data.type);return NextResponse.json({imported:products.length,products})}
