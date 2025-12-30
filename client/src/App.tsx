import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Resources from "@/pages/Resources";
import Stocks from "@/pages/Stocks";
import Alerts from "@/pages/Alerts";
import Requests from "@/pages/Requests";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      {isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/resources" component={Resources} />
          <Route path="/stocks" component={Stocks} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/requests" component={Requests} />
          <Route path="/profile" component={Profile} />
        </>
      ) : (
        <Route path="/" component={() => {
          window.location.href = "/login";
          return null;
        }} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
