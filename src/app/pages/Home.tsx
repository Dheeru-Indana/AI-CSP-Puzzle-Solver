import { Link } from 'react-router';
import { Calculator, Map, Sparkles, Brain, Zap, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '../components/ui/dialog';

const gameModes = [
  {
    id: 'crypt-arithmetic',
    title: 'Crypt Arithmetic',
    description: 'Decode mathematical puzzles where letters represent digits',
    icon: Calculator,
    path: '/crypt-arithmetic',
    color: 'from-blue-500 to-indigo-600',
    difficulty: 'Medium',
    example: 'SEND + MORE = MONEY'
  },
  {
    id: 'map-coloring',
    title: 'Map Coloring',
    description: 'Color regions so no adjacent areas share the same color',
    icon: Map,
    path: '/map-coloring',
    color: 'from-violet-500 to-purple-600',
    difficulty: 'Easy',
    example: '4-Color Theorem in Action'
  },
  {
    id: 'custom-csp',
    title: 'Custom CSP Builder',
    description: 'Create and solve your own constraint satisfaction problems',
    icon: Sparkles,
    path: '/custom-csp',
    color: 'from-emerald-500 to-teal-600',
    difficulty: 'Advanced',
    example: 'Define Variables & Constraints'
  }
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Solving',
    description: 'Watch intelligent algorithms solve complex puzzles step-by-step'
  },
  {
    icon: Zap,
    title: 'Real-Time Visualization',
    description: 'See backtracking, constraint checking, and variable assignment live'
  },
  {
    icon: Trophy,
    title: 'Learn & Compete',
    description: 'Educational insights with gamification and achievement tracking'
  }
];

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0">
            Educational AI Platform
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI Constraint Puzzle Solver
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Play, Learn, and Watch AI Solve Complex Problems
          </p>
          <div className="flex gap-4 justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 border-0 shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 duration-200">
                  Start Playing
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-background/80 backdrop-blur-xl border-border/50">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent mb-1">Select a Game</DialogTitle>
                <DialogDescription className="mb-4">
                  Choose one of the constraint satisfaction puzzles to solve.
                </DialogDescription>
                <div className="grid gap-3">
                  {gameModes.map((mode) => (
                    <Link key={mode.id} to={mode.path} state={{ fromHome: true }} className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className="flex w-full items-center gap-4">
                        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${mode.color} text-white`}>
                          <mode.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold">{mode.title}</h4>
                          <p className="text-xs text-muted-foreground">{mode.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 flex items-center justify-center mb-3">
                    <feature.icon className="w-6 h-6 text-indigo-500" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Game Information Display */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold mb-8 text-center bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Available Puzzles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {gameModes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="h-full"
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300 h-full overflow-hidden relative group">
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${mode.color} opacity-70`} />
                  <CardHeader className="pb-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center shadow-lg`}>
                        <mode.icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-xs backdrop-blur-md">
                        {mode.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-3 tracking-tight">{mode.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed mb-4 flex-1">
                      {mode.description}
                    </CardDescription>
                    <div className="mt-auto px-4 py-3 bg-muted/30 rounded-xl border border-white/5">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Example</div>
                      <code className="text-sm font-semibold font-mono text-foreground/80">
                        {mode.example}
                      </code>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Educational Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 border border-indigo-500/20"
        >
          <h3 className="text-xl font-semibold mb-3">Built for Learning</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This platform demonstrates advanced AI algorithms including backtracking, forward checking, 
            and constraint propagation. Perfect for students, educators, and AI enthusiasts.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}