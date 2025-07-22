// src/app/api/bookmarks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

// Define proper types
interface JWTPayload {
  id: number;
  email?: string;
  iat?: number;
  exp?: number;
}

interface BookmarkCreateData {
  url: string;
}

// Helper to verify JWT and get user
async function getUserFromToken(request: Request): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev') as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Helper to fetch metadata
async function fetchMetadata(url: string) {
  try {
    const domain = new URL(url).hostname;
    return {
      title: `Page from ${domain}`,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    };
  } catch {
    return { title: 'Unknown Page', favicon: '/favicon.ico' };
  }
}

// Async function to generate summary
async function generateSummaryAsync(bookmarkId: number, url: string) {
  try {
    // Remove protocol from URL
    let cleanUrl = url;
    if (url.startsWith('https://')) {
      cleanUrl = url.substring(8);
    } else if (url.startsWith('http://')) {
      cleanUrl = url.substring(7);
    }
    
    const encodedUrl = encodeURIComponent(cleanUrl);
    const response = await fetch(`https://r.jina.ai/${encodedUrl}`);
    
    if (response.ok) {
      const content = await response.text();
      
      // Extract meaningful summary
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => {
          if (line.toLowerCase().includes('title:')) return false;
          if (line.toLowerCase().includes('url source:')) return false;
          if (line.toLowerCase().includes('markdown content:')) return false;
          if (line.includes('===') || line.includes('---')) return false;
          if (line.startsWith('![')) return false;
          if (line.startsWith('#')) return false;
          if (line.length < 20) return false;
          if (line.includes('©') || line.includes('Sign Up') || line.includes('Log In')) return false;
          return true;
        });
      
      let summary = 'No description available.';
      if (lines.length > 0) {
        summary = lines[0]
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[*_~`#]/g, '')
          .trim();
        
        if (summary && !summary.endsWith('.')) {
          summary += '.';
        }
      }
      
      // Update bookmark with summary
      await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { 
          summary,
          status: 'completed'
        }
      });
    } else {
      throw new Error('Failed to fetch summary');
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Update bookmark with error status
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { 
        summary: 'Summary unavailable',
        status: 'failed'
      }
    });
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

// POST new bookmark - NOW WITH ASYNC SUMMARY
export async function POST(request: Request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { url }: BookmarkCreateData = await request.json();
  
  // Fetch metadata immediately
  const metadata = await fetchMetadata(url);
  
  // Create bookmark with processing status
  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title: metadata.title,
      favicon: metadata.favicon,
      summary: 'Generating summary...',
      status: 'processing',
      userId: user.id
    }
  });
  
  // Generate summary in background (non-blocking)
  generateSummaryAsync(bookmark.id, url).catch(console.error);
  
  // Return immediately
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