import {NextResponse} from 'next/server';
export async function POST(req){const form=await req.formData();const lead=Object.fromEntries(form.entries());console.log('Teracom lead received',lead);return NextResponse.redirect(new URL('/?lead=received',req.url),303)}
