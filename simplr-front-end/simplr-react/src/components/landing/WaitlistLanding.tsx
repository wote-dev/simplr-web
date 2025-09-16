import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToastContext';
import { 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Shield, 
  Users, 
  ArrowRight,
  Mail,
  Star
} from 'lucide-react';

export function WaitlistLanding() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { setTheme } = useTheme();
  const { showToast } = useToast();

  // Force dark mode for waitlist page
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    showToast('Successfully joined the waitlist!', 'success');
  };

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for speed and performance'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected and encrypted'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered',
      description: 'Smart features that adapt to you'
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-accent/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-screen px-4 py-6">
        <div className="w-full max-w-4xl mx-auto text-center space-y-6">
          
          {/* Header Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Badge 
              variant="secondary" 
              className="px-4 py-2 text-sm font-medium bg-muted/50 backdrop-blur-sm border border-border/50"
            >
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              Coming Soon - Early Access
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-3"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                Welcome to
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Spaces
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience the next generation of task management with AI-powered insights, 
              seamless collaboration, and beautiful design that adapts to your workflow.
            </p>
          </motion.div>

          {/* Waitlist Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-md mx-auto"
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardContent className="p-4">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          <span>Joining...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Join Waitlist</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">You're on the list!</h3>
                      <p className="text-sm text-muted-foreground">
                        We'll notify you when early access is available.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.4 + index * 0.1, 
                  ease: [0.25, 0.46, 0.45, 0.94] 
                }}
              >
                <Card className="bg-card/30 backdrop-blur-sm border border-border/30 hover:border-border/50 transition-all duration-300 h-full">
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center justify-center space-x-6 text-xs text-muted-foreground"
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>1,247+ early adopters</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Privacy focused</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}