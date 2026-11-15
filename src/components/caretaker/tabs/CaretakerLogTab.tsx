import React from 'react';
import { AuditLogView } from '../AuditLogView';

export const CaretakerLogTab: React.FC = () => {
  return (
    <div className="px-4 py-5 space-y-4 font-sans">
      <AuditLogView />
    </div>
  );
};
