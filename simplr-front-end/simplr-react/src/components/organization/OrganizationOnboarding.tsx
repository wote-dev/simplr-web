import { useState } from 'react';
import { InviteCodeForm } from './InviteCodeForm';
import { CreateOrganizationForm } from './CreateOrganizationForm';

type OnboardingStep = 'choice' | 'create' | 'join';

interface OrganizationOnboardingProps {
  onComplete?: () => void;
  className?: string;
}

export function OrganizationOnboarding({ onComplete, className = '' }: OrganizationOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('choice');
  const [completedAction, setCompletedAction] = useState<string | null>(null);

  const handleCreateSuccess = (organization: { id: string; name: string }) => {
    setCompletedAction(`Created organization "${organization.name}"`);
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  const handleJoinSuccess = (organizationName: string) => {
    setCompletedAction(`Joined organization "${organizationName}"`);
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  const handleBack = () => {
    setCurrentStep('choice');
  };

  if (completedAction) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center ${className}`}>
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Success!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {completedAction}
        </p>
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Redirecting...</span>
        </div>
      </div>
    );
  }

  if (currentStep === 'choice') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 ${className}`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Simplr Enterprise
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get started by creating a new organization or joining an existing one.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Organization Option */}
          <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
               onClick={() => setCurrentStep('create')}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 transition-colors mb-4">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create Organization
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Start fresh with your own organization and invite team members.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <ul className="space-y-1">
                  <li>• Full admin control</li>
                  <li>• Invite team members</li>
                  <li>• Customize settings</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Join Organization Option */}
          <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-green-500 dark:hover:border-green-400 transition-colors cursor-pointer group"
               onClick={() => setCurrentStep('join')}>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/40 transition-colors mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Join Organization
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Use an invite code to join an existing organization.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <ul className="space-y-1">
                  <li>• Quick setup</li>
                  <li>• Access shared tasks</li>
                  <li>• Collaborate instantly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You can always create additional organizations or switch between them later.
          </p>
        </div>
      </div>
    );
  }

  if (currentStep === 'create') {
    return (
      <div className={className}>
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>
        </div>
        <CreateOrganizationForm
          onSuccess={handleCreateSuccess}
          onCancel={handleBack}
        />
      </div>
    );
  }

  if (currentStep === 'join') {
    return (
      <div className={className}>
        <div className="mb-4">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>
        </div>
        <InviteCodeForm
          onSuccess={handleJoinSuccess}
          onCancel={handleBack}
        />
      </div>
    );
  }

  return null;
}