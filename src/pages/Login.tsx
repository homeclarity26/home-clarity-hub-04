import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { humanizeAuthError } from "@/lib/utils";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(humanizeAuthError(error.message));
      setIsLoading(false);
    } else {
      try {
        // Check role to determine redirect
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roles, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

          if (rolesError) throw rolesError;

          const isCreator = roles?.some((r) => r.role === "creator");
          toast.success("Welcome back!");

          if (isCreator) {
            navigate("/admin");
          } else {
            // For clients, navigate to portal
            const { data: property } = await supabase
              .from("properties")
              .select("id")
              .eq("client_user_id", user.id)
              .limit(1)
              .single();

            navigate(property ? `/portal/${property.id}` : "/portal");
          }
        }
      } catch {
        toast.error("Signed in, but couldn't load your account. Please refresh.");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-md p-8 md:p-10 shadow-hbc-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-foreground mb-2">HBC</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Home Clarity Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[0.15em]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-[0.15em]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>


        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
            Forgot your password?
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
