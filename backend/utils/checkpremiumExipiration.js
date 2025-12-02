const cron = require("node-cron");
const User = require("../models/webapp-models/userModel");

cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();

    // Find ALL users whose premium has expired
    const expiredUsers = await User.find({
      premiumExpiration: { $lte: now }   // Only expiration date matters
    });

    if (expiredUsers.length > 0) {
      const userIds = expiredUsers.map((u) => u._id);

      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            isPremium: false,
            planType: "Free",
            premiumExpiration: null
          }
        }
      );

      console.log(`✔ Cron: Expired premium cleared for ${expiredUsers.length} users.`);
    } else {
      console.log("✔ Cron: No expired users found.");
    }

  } catch (error) {
    console.error("❌ Cron Error:", error);
  }
});
