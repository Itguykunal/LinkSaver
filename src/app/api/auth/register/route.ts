import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { email: user.email, id: user.id },
      process.env.JWT_SECRET || 'fallback-secret-for-dev',
      { expiresIn: '24h' }
    );
    
    return NextResponse.json({ 
      success: true, 
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}