import React, { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

interface InviteCodeFormProps {
  onSuccess?: (organizationName: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function InviteCodeForm({ onSuccess, onCancel, className = '' }: InviteCodeFormProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationPreview, setOrganizationPreview] = useState<{ name: string; description?: string } | null>(null);
  
  const { validateInviteCode: validateCode, joinWithInviteCode } = useOrganization();

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setOrganizationPreview(null);
      return;
    }

    try {
      const organization = await validateCode(code.trim());
      setOrganizationPreview({
        name: organization.name,
        description: organization.description
      });
      setError(null);
    } catch (err) {
      setOrganizationPreview(null);
      setError('Invalid invite code');
    }
  };

  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setInviteCode(code);
    setError(null);
    
    // Debounce validation
    const timeoutId = setTimeout(() => validateInviteCode(code), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    if (!organizationPreview) {
      setError('Please enter a valid invite code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await joinWithInviteCode(inviteCode.trim());
      onSuccess?.(organizationPreview.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Join Organization
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Enter an invite code to join an existing organization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Invite Code
          </label>
          <input
            type="text"
            id="inviteCode"
            value={inviteCode}
            onChange={handleInviteCodeChange}
            placeholder="Enter invite code..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
        </div>

        {organizationPreview && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Organization Found
                </h3>
                <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                  <p className="font-semibold">{organizationPreview.name}</p>
                  {organizationPreview.description && (
                    <p className="text-xs mt-1">{organizationPreview.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || !organizationPreview}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </div>
            ) : (
              'Join Organization'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}