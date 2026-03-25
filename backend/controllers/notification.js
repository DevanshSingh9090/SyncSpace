import Notification from "../models/notification.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name profilePicture")
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.status(200).json({ notifications, unreadCount });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json(notification);
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findOneAndDelete({ _id: notificationId, recipient: req.user._id });
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) { console.log(error); res.status(500).json({ message: "Internal server error" }); }
};
