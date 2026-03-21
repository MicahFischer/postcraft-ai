import { Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth, useProfile } from "@/providers";
import { AppShell } from "@/components/postcraft/app-shell";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { GeneratePage } from "@/pages/GeneratePage";
import { CalendarPage } from "@/pages/CalendarPage";
import { HooksPage } from "@/pages/HooksPage";
import { VoiceSettingsPage } from "@/pages/VoiceSettingsPage";
import { CarouselPage } from "@/pages/CarouselPage";

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function AppShellLayout() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasVoice = profile?.voice_profile_json != null;

  if (!hasVoice && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (location.pathname === "/onboarding") {
    return <Outlet />;
  }

  return (
    <AppShell
      user={{
        name: profile?.full_name,
        email: user?.email ?? undefined,
      }}
    >
      <Outlet />
    </AppShell>
  );
}

function SuspenseFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <Suspense fallback={<SuspenseFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShellLayout />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/generate"
              element={
                <Suspense fallback={<SuspenseFallback />}>
                  <GeneratePage />
                </Suspense>
              }
            />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/hooks" element={<HooksPage />} />
            <Route path="/settings/voice" element={<VoiceSettingsPage />} />
            <Route path="/posts/:id/carousel" element={<CarouselPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
