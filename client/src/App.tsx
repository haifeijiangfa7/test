import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Invitees from "./pages/Invitees";
import Invitation from "./pages/Invitation";
import CreditTasks from "./pages/CreditTasks";
import InvitationLogs from "./pages/InvitationLogs";
import AccountLogs from "./pages/AccountLogs";
import AccountStock from "./pages/AccountStock";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/invitees" component={Invitees} />
      <Route path="/invitation" component={Invitation} />
      <Route path="/credit-tasks" component={CreditTasks} />
      <Route path="/logs" component={InvitationLogs} />
      <Route path="/account-logs" component={AccountLogs} />
      <Route path="/account-stock" component={AccountStock} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
