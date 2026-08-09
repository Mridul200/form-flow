import { Link } from "@tanstack/react-router";
import { Activity, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile, useSignOut, homePathFor } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display ${className}`}>
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Activity className="size-4" strokeWidth={2.5} />
      </span>
      <span className="text-lg font-semibold tracking-tight">RehabAI</span>
    </span>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-accent/40 p-1 text-xs">
      <Globe className="ml-1.5 size-3.5 text-muted-foreground" />
      <button
        type="button"
        id="lang-btn-en"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
          language === "en"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        English
      </button>
      <button
        type="button"
        id="lang-btn-hi"
        onClick={() => setLanguage("hi")}
        className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
          language === "hi"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { profile } = useProfile();
  const { t } = useLanguage();
  const signOut = useSignOut();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to={profile ? homePathFor(profile.role) : "/"} className="flex items-center gap-3">
          <BrandMark />
          {subtitle ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">/ {subtitle}</span>
          ) : null}
        </Link>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <LanguageToggle />

          {profile ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{profile.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{profile.role}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label={t.signOut}>
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">{t.signIn}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MedicalDisclaimer({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <p className={`text-xs leading-relaxed text-muted-foreground ${className}`}>
      {t.disclaimer}
    </p>
  );
}

export function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <BrandMark />
        <MedicalDisclaimer className="max-w-3xl" />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t.appName}. Pose analysis runs entirely on your device.
        </p>
      </div>
    </footer>
  );
}
