'use client';

import dynamic from 'next/dynamic';
import { BarLoader } from 'react-spinners';

// Dynamically import CreatzionAI to prevent SSR issues
const CreatzionAI = dynamic(() => import('@/components/CreatzionAI'), {
  ssr: false,
  loading: () => null,
});

export default CreatzionAI;
