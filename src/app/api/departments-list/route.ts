import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Forward the request to the Django backend
    try {
      const backendResponse = await fetch('http://localhost:8000/api/departments-list/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        return NextResponse.json(errorData, { status: backendResponse.status });
      }

      const data = await backendResponse.json();
      return NextResponse.json(data);
    } catch (error) {
      // Backend not available, return mock data
      console.warn('Backend not available, returning mock departments data');
      const mockData = [
        { name: 'Internal Medicine' },
        { name: 'Surgery' },
        { name: 'Intensive Care Unit' },
        { name: 'Pediatrics' },
        { name: 'Emergency' }
      ];
      return NextResponse.json(mockData);
    }

  } catch (error) {
    console.error('Departments list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
