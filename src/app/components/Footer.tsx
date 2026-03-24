import { GithubIcon, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>© 2026 AI Constraint Puzzle Solver</span>
          </div>
        </div>
      </div>
    </footer>
  );
}