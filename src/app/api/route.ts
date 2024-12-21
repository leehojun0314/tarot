import { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  // const params = new URLSearchParams(url);
  // const params2 = new URLSearchParams(url);
  const test2 = url.searchParams.get('test');
  // const test = params2.get('test');
  console.log('test: ', test2);
  console.log('url: ', url);
  return new Response('hello world');
}
