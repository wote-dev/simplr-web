import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Monitor, 
  Smartphone, 
  ArrowRight,
  Sparkles,
  Zap,
  Shield
} from 'lucide-react';

export function MobileRestriction() {
  const features = [
    {
      icon: Zap,
      title: 'Optimized Performance',
      description: 'Desktop-first design for maximum productivity'
    },
    {
      icon: Shield,
      title: 'Advanced Features',
      description: 'Full feature set available on larger screens'
    },
    {
      icon: Sparkles,
      title: 'Enhanced Experience',
      description: 'Rich interactions designed for desktop'
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
        <div className="w-full max-w-2xl mx-auto text-center space-y-8">
          
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
              <Monitor className="w-4 h-4 mr-2 text-primary" />
              Desktop Only - Beta
            </Badge>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-muted-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-destructive-foreground text-lg font-bold">×</span>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Spaces (Beta)
                <br />
                Desktop Only
              </h1>
              
              <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
                We're currently optimizing Spaces for desktop experiences. 
                Please visit us on a desktop or laptop computer to access all features.
              </p>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-1 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.3 + index * 0.1, 
                  ease: [0.25, 0.46, 0.45, 0.94] 
                }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-3 text-muted-foreground">
                  <Monitor className="w-6 h-6" />
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">Switch to desktop for full access</span>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              Mobile support coming soon. Thank you for your patience!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}