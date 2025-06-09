import { useEffect, useState } from 'react';
import { useLogtoContext } from '../contexts/logto-provider';
import { authClient } from '../lib/authClient';

interface UserProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  roles: string[];
  email_verified?: boolean;
  created_at?: number;
  updated_at?: number;
}

export function ProfilePage() {
  const { isAuthenticated, isLoading, user } = useLogtoContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // First validate the token with the server
        const isValid = await authClient.validateToken();

        if (!isValid) {
          setError('Your session is no longer valid. Please sign in again.');
          setLoading(false);
          return;
        }

        // If token is valid, fetch the profile
        const response = await authClient.fetchWithAuth('/api/v1/auth/me');

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);

        // Handle specific authentication errors
        if (err instanceof Error && err.name === 'AuthError') {
          const authError = err as any;
          if (authError.code === 'not_authenticated') {
            setError('You are not authenticated. Please sign in.');
          } else {
            setError(err.message || 'Authentication error');
          }
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 w-24 h-24">
              {profile?.picture && (
                <img
                  src={profile.picture}
                  alt={profile.name || 'User'}
                  className="w-24 h-24 rounded-full object-cover border-4 border-background"
                />
              )}
            </div>

            <div className="flex-grow">
              <h2 className="text-xl font-semibold mb-4">
                {profile?.name || user?.name || 'User'}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-medium">{profile?.sub || user?.id}</p>
                  </div>

                  {profile?.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email}</p>
                      {profile.email_verified !== undefined && (
                        <span
                          className={`text-xs ${profile.email_verified ? 'text-green-500' : 'text-amber-500'}`}
                        >
                          {profile.email_verified ? 'Verified' : 'Not Verified'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {profile?.roles && profile.roles.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.roles.map((role, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(profile?.created_at || profile?.updated_at) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    {profile.created_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Account Created</p>
                        <p className="font-medium">
                          {new Date(profile.created_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {profile.updated_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">
                          {new Date(profile.updated_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
