// server/utils/emailTemplates.js

// Base template wrapper
const baseTemplate = (content, title) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .content {
                padding: 40px 30px;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
                transition: transform 0.2s;
            }
            .button:hover {
                transform: translateY(-2px);
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
                border-top: 1px solid #eee;
            }
            .highlight {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
            }
            .task-details {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .task-details h3 {
                margin-top: 0;
                color: #667eea;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-open { background-color: #d4edda; color: #155724; }
            .status-assigned { background-color: #cce5ff; color: #004085; }
            .status-completed { background-color: #d1ecf1; color: #0c5460; }
            .amount {
                font-size: 18px;
                font-weight: bold;
                color: #28a745;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧾 TaskAuction</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>© 2024 TaskAuction. All rights reserved.</p>
                <p>Campus Task Marketplace for Students</p>
                <p>Need help? Contact us at support@taskauction.com</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Welcome email template
const welcomeEmail = (firstName, verificationLink) => {
  const content = `
    <h2>Welcome to TaskAuction, ${firstName}! 🎉</h2>
    <p>We're excited to have you join our campus task marketplace community!</p>
    
    <div class="highlight">
        <strong>What you can do on TaskAuction:</strong>
        <ul>
            <li>📝 Post tasks you need help with</li>
            <li>💰 Bid on tasks to earn money</li>
            <li>💬 Chat with other students</li>
            <li>⭐ Build your reputation through ratings</li>
        </ul>
    </div>

    <p>To get started, please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${verificationLink}</p>
    
    <p>This verification link will expire in 24 hours.</p>
    
    <p>Welcome aboard!</p>
    <p>The TaskAuction Team</p>
  `;

  return baseTemplate(content, "Welcome to TaskAuction");
};

// Email verification template
const emailVerificationEmail = (firstName, verificationLink) => {
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${firstName},</p>
    
    <p>Please click the button below to verify your email address and activate your TaskAuction account:</p>
    
    <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email</a>
    </div>
    
    <p>If you didn't create an account with TaskAuction, please ignore this email.</p>
    
    <p>This link will expire in 24 hours for security reasons.</p>
  `;

  return baseTemplate(content, "Verify Your Email - TaskAuction");
};

// Password reset template
const passwordResetEmail = (firstName, resetLink) => {
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${firstName},</p>
    
    <p>We received a request to reset your TaskAuction password. Click the button below to create a new password:</p>
    
    <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    
    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    
    <p>This link will expire in 1 hour for security reasons.</p>
    
    <p>For security, this link can only be used once.</p>
  `;

  return baseTemplate(content, "Reset Your Password - TaskAuction");
};

// New task notification template
const newTaskNotificationEmail = (firstName, task) => {
  const content = `
    <h2>New Task Posted! 📋</h2>
    <p>Hi ${firstName},</p>
    
    <p>A new task matching your interests has been posted on TaskAuction:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Category:</strong> ${task.category}</p>
        <p><strong>Budget:</strong> <span class="amount">₹${
          task.budget.min
        } - ₹${task.budget.max}</span></p>
        <p><strong>Deadline:</strong> ${new Date(
          task.deadline
        ).toLocaleDateString()}</p>
        <p><strong>Location:</strong> ${task.location || "Not specified"}</p>
        
        <p><strong>Description:</strong></p>
        <p>${task.description.substring(0, 200)}${
    task.description.length > 200 ? "..." : ""
  }</p>
    </div>
    
    <p>Don't miss out on this opportunity!</p>
    
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/tasks/${
    task._id
  }" class="button">View Task & Place Bid</a>
    </div>
  `;

  return baseTemplate(content, "New Task Available - TaskAuction");
};

// Bid received notification template
const bidReceivedEmail = (firstName, bid, task) => {
  const content = `
    <h2>New Bid Received! 💰</h2>
    <p>Hi ${firstName},</p>
    
    <p>Great news! You've received a new bid on your task:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Bid Amount:</strong> <span class="amount">₹${
          bid.amount
        }</span></p>
        <p><strong>Proposed Timeline:</strong> ${bid.proposedTimeline}</p>
        <p><strong>Bidder:</strong> ${bid.bidder.firstName} ${
    bid.bidder.lastName
  }</p>
        <p><strong>Bidder Rating:</strong> ⭐ ${bid.bidder.rating.average.toFixed(
          1
        )} (${bid.bidder.rating.count} reviews)</p>
        
        ${
          bid.message
            ? `<p><strong>Message:</strong></p><p>${bid.message}</p>`
            : ""
        }
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/tasks/${
    task._id
  }" class="button">Review Bid</a>
    </div>
  `;

  return baseTemplate(content, "New Bid Received - TaskAuction");
};

// Bid accepted notification template
const bidAcceptedEmail = (firstName, task, bid) => {
  const content = `
    <h2>Congratulations! Your Bid Was Accepted! 🎉</h2>
    <p>Hi ${firstName},</p>
    
    <p>Excellent news! Your bid has been accepted for the following task:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Your Bid Amount:</strong> <span class="amount">₹${
          bid.amount
        }</span></p>
        <p><strong>Timeline:</strong> ${bid.proposedTimeline}</p>
        <p><strong>Task Poster:</strong> ${task.poster.firstName} ${
    task.poster.lastName
  }</p>
        <p><strong>Deadline:</strong> ${new Date(
          task.deadline
        ).toLocaleDateString()}</p>
        
        <span class="status-badge status-assigned">Assigned</span>
    </div>
    
    <div class="highlight">
        <strong>Next Steps:</strong>
        <ol>
            <li>Start working on the task</li>
            <li>Communicate with the task poster through chat</li>
            <li>Mark the task as completed when finished</li>
            <li>Receive payment and rating</li>
        </ol>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/tasks/${
    task._id
  }" class="button">View Task Details</a>
    </div>
  `;

  return baseTemplate(content, "Bid Accepted - TaskAuction");
};

// Task completed notification template
const taskCompletedEmail = (firstName, task, rating) => {
  const content = `
    <h2>Task Completed Successfully! ✅</h2>
    <p>Hi ${firstName},</p>
    
    <p>Your task has been marked as completed:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Completed by:</strong> ${task.assignedTo.firstName} ${
    task.assignedTo.lastName
  }</p>
        <p><strong>Amount:</strong> <span class="amount">₹${
          task.acceptedBid?.amount || "N/A"
        }</span></p>
        <p><strong>Completed on:</strong> ${new Date(
          task.completionDate
        ).toLocaleDateString()}</p>
        
        ${
          rating
            ? `<p><strong>Your Rating:</strong> ${"⭐".repeat(
                rating
              )} (${rating}/5)</p>`
            : ""
        }
        
        <span class="status-badge status-completed">Completed</span>
    </div>
    
    <p>Thank you for using TaskAuction! We hope you had a great experience.</p>
    
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/tasks/${
    task._id
  }" class="button">View Task</a>
    </div>
  `;

  return baseTemplate(content, "Task Completed - TaskAuction");
};

// New message notification template
const newMessageEmail = (firstName, sender, task, messagePreview) => {
  const content = `
    <h2>New Message Received 💬</h2>
    <p>Hi ${firstName},</p>
    
    <p>You have a new message from <strong>${sender.firstName} ${
    sender.lastName
  }</strong> regarding the task:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Message:</strong></p>
        <p style="font-style: italic; border-left: 3px solid #667eea; padding-left: 15px;">
            "${
              messagePreview.length > 150
                ? messagePreview.substring(0, 150) + "..."
                : messagePreview
            }"
        </p>
    </div>
    
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/chat/task/${
    task._id
  }" class="button">Reply to Message</a>
    </div>
    
    <p>Stay connected and keep the communication flowing!</p>
  `;

  return baseTemplate(content, "New Message - TaskAuction");
};

// Payment received notification template
const paymentReceivedEmail = (firstName, amount, task) => {
  const content = `
    <h2>Payment Received! 💰</h2>
    <p>Hi ${firstName},</p>
    
    <p>Congratulations! You've successfully completed a task and earned money:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Amount Earned:</strong> <span class="amount">₹${amount}</span></p>
        <p><strong>Task Poster:</strong> ${task.poster.firstName} ${
    task.poster.lastName
  }</p>
        <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <span class="status-badge status-completed">Payment Completed</span>
    </div>
    
    <div class="highlight">
        <p><strong>🎉 Great job!</strong> Your earnings will be reflected in your dashboard.</p>
        <p>Keep up the excellent work and continue building your reputation on TaskAuction!</p>
    </div>
    
    <div style="text-align: center;">
        <a href="${
          process.env.CLIENT_URL
        }/dashboard" class="button">View Dashboard</a>
    </div>
  `;

  return baseTemplate(content, "Payment Received - TaskAuction");
};

// Rating received notification template
const ratingReceivedEmail = (firstName, rating, review, task) => {
  const content = `
    <h2>New Rating Received! ⭐</h2>
    <p>Hi ${firstName},</p>
    
    <p>You've received a new rating for your completed task:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Rating:</strong> ${"⭐".repeat(rating)} (${rating}/5)</p>
        <p><strong>From:</strong> ${task.poster.firstName} ${
    task.poster.lastName
  }</p>
        
        ${
          review
            ? `
        <p><strong>Review:</strong></p>
        <p style="font-style: italic; border-left: 3px solid #28a745; padding-left: 15px;">
            "${review}"
        </p>
        `
            : ""
        }
    </div>
    
    <p>Thank you for your excellent work! Positive ratings help build your reputation and attract more tasks.</p>
    
    <div style="text-align: center;">
        <a href="${
          process.env.CLIENT_URL
        }/profile" class="button">View Your Profile</a>
    </div>
  `;

  return baseTemplate(content, "New Rating Received - TaskAuction");
};

// Task deadline reminder template
const deadlineReminderEmail = (firstName, task, hoursRemaining) => {
  const content = `
    <h2>Task Deadline Reminder ⏰</h2>
    <p>Hi ${firstName},</p>
    
    <p>This is a friendly reminder that your task deadline is approaching:</p>
    
    <div class="task-details">
        <h3>${task.title}</h3>
        <p><strong>Deadline:</strong> ${new Date(
          task.deadline
        ).toLocaleString()}</p>
        <p><strong>Time Remaining:</strong> <span style="color: #dc3545; font-weight: bold;">${hoursRemaining} hours</span></p>
        <p><strong>Current Status:</strong> <span class="status-badge status-${task.status.toLowerCase()}">${
    task.status
  }</span></p>
        
        ${
          task.assignedTo
            ? `<p><strong>Assigned to:</strong> ${task.assignedTo.firstName} ${task.assignedTo.lastName}</p>`
            : ""
        }
    </div>
    
    ${
      task.status === "Open"
        ? `
    <div class="highlight">
        <p><strong>Action needed:</strong> Your task hasn't been assigned yet. Consider:</p>
        <ul>
            <li>Extending the deadline</li>
            <li>Adjusting the budget</li>
            <li>Adding more details to attract bidders</li>
        </ul>
    </div>
    `
        : `
    <p>Please coordinate with your assigned bidder to ensure timely completion.</p>
    `
    }
    
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/tasks/${
    task._id
  }" class="button">View Task</a>
    </div>
  `;

  return baseTemplate(content, "Task Deadline Reminder - TaskAuction");
};

// Account deactivation template
const accountDeactivationEmail = (firstName) => {
  const content = `
    <h2>Account Deactivated</h2>
    <p>Hi ${firstName},</p>
    
    <p>Your TaskAuction account has been successfully deactivated as requested.</p>
    
    <div class="highlight">
        <p><strong>What happens next:</strong></p>
        <ul>
            <li>Your profile is no longer visible to other users</li>
            <li>You cannot place new bids or create new tasks</li>
            <li>Existing active tasks and bids remain accessible</li>
            <li>Your data is securely stored for 90 days</li>
        </ul>
    </div>
    
    <p>If you deactivated your account by mistake or change your mind, you can reactivate it by logging in within 90 days.</p>
    
    <p>We're sorry to see you go and hope you'll consider rejoining our community in the future.</p>
    
    <p>Thank you for being part of TaskAuction!</p>
    
    <div style="text-align: center;">
        <a href="${process.env.CLIENT_URL}/login" class="button">Reactivate Account</a>
    </div>
  `;

  return baseTemplate(content, "Account Deactivated - TaskAuction");
};

// Weekly summary template
const weeklySummaryEmail = (firstName, stats) => {
  const content = `
    <h2>Your Weekly Summary 📊</h2>
    <p>Hi ${firstName},</p>
    
    <p>Here's a summary of your TaskAuction activity this week:</p>
    
    <div class="task-details">
        <h3>Your Activity</h3>
        <p><strong>Tasks Posted:</strong> ${stats.tasksPosted}</p>
        <p><strong>Bids Placed:</strong> ${stats.bidsPlaced}</p>
        <p><strong>Tasks Completed:</strong> ${stats.tasksCompleted}</p>
        <p><strong>Messages Sent:</strong> ${stats.messagesSent}</p>
        
        ${
          stats.earnings > 0
            ? `<p><strong>Earnings:</strong> <span class="amount">₹${stats.earnings}</span></p>`
            : ""
        }
        ${
          stats.spent > 0
            ? `<p><strong>Amount Spent:</strong> <span class="amount">₹${stats.spent}</span></p>`
            : ""
        }
    </div>
    
    ${
      stats.newRating
        ? `
    <div class="highlight">
        <p><strong>🎉 New Achievement!</strong> Your average rating is now ${stats.newRating}/5 stars!</p>
    </div>
    `
        : ""
    }
    
    <p>Keep up the great work! The more active you are, the more opportunities you'll find.</p>
    
    <div style="text-align: center;">
        <a href="${
          process.env.CLIENT_URL
        }/dashboard" class="button">View Dashboard</a>
    </div>
  `;

  return baseTemplate(content, "Weekly Summary - TaskAuction");
};

// Export all templates
module.exports = {
  baseTemplate,
  welcomeEmail,
  emailVerificationEmail,
  passwordResetEmail,
  newTaskNotificationEmail,
  bidReceivedEmail,
  bidAcceptedEmail,
  taskCompletedEmail,
  newMessageEmail,
  paymentReceivedEmail,
  ratingReceivedEmail,
  deadlineReminderEmail,
  accountDeactivationEmail,
  weeklySummaryEmail,
};
