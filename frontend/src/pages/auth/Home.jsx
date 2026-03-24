import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, resetPassword, verifyEmail } from "../../store/slices/authSlice.js";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input, Label } from "../../components/ui/input.jsx";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

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
      toast.success("Reset email sent!");
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
          <p className="text-sm text-muted-foreground">We sent a password reset link to <strong>{email}</strong></p>
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
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    dispatch(verifyEmail(token)).then((result) => {
      setStatus(verifyEmail.fulfilled.match(result) ? "success" : "error");
    });
  }, [token, dispatch]);

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
              <p className="text-sm text-muted-foreground">Your email has been verified successfully.</p>
              <Link to="/sign-in"><Button variant="outline">Back to Sign in</Button></Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <h3 className="text-lg font-semibold">Verification Failed</h3>
              <p className="text-sm text-muted-foreground">The link may be invalid or expired.</p>
              <Link to="/sign-in"><Button variant="outline">Back to Sign in</Button></Link>
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
      <h1 className="text-4xl font-bold">TaskHub</h1>
      <p className="text-muted-foreground text-lg">Manage projects, track tasks, and collaborate with your team — all in one place.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/sign-up"><Button size="lg">Get Started</Button></Link>
        <Link to="/sign-in"><Button variant="outline" size="lg">Sign In</Button></Link>
      </div>
    </div>
  );
}

export default Home;
