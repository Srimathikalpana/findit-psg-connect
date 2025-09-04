const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send match notification
exports.sendMatchNotification = async (lostItem, foundItem, matchScore) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: lostItem.user.email,
      subject: 'Potential Match Found for Your Lost Item!',
      html: `
        <h2>Potential Match Found!</h2>
        <p>Hello ${lostItem.user.name},</p>
        <p>We found a potential match for your lost item:</p>
        
        <h3>Your Lost Item:</h3>
        <ul>
          <li><strong>Item:</strong> ${lostItem.itemName}</li>
          <li><strong>Description:</strong> ${lostItem.description}</li>
          <li><strong>Lost at:</strong> ${lostItem.placeLost}</li>
          <li><strong>Date:</strong> ${new Date(lostItem.dateLost).toLocaleDateString()}</li>
        </ul>
        
        <h3>Found Item:</h3>
        <ul>
          <li><strong>Item:</strong> ${foundItem.itemName}</li>
          <li><strong>Description:</strong> ${foundItem.description}</li>
          <li><strong>Found at:</strong> ${foundItem.placeFound}</li>
          <li><strong>Date:</strong> ${new Date(foundItem.dateFound).toLocaleDateString()}</li>
        </ul>
        
        <p><strong>Match Score:</strong> ${(matchScore * 100).toFixed(1)}%</p>
        
        <p>Please log in to your account to review this match and take action if it's your item.</p>
        
        <p>Best regards,<br>FindIT Team</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Match notification sent successfully');
  } catch (error) {
    console.error('Error sending match notification:', error);
  }
};

// Send claim notification
exports.sendClaimNotification = async (claim, recipientType) => {
  try {
    const transporter = createTransporter();
    
    let subject, to, html;
    
    if (recipientType === 'finder') {
      subject = 'New Claim Request for Your Found Item';
      to = claim.finder.email;
      html = `
        <h2>New Claim Request</h2>
        <p>Hello ${claim.finder.name},</p>
        <p>Someone has claimed your found item:</p>
        
        <h3>Found Item:</h3>
        <ul>
          <li><strong>Item:</strong> ${claim.foundItem.itemName}</li>
          <li><strong>Description:</strong> ${claim.foundItem.description}</li>
          <li><strong>Found at:</strong> ${claim.foundItem.placeFound}</li>
        </ul>
        
        <h3>Claimant Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${claim.claimant.name}</li>
          <li><strong>Student ID:</strong> ${claim.claimant.studentId}</li>
          <li><strong>Email:</strong> ${claim.claimant.email}</li>
        </ul>
        
        <p>Please log in to your account to review and respond to this claim.</p>
        
        <p>Best regards,<br>FindIT Team</p>
      `;
    } else {
      subject = 'Claim Status Update';
      to = claim.claimant.email;
      html = `
        <h2>Claim Status Update</h2>
        <p>Hello ${claim.claimant.name},</p>
        <p>Your claim status has been updated:</p>
        
        <h3>Claim Details:</h3>
        <ul>
          <li><strong>Status:</strong> ${claim.status}</li>
          <li><strong>Item:</strong> ${claim.lostItem.itemName}</li>
          <li><strong>Found Item:</strong> ${claim.foundItem.itemName}</li>
        </ul>
        
        ${claim.rejectionReason ? `<p><strong>Reason:</strong> ${claim.rejectionReason}</p>` : ''}
        
        <p>Please log in to your account for more details.</p>
        
        <p>Best regards,<br>FindIT Team</p>
      `;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Claim notification sent successfully');
  } catch (error) {
    console.error('Error sending claim notification:', error);
  }
};

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to FindIT - Lost & Found Platform',
      html: `
        <h2>Welcome to FindIT!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with FindIT, the PSG Tech Lost & Found platform.</p>
        
        <h3>What you can do:</h3>
        <ul>
          <li>Report lost items</li>
          <li>Report found items</li>
          <li>Search for your lost items</li>
          <li>Claim items you've lost</li>
          <li>Track your item status</li>
        </ul>
        
        <p>Your account details:</p>
        <ul>
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Student ID:</strong> ${user.studentId}</li>
          <li><strong>Email:</strong> ${user.email}</li>
        </ul>
        
        <p>If you have any questions, please contact the admin team.</p>
        
        <p>Best regards,<br>FindIT Team</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};
