import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Database, Lock, Eye, Server, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Privacy Policy & Terms of Service</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Introduction */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Your Privacy Matters</h2>
          <p className="text-muted-foreground leading-relaxed">
            Spaces is designed with privacy and security at its core. This document explains how we handle your data,
            what information we collect, and how we protect your privacy.
          </p>
        </div>

        <Separator />

        {/* Data Storage Options */}
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <span>How Your Data is Stored</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-green-600">Guest Users</h4>
                <ul className="text-muted-foreground space-y-2 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>All data stored locally on your device</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>No data sent to our servers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Complete privacy and offline functionality</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Data stays with you, even if you clear browser data</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-blue-600">Authenticated Users</h4>
                <ul className="text-muted-foreground space-y-2 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Data synced to our secure database</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Access your tasks from any device</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Automatic cloud backup and sync</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Enterprise-grade security with Supabase</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <span>Data Storage & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg font-semibold flex items-center space-x-2">
                <Server className="h-5 w-5 text-primary" />
                <span>Supabase Infrastructure (Authenticated Users Only)</span>
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                For authenticated users, tasks are securely stored using Supabase, a trusted open-source backend-as-a-service platform.
                Supabase provides enterprise-grade security with PostgreSQL databases hosted on AWS infrastructure.
                Guest users' data never leaves their device.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-lg font-semibold flex items-center space-x-2">
                <Lock className="h-5 w-5 text-primary" />
                <span>End-to-End Security</span>
              </h4>
              <ul className="text-muted-foreground space-y-3 ml-4">
                <li className="flex items-start space-x-3">
                  <span className="text-primary mt-1 text-lg">•</span>
                  <span>All data is encrypted in transit using TLS/SSL encryption</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-primary mt-1 text-lg">•</span>
                  <span>Data is encrypted at rest in Supabase's secure databases</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-primary mt-1 text-lg">•</span>
                  <span>Row Level Security (RLS) ensures you can only access your own tasks</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-primary mt-1 text-lg">•</span>
                  <span>Authentication is handled securely through OAuth providers</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* What We Don't Do */}
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center space-x-2">
              <Eye className="h-6 w-6 text-primary" />
              <span>What We Don't Do</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-muted-foreground space-y-4">
              <li className="flex items-start space-x-3">
                <span className="text-green-600 mt-1 text-lg">✓</span>
                <span><strong>We cannot read your tasks:</strong> Your task content is private and only accessible to you</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600 mt-1 text-lg">✓</span>
                <span><strong>No data selling:</strong> We never sell, rent, or share your personal information with third parties</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600 mt-1 text-lg">✓</span>
                <span><strong>No advertising:</strong> We don't use your data for advertising or marketing purposes</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600 mt-1 text-lg">✓</span>
                <span><strong>No tracking:</strong> We don't track your behavior across other websites or apps</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-600 mt-1 text-lg">✓</span>
                <span><strong>No unnecessary data collection:</strong> We only collect what's essential for the app to function</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary" />
              <span>What Data We Collect</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Account Information</h4>
              <ul className="text-muted-foreground space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Email address (from OAuth provider)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Display name (from OAuth provider)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Profile picture (from OAuth provider)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Task Data</h4>
              <ul className="text-muted-foreground space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Task titles and descriptions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Task categories and completion status</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Due dates and creation timestamps</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Checklist items (if added)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Technical Data</h4>
              <ul className="text-muted-foreground space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>User preferences (theme, settings)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Session tokens (for authentication)</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Your Rights & Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-muted-foreground space-y-4">
              <li className="flex items-start space-x-3">
                <span className="text-primary mt-1 text-lg">•</span>
                <span><strong>Data Export:</strong> Download all your tasks as JSON at any time</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-primary mt-1 text-lg">•</span>
                <span><strong>Data Deletion:</strong> Delete your account and all associated data</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-primary mt-1 text-lg">•</span>
                <span><strong>Data Portability:</strong> Take your data with you if you choose to leave</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-primary mt-1 text-lg">•</span>
                <span><strong>Access Control:</strong> Manage your account through OAuth provider settings</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Terms of Service */}
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Acceptable Use</h4>
              <p className="text-muted-foreground leading-relaxed">
                Spaces is intended for personal and professional task management. Please use the service responsibly
                and in accordance with applicable laws.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Service Availability</h4>
              <p className="text-muted-foreground leading-relaxed">
                While we strive for 99.9% uptime, Spaces is provided "as is" without warranties. We recommend
                regular data exports as a backup measure.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-lg font-semibold">Changes to Terms</h4>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms occasionally. Significant changes will be communicated through the application
                or via email.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Questions or Concerns?</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this privacy policy or our data practices, please don't hesitate to reach out.
            Your privacy and trust are important to us.
          </p>
        </div>

        <Separator />
        
        <div className="text-center space-y-2 pb-8">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Spaces v1.0 (Alpha)
          </p>
        </div>
      </div>
    </div>
  );
}