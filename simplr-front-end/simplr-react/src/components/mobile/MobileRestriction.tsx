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

export default function MobileRestriction() {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
        <div className="absolute bottom-1/4 -right-4 w-32 h-32 bg-accent/10 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-safe-top pb-safe-bottom">
        <div className="w-full max-w-sm mx-auto text-center space-y-4">
          
          {/* Header Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Badge 
              variant="secondary" 
              className="px-3 py-1 text-sm font-medium bg-muted/50 backdrop-blur-sm border border-border/50"
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
            className="space-y-4"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-destructive-foreground text-sm font-bold">×</span>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Spaces (Beta)
                <br />
                Desktop Only
              </h1>
              
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
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
            className="grid grid-cols-1 gap-3"
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
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-xs text-foreground">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-primary mb-2">
                  <Monitor className="w-4 h-4" />
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-xs font-medium">Switch to desktop for full access</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Experience the complete Spaces feature set on larger screens
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}