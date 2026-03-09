import { Home, Search } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 h-auto md:h-24 bg-card border-t border-border z-50 flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-6 md:py-0 gap-6 md:gap-0">
        <div className="flex flex-col gap-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground">
            Welcome to the Portal
          </div>
          <div className="text-sm text-muted-foreground">
            Home Clarity Report in progress
          </div>
        </div>

        <div className="relative flex-1 max-w-md w-full md:mx-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your portal..."
            className="w-full h-12 bg-background border border-border rounded-lg pl-12 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-4">
            Contact Adam
          </Button>
          <a href="/" className="flex items-center justify-center text-foreground no-underline">
            <Home className="w-5 h-5" />
          </a>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 h-10 bg-background flex items-center justify-center font-mono text-[10px] text-muted-foreground z-40 md:relative md:mt-24">
        © 2026 Hometown Builders Club
        <a href="#" className="text-muted-foreground no-underline mx-2">Privacy</a>
        <a href="#" className="text-muted-foreground no-underline mx-2">Terms</a>
      </div>
    </>
  );
};

export default Footer;
