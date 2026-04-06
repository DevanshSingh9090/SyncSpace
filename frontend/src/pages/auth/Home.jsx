import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, resetPassword, verifyEmail, resendVerification } from "../../store/slices/authSlice.js";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input, Label } from "../../components/ui/input.jsx";
import { Loader2, CheckCircle, XCircle, RefreshCw, MailCheck } from "lucide-react";

const RESEND_COOLDOWN_SEC = 60;

// ─── ForgotPassword ───────────────────────────────────────────────────────────
export function ForgotPassword() {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(forgotPassword(email));
    if (forgotPassword.fulfilled.match(result)) {
      setSent(true);
      toast.success("If that account exists, a reset link has been sent.");
    } else {
      toast.error(result.payload || "Failed to send email");
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            If an account with <strong>{email}</strong> exists, a reset link has been sent.
          </p>
          <Link to="/sign-in"><Button variant="outline" className="w-full">Back to Sign in</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : "Send reset link"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/sign-in" className="text-primary hover:underline">Back to Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}

// ─── ResetPassword ────────────────────────────────────────────────────────────
export function ResetPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading } = useSelector((s) => s.auth);
  const token = searchParams.get("token");
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="text-lg font-semibold">Invalid Link</h3>
          <p className="text-sm text-muted-foreground">This reset link is missing or malformed.</p>
          <Link to="/forgot-password"><Button variant="outline">Request a new link</Button></Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const result = await dispatch(resetPassword({ token, ...form }));
    if (resetPassword.fulfilled.match(result)) {
      toast.success("Password reset successfully!");
      navigate("/sign-in");
    } else {
      toast.error(result.payload || "Reset failed");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" placeholder="Min 8 characters" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resetting...</> : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── VerifyEmail ──────────────────────────────────────────────────────────────
export function VerifyEmail() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { resendLoading } = useSelector((s) => s.auth);
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | expired | error
  const [errorMsg, setErrorMsg] = useState("The link may be invalid or expired.");

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!token) { setStatus("error"); setErrorMsg("No verification token found in the link."); return; }
    dispatch(verifyEmail(token)).then((result) => {
      if (verifyEmail.fulfilled.match(result)) {
        setStatus("success");
      } else {
        const msg = result.payload || "";
        if (msg.toLowerCase().includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("error");
          setErrorMsg(msg || "The link may be invalid or already used.");
        }
      }
    });
  }, [token, dispatch]);

  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  const handleResend = useCallback(async (e) => {
    e.preventDefault();
    if (!resendEmail || cooldown > 0) return;
    const result = await dispatch(resendVerification(resendEmail));
    if (resendVerification.fulfilled.match(result)) {
      toast.success("Verification email sent — please check your inbox.");
      setResendSent(true);
      setCooldown(RESEND_COOLDOWN_SEC);
    } else {
      toast.error(result.payload || "Failed to resend email");
    }
  }, [resendEmail, cooldown, dispatch]);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">

          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <h3 className="text-lg font-semibold">Verifying email...</h3>
              <p className="text-sm text-muted-foreground">Please wait a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-lg font-semibold">Email Verified!</h3>
              <p className="text-sm text-muted-foreground">Your email has been verified successfully. You can now sign in.</p>
              <Link to="/sign-in"><Button variant="outline">Go to Sign in</Button></Link>
            </>
          )}

          {/* Expired token — show resend form */}
          {status === "expired" && (
            <>
              <MailCheck className="h-12 w-12 text-amber-500" />
              <h3 className="text-lg font-semibold">Link Expired</h3>
              <p className="text-sm text-muted-foreground">Your verification link has expired. Enter your email below to get a fresh one.</p>
              {resendSent ? (
                <p className="text-sm text-green-600 font-medium">✓ A new link has been sent — check your inbox.</p>
              ) : (
                <form onSubmit={handleResend} className="w-full space-y-3 mt-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={resendLoading || cooldown > 0}>
                    {resendLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                    ) : cooldown > 0 ? (
                      <><RefreshCw className="h-4 w-4 mr-2" />Resend in {cooldown}s</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" />Send new link</>
                    )}
                  </Button>
                </form>
              )}
              <Link to="/sign-in" className="text-sm text-primary hover:underline">Back to Sign in</Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h3 className="text-lg font-semibold">Verification Failed</h3>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <div className="flex flex-col gap-2 w-full">
                <Link to="/sign-in"><Button variant="outline" className="w-full">Back to Sign in</Button></Link>
              </div>
            </>
          )}

        </div>
      </CardContent>
    </Card>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export function Home() {
  return (
    <div className="text-center space-y-6 max-w-lg">
      <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center mx-auto">
        <span className="text-4xl text-primary-foreground">⚡</span>
      </div>
      <h1 className="text-4xl font-bold">SyncSpace</h1>
      <p className="text-muted-foreground text-lg">Manage projects, track tasks, and collaborate with your team — all in one place.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/sign-up"><Button size="lg">Get Started</Button></Link>
        <Link to="/sign-in"><Button variant="outline" size="lg">Sign In</Button></Link>
      </div>
    </div>
  );
}

export default Home;
