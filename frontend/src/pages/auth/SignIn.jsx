import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginUser, clearError, clearRequires2FA } from "../../store/slices/authSlice.js";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form.jsx";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({ otp: z.string().length(6, "Code must be 6 digits") });

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, requires2FA, pendingEmail } = useSelector((s) => s.auth);
  const [showPw, setShowPw] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState(null);

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const otpForm = useForm({ resolver: zodResolver(otpSchema), defaultValues: { otp: "" } });

  const onSubmit = async (values) => {
    dispatch(clearError());
    setSavedCredentials(values);
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      if (!result.payload.requires2FA) {
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.info("Verification code sent to your email");
      }
    } else {
      toast.error(result.payload || "Login failed");
    }
  };

  const onOTPSubmit = async (values) => {
    if (!savedCredentials) return;
    dispatch(clearError());
    const result = await dispatch(loginUser({ ...savedCredentials, otp: values.otp }));
    if (loginUser.fulfilled.match(result)) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error(result.payload || "Invalid code");
    }
  };

  const handleBack = () => { dispatch(clearRequires2FA()); otpForm.reset(); setSavedCredentials(null); };

  if (requires2FA) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Two-Factor Verification</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
              <FormField control={otpForm.control} name="otp" render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-[0.5em] font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying...</> : "Verify & Sign in"}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-sm" onClick={handleBack}>
                ← Back to sign in
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your TaskHub account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} placeholder="••••••••" {...field} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in...</> : "Sign in"}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Link to="/sign-up" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </CardContent>
    </Card>
  );
}
