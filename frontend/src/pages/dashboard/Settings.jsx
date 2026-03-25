import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input, Label } from "../../components/ui/input.jsx";
import { Separator } from "../../components/ui/misc.jsx";
import { Bell, Shield, Palette, Settings as SettingsIcon, ExternalLink, Sun, Moon, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function Settings() {
  const { user } = useSelector((s) => s.auth);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");

  const handleThemeChange = (value) => {
    setTheme(value);
    localStorage.setItem("theme", value);
    if (value === "dark") { document.documentElement.classList.add("dark"); }
    else if (value === "light") { document.documentElement.classList.remove("dark"); }
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Customize how TaskHub looks for you</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    theme === value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Notifications appear in the bell icon in the header</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Bell className="h-4 w-4 shrink-0" />
              <p>You will be notified when you are assigned a task, someone comments on your task, or when you are invited to a workspace. Check the 🔔 bell icon in the header to view and manage your notifications.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Manage your security preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.is2FAEnabled ? "✅ Enabled — your account has extra security" : "Not enabled — add an extra layer of security"}
              </p>
            </div>
            <Link to="/user/profile">
              <Button variant="outline" size="sm">
                {user?.is2FAEnabled ? "Manage 2FA" : "Enable 2FA"}
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground mt-0.5">Update your account password</p>
            </div>
            <Link to="/user/profile">
              <Button variant="outline" size="sm">
                Change Password
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Name</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Email Verified</p>
              <p className="font-medium">{user?.isEmailVerified ? "✅ Verified" : "❌ Not verified"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">2FA Status</p>
              <p className="font-medium">{user?.is2FAEnabled ? "✅ Enabled" : "❌ Disabled"}</p>
            </div>
          </div>
          <Separator />
          <Link to="/user/profile">
            <Button variant="outline" size="sm" className="w-full">
              Go to Profile Settings
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
