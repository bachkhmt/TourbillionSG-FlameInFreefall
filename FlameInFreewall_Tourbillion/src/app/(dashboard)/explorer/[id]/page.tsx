import React from 'react';
import { StudyDetailClient } from './StudyDetailClient';

export const dynamicParams = true;

export interface PageProps {
  params?: Promise<{ id: string }>;
}

export default function StudyDetailPage({ params }: PageProps) {
  return <StudyDetailClient params={params} />;
}
