import { Button } from './ui/button';
import { useLogtoContext } from '../contexts/logto-provider';
import { Link } from 'react-router-dom';

export function AuthStatus() {
  const { isAuthenticated, isLoading, user, roles, signIn, signOut } = useLogtoContext();

  if (isLoading) {
    return <div className="flex items-center gap-2">...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={() => signIn()} variant="outline" size="sm">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm">
        <Link to="/profile" className="hover:underline text-primary">
          <span className="font-semibold">User:</span> {user?.name || user?.id}
        </Link>
        {roles && roles.length > 0 && (
          <span className="ml-2">
            <span className="font-semibold">Roles:</span> {roles.join(', ')}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => signIn()}
          variant="ghost"
          size="sm"
          title="Sign in with a different account"
        >
          Switch
        </Button>
        <Button onClick={() => signOut()} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
