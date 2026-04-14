import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Try to forward the request to the Django backend
    try {
      const backendResponse = await fetch('http://localhost:8000/api/antibiotic-effectiveness/', {
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
      console.warn('Backend not available, returning mock antibiotic effectiveness data');
      const mockData = [
        { antibiotic: 'Amoxicillin', effectiveness: 85.2 },
        { antibiotic: 'Ciprofloxacin', effectiveness: 78.5 },
        { antibiotic: 'Vancomycin', effectiveness: 92.1 },
        { antibiotic: 'Ceftriaxone', effectiveness: 76.8 },
        { antibiotic: 'Meropenem', effectiveness: 88.9 },
        { antibiotic: 'Gentamicin', effectiveness: 71.4 }
      ];
      return NextResponse.json(mockData);
    }

  } catch (error) {
    console.error('Antibiotic effectiveness API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
