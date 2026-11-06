'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { customerLogoutAction } from '../../actions/customer-auth';

export function CustomerLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await customerLogoutAction();
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      loading={loggingOut}
      className="text-sm py-2.5 text-stone-600 hover:text-red-700 cursor-pointer"
    >
      <LogOut className="w-4 h-4 ml-1.5" aria-hidden="true" />
      خروج
    </Button>
  );
}
