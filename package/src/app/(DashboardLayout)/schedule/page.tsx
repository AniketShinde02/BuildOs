import React from 'react';
import ScheduleClient from './ScheduleClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '30-Day Auto-Queue & Calendar | BuildOS',
  description: 'Manage automated Postiz multi-channel chronological content scheduling across 30 days.'
};

export default function SchedulePage() {
  return <ScheduleClient />;
}
