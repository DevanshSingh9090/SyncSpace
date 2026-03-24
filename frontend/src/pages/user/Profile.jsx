import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, changePassword, enable2FA, verify2FA, disable2FA } from "../../store/slices/authSlice.js";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input, Label } from "../../components/ui/input.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/select.jsx";
import { Separator } from "../../components/ui/misc.jsx";
import { Loader2, Camera, ShieldCheck, ShieldOff, Shield } from "lucide-react";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, twoFALoading } = useSelector((s) => s.auth);
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", profilePicture: user?.profilePicture || "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || "");

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // 2FA state
  const [twoFAStep, setTwoFAStep] = useState("idle"); // idle | sent | verified
  const [otpInput, setOtpInput] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be smaller than 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setAvatarPreview(dataUrl);
      setProfileForm((prev) => ({ ...prev, profilePicture: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const result = await dispatch(updateProfile(profileForm));
    setProfileSaving(false);
    if (updateProfile.fulfilled.match(result)) { toast.success("Profile updated!"); }
    else { toast.error(result.payload || "Failed to update profile"); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (pwForm.newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPwSaving(true);
    const result = await dispatch(changePassword(pwForm));
    setPwSaving(false);
    if (changePassword.fulfilled.match(result)) {
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else { toast.error(result.payload || "Failed to change password"); }
  };

  // 2FA handlers
  const handleEnable2FA = async () => {
    const result = await dispatch(enable2FA());
    if (enable2FA.fulfilled.match(result)) {
      setTwoFAStep("sent");
      toast.info("Verification code sent to your email");
    } else { toast.error(result.payload || "Failed to send code"); }
  };

  const handleVerify2FA = async () => {
    if (otpInput.length !== 6) { toast.error("Please enter a 6-digit code"); return; }
    const result = await dispatch(verify2FA(otpInput));
    if (verify2FA.fulfilled.match(result)) {
      setTwoFAStep("idle");
      setOtpInput("");
      toast.success("Two-factor authentication enabled!");
    } else { toast.error(result.payload || "Invalid code"); }
  };

  const handleDisable2FA = async () => {
    const result = await dispatch(disable2FA());
    if (disable2FA.fulfilled.match(result)) { toast.success("Two-factor authentication disabled"); }
    else { toast.error(result.payload || "Failed to disable 2FA"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account details and security</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your name and avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview} alt={user?.name} />
                  <AvatarFallback className="text-2xl">{user?.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                </Avatar>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow">
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF · Max 2MB</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user?.email || ""} readOnly disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            {user?.is2FAEnabled ? (
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.is2FAEnabled ? "2FA is enabled" : "2FA is disabled"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.is2FAEnabled
                  ? "Your account is protected with two-factor authentication"
                  : "Protect your account with a verification code on each login"}
              </p>
            </div>
          </div>

          {user?.is2FAEnabled ? (
            <Button variant="destructive" onClick={handleDisable2FA} disabled={twoFALoading}>
              {twoFALoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Disabling...</> : "Disable 2FA"}
            </Button>
          ) : twoFAStep === "idle" ? (
            <Button onClick={handleEnable2FA} disabled={twoFALoading}>
              {twoFALoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending code...</> : "Enable 2FA"}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">A 6-digit code was sent to <strong>{user?.email}</strong>. Enter it below:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-[0.4em] font-mono max-w-[160px]"
                />
                <Button onClick={handleVerify2FA} disabled={twoFALoading || otpInput.length !== 6}>
                  {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
                <Button variant="ghost" onClick={() => { setTwoFAStep("idle"); setOtpInput(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPw">Current Password</Label>
              <Input id="currentPw" type="password" value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPw">New Password</Label>
              <Input id="newPw" type="password" value={pwForm.newPassword} minLength={8}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPw">Confirm New Password</Label>
              <Input id="confirmPw" type="password" value={pwForm.confirmPassword} minLength={8}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
            </div>
            <Button type="submit" disabled={pwSaving}>
              {pwSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
