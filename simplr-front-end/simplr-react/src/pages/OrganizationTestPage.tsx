import React, { useState } from 'react';
import { OrganizationOnboarding } from '../components/organization/OrganizationOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Building2, Users, Crown, UserPlus, LogOut, TestTube, Trash2 } from 'lucide-react';
import type { Organization } from '../types';

export function OrganizationTestPage() {
  const { user, isAuthenticated } = useAuth();
  const { 
    organizations, 
    currentOrganization, 
    isLoading, 
    error,
    switchOrganization
  } = useOrganization();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    addTestResult('✅ Organization onboarding completed successfully');
  };

  const handleSwitchOrganization = async (org: Organization) => {
    try {
      await switchOrganization(org.id);
      addTestResult(`✅ Successfully switched to organization: ${org.name}`);
    } catch (error) {
      addTestResult(`❌ Failed to switch organization: ${error}`);
    }
  };

  const handleLeaveOrganization = async (orgId: string) => {
    // Note: leaveOrganization method not yet implemented in OrganizationContext
    addTestResult(`⚠️ Leave organization feature not yet implemented`);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <TestTube className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Organization Test Page</CardTitle>
            <CardDescription>
              Please sign in to test organization features.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <OrganizationOnboarding 
            onComplete={handleOnboardingComplete}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TestTube className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl">Organization Test Dashboard</CardTitle>
                <CardDescription className="text-base">
                  Test organization creation, joining, and management features.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Current State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Current State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">User</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email || 'Not authenticated'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current Organization</p>
                    <p className="text-sm text-muted-foreground">
                      {currentOrganization ? currentOrganization.name : 'None'}
                    </p>
                    {currentOrganization && (
                      <p className="text-xs text-muted-foreground">
                        ID: {currentOrganization.id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <Users className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Organizations</p>
                    <p className="text-sm text-muted-foreground">
                      {organizations.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={isLoading ? "secondary" : "default"}>
                    {isLoading ? 'Loading...' : 'Ready'}
                  </Badge>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm font-medium text-destructive">Error</p>
                    <p className="text-sm text-destructive/80">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Test Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setShowOnboarding(true)}
                className="w-full"
                size="lg"
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Organization Onboarding
              </Button>

              {organizations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">
                    Switch Organization
                  </h3>
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <Card key={org.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">{org.id}</p>
                            </div>
                            {currentOrganization?.id === org.id && (
                              <Badge variant="default" className="ml-2">
                                <Crown className="mr-1 h-3 w-3" />
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {currentOrganization?.id !== org.id && (
                              <Button
                                onClick={() => handleSwitchOrganization(org)}
                                size="sm"
                                variant="default"
                              >
                                Switch
                              </Button>
                            )}
                            <Button
                              onClick={() => handleLeaveOrganization(org.id)}
                              size="sm"
                              variant="secondary"
                              disabled
                            >
                              <LogOut className="mr-1 h-3 w-3" />
                              Leave (TBD)
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Results
              </CardTitle>
              <Button
                onClick={clearTestResults}
                size="sm"
                variant="outline"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 max-h-64 overflow-y-auto">
               {testResults.length === 0 ? (
                 <p className="text-muted-foreground text-sm">
                   No test results yet. Perform some actions to see results here.
                 </p>
               ) : (
                 <div className="space-y-1">
                   {testResults.map((result, index) => (
                     <p key={index} className="text-sm font-mono">
                       {result}
                     </p>
                   ))}
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}