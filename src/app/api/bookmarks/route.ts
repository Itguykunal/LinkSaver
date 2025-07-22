import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Define proper types instead of using 'any'
interface JWTPayload {
  id: number;
  email?: string;
  iat?: number;
  exp?: number;
}

interface BookmarkCreateData {
  url: string;
  title: string;
  favicon?: string;
  summary?: string;
}

// Helper to verify JWT and get user
async function getUserFromToken(request: Request): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    // Replace 'as any' with proper type casting
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev') as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// GET bookmarks
export async function GET(request: Request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json(bookmarks);
}

// POST new bookmark
export async function POST(request: Request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { url, title, favicon, summary }: BookmarkCreateData = await request.json();
  
  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title,
      favicon: favicon || '',
      summary: summary || '',  // Add this fix
      userId: user.id
    }
  });
  
  return NextResponse.json(bookmark);
}

// DELETE bookmark
export async function DELETE(request: Request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  // Verify ownership
  const bookmark = await prisma.bookmark.findFirst({
    where: { 
      id: parseInt(id),
      userId: user.id 
    }
  });
  
  if (!bookmark) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  await prisma.bookmark.delete({
    where: { id: parseInt(id) }
  });
  
  return NextResponse.json({ success: true });
}