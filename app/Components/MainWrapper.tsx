
'use client';

import { usePathname } from 'next/navigation';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noMarginPages = ['/classroom'];
  const applyMargin = !noMarginPages.includes(pathname);

  return (
    <main className={`${applyMargin ? 'ml-64  ' : ''} min-h-screen`}>
      {children}
    </main>
  );
}
