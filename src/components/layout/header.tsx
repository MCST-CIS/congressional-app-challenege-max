import GoogleSignInButton from '../auth/google-signin-button';
import Link from 'next/link';
import { APP_NAME } from '@/lib/config';
import Logo from './logo';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="flex w-full items-center gap-6 text-lg font-medium md:text-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Logo className="h-8 w-auto" />
        </Link>
        <Link href="/calendar" className="text-muted-foreground transition-colors hover:text-foreground">
          Calendar
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <GoogleSignInButton />
        </div>
      </nav>
    </header>
  );
}
