const nodemailer = require('nodemailer');

// Configure transporter using environment variables (backend SMTP already set up)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Notify both users after a claim is confirmed.
 * @param {{name: string, email: string}} lostUser - owner of the lost item
 * @param {{name: string, email: string}} foundUser - reporter of the found item
 * @param {string} itemName - name/description of the item
 * @returns {Promise<{sentToLost: boolean, sentToFound: boolean, errors: Array}>}
 */
async function notifyMatchedUsers(lostUser, foundUser, itemName) {
    const errors = [];
    let sentToLost = false;
    let sentToFound = false;

    if (!lostUser || !lostUser.email || !foundUser || !foundUser.email || !itemName) {
        throw new Error('notifyMatchedUsers requires lostUser, foundUser (with emails) and itemName');
    }

    // Email to lost item owner: provide found user's contact info
    const mailToLost = {
        from: process.env.SMTP_FROM || `"FindIt" <${process.env.SMTP_USER}>`,
        to: lostUser.email,
        subject: `Your item "${itemName}" has a matching report`,
        text: `Hello ${lostUser.name || ''},

Good news — a user has reported finding an item that matches your lost item: "${itemName}".

Please contact the finder to arrange recovery:
Name: ${foundUser.name || 'N/A'}
Email: ${foundUser.email}

If you need further assistance, reply to this email or visit the app.

Regards,
FindIt Team
`,
        html: `
            <p>Hello ${lostUser.name || ''},</p>
            <p>Good news — a user has reported finding an item that matches your lost item: <strong>${itemName}</strong>.</p>
            <p>Please contact the finder to arrange recovery:</p>
            <ul>
              <li>Name: ${foundUser.name || 'N/A'}</li>
              <li>Email: <a href="mailto:${foundUser.email}">${foundUser.email}</a></li>
            </ul>
            <p>If you need further assistance, reply to this email or visit the app.</p>
            <p>Regards,<br/>FindIt Team</p>
        `,
    };

    // Email to found item reporter: provide lost user's contact info
    const mailToFound = {
        from: process.env.SMTP_FROM || `"FindIt" <${process.env.SMTP_USER}>`,
        to: foundUser.email,
        subject: `A user has claimed the item "${itemName}" you reported found`,
        text: `Hello ${foundUser.name || ''},

A user has claimed the item you reported as found: "${itemName}".

Please contact the owner to coordinate return:
Name: ${lostUser.name || 'N/A'}
Email: ${lostUser.email}

If you need further assistance, reply to this email or visit the app.

Regards,
FindIt Team
`,
        html: `
            <p>Hello ${foundUser.name || ''},</p>
            <p>A user has claimed the item you reported as found: <strong>${itemName}</strong>.</p>
            <p>Please contact the owner to coordinate return:</p>
            <ul>
              <li>Name: ${lostUser.name || 'N/A'}</li>
              <li>Email: <a href="mailto:${lostUser.email}">${lostUser.email}</a></li>
            </ul>
            <p>If you need further assistance, reply to this email or visit the app.</p>
            <p>Regards,<br/>FindIt Team</p>
        `,
    };

    try {
        await transporter.verify();
    } catch (err) {
        // transporter not ready — record error but attempt sends (sendMail will likely fail)
        errors.push({ stage: 'verify', error: err.message || String(err) });
    }

    try {
        await transporter.sendMail(mailToLost);
        sentToLost = true;
    } catch (err) {
        errors.push({ to: 'lostUser', error: err.message || String(err) });
    }

    try {
        await transporter.sendMail(mailToFound);
        sentToFound = true;
    } catch (err) {
        errors.push({ to: 'foundUser', error: err.message || String(err) });
    }

    return {
        sentToLost,
        sentToFound,
        errors,
    };
}

module.exports = {
    notifyMatchedUsers,
};

/**
 * Notify a lost item owner that a potential match (found item) was reported.
 * @param {{name:string,email:string}} lostUser
 * @param {{itemName:string,placeFound?:string,dateFound?:Date,reporterName?:string,reporterEmail?:string,id?:string}} foundItemSummary
 * @param {string} lostItemName
 */
async function notifyPotentialMatch(lostUser, foundItemSummary, lostItemName) {
    if (!lostUser || !lostUser.email || !foundItemSummary) {
        throw new Error('notifyPotentialMatch requires lostUser (with email) and foundItemSummary');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const viewLink = `${frontendUrl}/lost-items/${foundItemSummary.lostItemId || ''}/matches`;

    const mail = {
        from: process.env.SMTP_FROM || `"FindIt" <${process.env.SMTP_USER}>`,
        to: lostUser.email,
        subject: `Potential match found for your lost item "${lostItemName || ''}"`,
        text: `Hello ${lostUser.name || ''},\n\nWe've found a potential match for your lost item "${lostItemName || ''}".\n\nFound item: ${foundItemSummary.itemName || ''}\nFound at: ${foundItemSummary.placeFound || 'N/A'}\nDate found: ${foundItemSummary.dateFound ? new Date(foundItemSummary.dateFound).toLocaleString() : 'N/A'}\nReported by: ${foundItemSummary.reporterName || 'Someone'}${foundItemSummary.reporterEmail ? ' (' + foundItemSummary.reporterEmail + ')' : ''}\n\nPlease visit the app to review the match and decide whether to claim it: ${viewLink}\n\nRegards,\nFindIt Team`,
        html: `
            <p>Hello ${lostUser.name || ''},</p>
            <p>We've found a potential match for your lost item <strong>${lostItemName || ''}</strong>.</p>
            <p>
              <strong>Found item:</strong> ${foundItemSummary.itemName || ''}<br/>
              <strong>Found at:</strong> ${foundItemSummary.placeFound || 'N/A'}<br/>
              <strong>Date found:</strong> ${foundItemSummary.dateFound ? new Date(foundItemSummary.dateFound).toLocaleString() : 'N/A'}<br/>
              <strong>Reported by:</strong> ${foundItemSummary.reporterName || 'Someone'}${foundItemSummary.reporterEmail ? ` (<a href="mailto:${foundItemSummary.reporterEmail}">${foundItemSummary.reporterEmail}</a>)` : ''}
            </p>
            <p>Please <a href="${viewLink}">visit the app</a> to review the match and decide whether to claim it.</p>
            <p>Regards,<br/>FindIt Team</p>
        `
    };

    try {
        await transporter.sendMail(mail);
        return { sent: true };
    } catch (err) {
        console.error('notifyPotentialMatch error:', err);
        return { sent: false, error: err.message || String(err) };
    }
}

// export the new function
module.exports.notifyPotentialMatch = notifyPotentialMatch;
