const nodemailer = require('nodemailer');

// Configure transporter
// For Gmail, using the 'service' shorthand is often safer/easier than manual host/port
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Built-in support for Gmail
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // MUST be a Google App Password, not login password
    },
});

// Verify connection on server start
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP CONNECTION FAILED:", error);
  } else {
    console.log("✅ SMTP SERVER IS READY (Gmail)");
  }
});

/**
 * Notify both users after a claim is confirmed.
 */
async function notifyMatchedUsers(lostUser, foundUser, itemName) {
    const errors = [];
    let sentToLost = false;
    let sentToFound = false;

    if (!lostUser || !lostUser.email || !foundUser || !foundUser.email || !itemName) {
        throw new Error('notifyMatchedUsers requires lostUser, foundUser (with emails) and itemName');
    }

    const mailToLost = {
        from: `"FindIt" <${process.env.SMTP_USER}>`,
        to: lostUser.email,
        subject: `Your item "${itemName}" has a matching report`,
        text: `Hello ${lostUser.name || ''},\n\nGood news — a user has reported finding an item that matches your lost item: "${itemName}".\n\nPlease contact the finder:\nName: ${foundUser.name || 'N/A'}\nEmail: ${foundUser.email}\n\nRegards,\nFindIt Team`,
        html: `<p>Hello ${lostUser.name || ''},</p><p>Good news — a user has reported finding an item that matches your lost item: <strong>${itemName}</strong>.</p><p>Please contact the finder:</p><ul><li>Name: ${foundUser.name || 'N/A'}</li><li>Email: <a href="mailto:${foundUser.email}">${foundUser.email}</a></li></ul><p>Regards,<br/>FindIt Team</p>`,
    };

    const mailToFound = {
        from: `"FindIt" <${process.env.SMTP_USER}>`,
        to: foundUser.email,
        subject: `A user has claimed the item "${itemName}" you reported found`,
        text: `Hello ${foundUser.name || ''},\n\nA user has claimed the item you reported found: "${itemName}".\n\nPlease contact the owner:\nName: ${lostUser.name || 'N/A'}\nEmail: ${lostUser.email}\n\nRegards,\nFindIt Team`,
        html: `<p>Hello ${foundUser.name || ''},</p><p>A user has claimed the item you reported found: <strong>${itemName}</strong>.</p><p>Please contact the owner:</p><ul><li>Name: ${lostUser.name || 'N/A'}</li><li>Email: <a href="mailto:${lostUser.email}">${lostUser.email}</a></li></ul><p>Regards,<br/>FindIt Team</p>`,
    };

    try {
        await transporter.sendMail(mailToLost);
        sentToLost = true;
    } catch (err) {
        errors.push({ to: 'lostUser', error: err.message });
    }

    try {
        await transporter.sendMail(mailToFound);
        sentToFound = true;
    } catch (err) {
        errors.push({ to: 'foundUser', error: err.message });
    }

    return { sentToLost, sentToFound, errors };
}

/**
 * Notify a lost item owner that a potential match was reported.
 */
async function notifyPotentialMatch(lostUser, foundItemSummary, lostItemName) {
    if (!lostUser || !lostUser.email || !foundItemSummary) {
        throw new Error('notifyPotentialMatch requires lostUser (with email) and foundItemSummary');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://findit-psg-connect.vercel.app'; // Updated to likely Vercel URL
    const viewLink = `${frontendUrl}/lost-items/${foundItemSummary.lostItemId || ''}/matches`;

    const mail = {
        from: `"FindIt" <${process.env.SMTP_USER}>`,
        to: lostUser.email,
        subject: `Potential match found for your lost item "${lostItemName || ''}"`,
        html: `
            <p>Hello ${lostUser.name || ''},</p>
            <p>We've found a potential match for your lost item <strong>${lostItemName || ''}</strong>.</p>
            <p><strong>Found item:</strong> ${foundItemSummary.itemName || ''}<br/>
            <strong>Reported by:</strong> ${foundItemSummary.reporterName || 'Someone'}</p>
            <p>Please <a href="${viewLink}">visit the app</a> to review the match.</p>
            <p>Regards,<br/>FindIt Team</p>
        `
    };

    try {
        await transporter.sendMail(mail);
        return { sent: true };
    } catch (err) {
        console.error('notifyPotentialMatch error:', err);
        return { sent: false, error: err.message };
    }
}

// CORRECT WAY TO EXPORT EVERYTHING
module.exports = {
    transporter,
    notifyMatchedUsers,
    notifyPotentialMatch
};