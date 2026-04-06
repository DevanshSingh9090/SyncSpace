import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import bcrypt from "bcrypt";
import { uploadAvatar } from "../libs/cloudinary.js";

const getProfile = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Upload avatar to Cloudinary then update the user's profilePicture URL.
 * Expects { base64Image: "data:image/...;base64,..." } in request body.
 */
const uploadUserAvatar = async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ message: "No image provided" });

    // Validate it's a valid data URL
    if (!base64Image.startsWith("data:image/")) {
      return res.status(400).json({ message: "Invalid image format. Must be a base64 data URL." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Upload to Cloudinary, replacing old avatar if exists
    const { url, publicId } = await uploadAvatar(base64Image, user.avatarPublicId || null);

    // Save new URL and public ID
    user.profilePicture = url;
    user.avatarPublicId = publicId;
    await user.save();

    res.status(200).json({
      message: "Avatar uploaded successfully",
      profilePicture: url,
      user: await User.findById(req.user._id),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true }
    );

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId).populate(
      "members.user",
      "name profilePicture email"
    );

    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    res.status(200).json(workspace.members);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { getProfile, uploadUserAvatar, updateProfile, changePassword, getWorkspaceMembers };

