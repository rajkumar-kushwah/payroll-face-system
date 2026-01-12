


// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendInfoEmail = async (name, email, ip, userAgent, userId) => {
//   const loginLink = `${process.env.BACKEND_URL}/login`;
//   const auditLink = `${process.env.BACKEND_URL}/audit/${userId}`;

//   const htmlContent = `
//     <div style="max-width:600px; margin:auto; background:#f3f3f3; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:30px;">
//       <div style="text-align:center; border-bottom:2px solid #4CAF50; padding-bottom:10px; margin-bottom:25px;">
//         <h1 style="color:#4CAF50; margin:0;">Welcome to NabuTech!</h1>
//         <p style="color:#555; font-size:14px;">Empowering digital payments, made simple.</p>
//       </div>
//       <p style="font-size:16px; color:#333;">Hi <strong>${name}</strong>,</p>
//       <p style="font-size:15px; color:#555; line-height:1.6;">
//         We're excited to have you on board! <br/>
//         Your account has been <strong style="color:#4CAF50;">auto-verified</strong> successfully.
//         You can log in directly below:
//       </p>
//       <div style="text-align:center; margin:25px 0;">
//         <a href="${loginLink}" style="background:#4CAF50; color:#fff; padding:12px 25px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:15px;">Go to Login</a>
//       </div>
//       <div style="background:#f9f9f9; border-radius:8px; padding:15px 20px; font-size:14px; color:#333; border:1px solid #e0e0e0;">
//         <h3 style="color:#4CAF50; margin-bottom:10px;">Registration Details</h3>
//         <ul style="list-style:none; padding:0; margin:0;">
//           <li><strong>Name:</strong> ${name}</li>
//           <li><strong>Email:</strong> ${email}</li>
//           <li><strong>IP Address:</strong> ${ip}</li>
//           <li><strong>Device/Browser:</strong> ${userAgent}</li>
//           <li><strong>Registered At:</strong> ${new Date().toLocaleString()}</li>
//         </ul>
//       </div>
//       <div style="text-align:center; margin:25px 0;">
//         <a href="${auditLink}" style="background:#2196F3; color:#fff; padding:10px 22px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px;">View Registration Info</a>
//       </div>
//       <p style="font-size:13px; color:#777; text-align:center; margin-top:25px;">
//         If you didn’t create this account, please ignore this email or contact support.
//       </p>
//       <div style="text-align:center; margin-top:20px; font-size:12px; color:#999;">
//         <p>© ${new Date().getFullYear()} NabuTech. All rights reserved.</p>
//       </div>
//     </div>
//   `;

//   try {
//     const data = await resend.emails.send({
//       from: "NabuTech <onboarding@resend.dev>",
//       to: email,
//       subject: "Welcome to NabuTech - Your Email is Verified",
//       html: htmlContent,
//     });

//     console.log(" Email sent successfully:", data);
//   } catch (error) {
//     console.error(" Failed to send email:", error);
//   }
// };


// export const sendLoginEmail = async (name, email, ip, userAgent) => {
//   try {
//     const loginTime = new Date().toLocaleString();

//     const htmlContent = `
//       <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px; text-align:center; background-color:#f9f9f9;">
//         <h2 style="color:#4CAF50;">Hello ${name},</h2>
//         <p style="color:#333;">Your <strong>NabuTech</strong> account was just logged in successfully.</p>
//         <p style="color:#555;">If this was you, no action is needed.<br/>If not, please secure your account immediately.</p>
//         <hr style="margin:20px 0;"/>
//         <div style="text-align:left; display:inline-block; background:#fff; padding:15px 25px; border-radius:8px; border:1px solid #eee;">
//           <p><strong>Login Details:</strong></p>
//           <ul style="padding-left:15px; color:#444;">
//             <li><strong>IP Address:</strong> ${ip}</li>
//             <li><strong>Device/Browser:</strong> ${userAgent}</li>
//             <li><strong>Login Time:</strong> ${loginTime}</li>
//           </ul>
//         </div>
//         <p style="margin-top:25px; font-size:14px; color:#666;">
//           Stay safe, <br/><strong>- NabuTech Security Team</strong>
//         </p>
//         <div style="margin-top:20px; font-size:12px; color:#999;">
//           <p>© ${new Date().getFullYear()} NabuTech. All rights reserved.</p>
//         </div>
//       </div>
//     `;

//     const data = await resend.emails.send({
//       from: "NabuTech <onboarding@resend.dev>",
//       to: email,
//       subject: " Login Notification - NabuTech",
//       html: htmlContent,
//     });

//     console.log(` Login notification email sent to ${email}`, data);
//     return true;

//   } catch (err) {
//     console.error(" sendLoginEmail error:", err.message);
//     return false;
//   }
// };



// // ===== Send Login Notification Email =====
// // export const sendLoginEmail = async (name, email, ip, userAgent) => {
// //   try {
// //     const loginTime = new Date().toLocaleString();

// //     const htmlContent = `
// //       <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px; text-align:center; background-color:#f9f9f9;">
// //         <h2>Hello ${name},</h2>
// //         <p>Your NabuTech account was just logged in successfully.</p>
// //         <p>If this was you, no action is needed. If not, please secure your account immediately.</p>
// //         <hr/>
// //         <p><strong>Login Details:</strong></p>
// //         <ul style="text-align:left; display:inline-block;">
// //           <li><strong>IP Address:</strong> ${ip}</li>
// //           <li><strong>Device/Browser:</strong> ${userAgent}</li>
// //           <li><strong>Login Time:</strong> ${loginTime}</li>
// //         </ul>
// //         <p style="margin-top:15px;">Stay safe, <br/> - NabuTech Team</p>
// //       </div>
// //     `;

// //     await transporter.sendMail({
// //       from: `"NabuTech" <${process.env.EMAIL_USER}>`,
// //       to: email,
// //       subject: " Login Notification",
// //       html: htmlContent,
// //     });

// //     console.log(`Login notification email sent to ${email}`);
// //     return true;

// //   } catch (err) {
// //     console.error("sendLoginEmail error:", err.message);
// //     throw err; // optional, handle in login route
// //   }
// // };


// // ===== Send Logout Notification Email =====
// // ===============================
// export const sendLogoutEmail = async (name, email, ip, userAgent) => {
//   try {
//     const logoutTime = new Date().toLocaleString();

//     const html = `
//       <div style="font-family: Arial; max-width:600px; margin:auto; padding:20px; 
//       border:1px solid #ddd; border-radius:10px; background:#f9f9f9;">
      
//         <h2>Hello ${name},</h2>
//         <p>Your account was logged out successfully.</p>

//         <p><strong>IP:</strong> ${ip}</p>
//         <p><strong>Device:</strong> ${userAgent}</p>
//         <p><strong>Logout Time:</strong> ${logoutTime}</p>

//         <p style="margin-top:15px; color:#666;">Stay safe - NabuTech Team</p>
//       </div>
//     `;

//     await resend.emails.send({
//       from: "NabuTech <onboarding@resend.dev>",
//       to: email,
//       subject: "Logout Notification",
//       html,
//     });

//     console.log("Logout Email Sent ✔");
//   } catch (err) {
//     console.error("sendLogoutEmail error:", err.message);
//   }
// };


// // ===== Send Account Delete Notification Email =====
// // ===============================
// export const sendDeleteEmail = async (name, email, ip, userAgent) => {
//   try {
//     const time = new Date().toLocaleString();

//     const html = `
//       <div style="font-family: Arial; max-width:600px; margin:auto; padding:20px; 
//       border:1px solid #ddd; border-radius:10px; background:#f9f9f9;">
      
//         <h2>Hello ${name},</h2>
//         <p>Your NabuTech account has been <strong>deleted</strong>.</p>

//         <p><strong>IP:</strong> ${ip}</p>
//         <p><strong>Device:</strong> ${userAgent}</p>
//         <p><strong>Time:</strong> ${time}</p>

//         <p style="margin-top:15px; color:#666;">NabuTech Support Team</p>
//       </div>
//     `;

//     await resend.emails.send({
//       from: "NabuTech <onboarding@resend.dev>",
//       to: email,
//       subject: "⚠️ Your Account is Deleted",
//       html,
//     });

//     console.log("Delete Email Sent ✔");
//   } catch (err) {
//     console.error("sendDeleteEmail error:", err.message);
//   }
// };


// // ===== Optional: Send OTP Email =====
// // export const sendOtpEmail = async (email, otp) => {
// //   try {
// //     const html = `
// //       <div>
// //         <h3>Your OTP is: <strong>${otp}</strong></h3>
// //         <p>This OTP expires in 10 minutes.</p>
// //       </div>
// //     `;
// //     await transporter.sendMail({
// //       from: `"NabuTech" <${process.env.EMAIL_USER}>`,
// //       to: email,
// //       subject: "Your OTP",
// //       html,
// //     });
// //   } catch (err) {
// //     console.error("sendOtpEmail error:", err.message);
// //   }
// // };




// export const sendOtpEmail = async (email, otp) => {
//   try {
//     const html = `
//       <div style="font-family:Arial; max-width:400px; margin:auto; padding:20px; 
//       border:1px solid #ddd; border-radius:10px; background:#fff;">
//         <h3>Your OTP: <strong>${otp}</strong></h3>
//         <p>This OTP expires in 10 minutes.</p>
//       </div>
//     `;

//     await resend.emails.send({
//       from: "NabuTech <onboarding@resend.dev>",
//       to: email,
//       subject: "Your OTP Code",
//       html,
//     });

//     console.log("OTP Email Sent ✔");
//   } catch (err) {
//     console.error("sendOtpEmail error:", err.message);
//   }
// };


import { transporter } from "./mailer.js";

// ===== Welcome / Onboarding Email =====
export const sendInfoEmail = async (name, email, ip, userAgent, userId) => {
  const loginLink = `${process.env.BACKEND_URL}/login`;
  const auditLink = `${process.env.BACKEND_URL}/audit/${userId}`;

  const htmlContent = `
    <div style="max-width:600px; margin:auto; background:#f3f3f3; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:30px;">
      <div style="text-align:center; border-bottom:2px solid #4CAF50; padding-bottom:10px; margin-bottom:25px;">
        <h1 style="color:#4CAF50; margin:0;">Welcome to NabuTech!</h1>
        <p style="color:#555; font-size:14px;">Empowering digital payments, made simple.</p>
      </div>
      <p style="font-size:16px; color:#333;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:15px; color:#555; line-height:1.6;">
        We're excited to have you on board! <br/>
        Your account has been <strong style="color:#4CAF50;">auto-verified</strong> successfully.
        You can log in directly below:
      </p>
      <div style="text-align:center; margin:25px 0;">
        <a href="${loginLink}" style="background:#4CAF50; color:#fff; padding:12px 25px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:15px;">Go to Login</a>
      </div>
      <div style="background:#f9f9f9; border-radius:8px; padding:15px 20px; font-size:14px; color:#333; border:1px solid #e0e0e0;">
        <h3 style="color:#4CAF50; margin-bottom:10px;">Registration Details</h3>
        <ul style="list-style:none; padding:0; margin:0;">
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>IP Address:</strong> ${ip}</li>
          <li><strong>Device/Browser:</strong> ${userAgent}</li>
          <li><strong>Registered At:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>
      <div style="text-align:center; margin:25px 0;">
        <a href="${auditLink}" style="background:#2196F3; color:#fff; padding:10px 22px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px;">View Registration Info</a>
      </div>
      <p style="font-size:13px; color:#777; text-align:center; margin-top:25px;">
        If you didn’t create this account, please ignore this email or contact support.
      </p>
      <div style="text-align:center; margin-top:20px; font-size:12px; color:#999;">
        <p>© ${new Date().getFullYear()} NabuTech. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"NabuTech" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to NabuTech - Your Email is Verified",
      html: htmlContent,
    });

    console.log(" Info Email Sent to", email);
  } catch (err) {
    console.error(" sendInfoEmail error:", err.message);
  }
};

// ===== Login Notification =====
export const sendLoginEmail = async (name, email, ip, userAgent) => {
  const loginTime = new Date().toLocaleString();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px; text-align:center; background-color:#f9f9f9;">
      <h2 style="color:#4CAF50;">Hello ${name},</h2>
      <p style="color:#333;">Your <strong>NabuTech</strong> account was just logged in successfully.</p>
      <p style="color:#555;">If this was you, no action is needed.<br/>If not, please secure your account immediately.</p>
      <hr style="margin:20px 0;"/>
      <div style="text-align:left; display:inline-block; background:#fff; padding:15px 25px; border-radius:8px; border:1px solid #eee;">
        <p><strong>Login Details:</strong></p>
        <ul style="padding-left:15px; color:#444;">
          <li><strong>IP Address:</strong> ${ip}</li>
          <li><strong>Device/Browser:</strong> ${userAgent}</li>
          <li><strong>Login Time:</strong> ${loginTime}</li>
        </ul>
      </div>
      <p style="margin-top:25px; font-size:14px; color:#666;">Stay safe, <br/><strong>- NabuTech Security Team</strong></p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"NabuTech" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Login Notification - NabuTech",
      html,
    });
    console.log(" Login Email Sent to", email);
  } catch (err) {
    console.error(" sendLoginEmail error:", err.message);
  }
};

// ===== Logout Notification =====
export const sendLogoutEmail = async (name, email, ip, userAgent) => {
  const logoutTime = new Date().toLocaleString();
  const html = `
    <div style="font-family: Arial; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px; background:#f9f9f9;">
      <h2>Hello ${name},</h2>
      <p>Your account was logged out successfully.</p>
      <p><strong>IP:</strong> ${ip}</p>
      <p><strong>Device:</strong> ${userAgent}</p>
      <p><strong>Logout Time:</strong> ${logoutTime}</p>
      <p style="margin-top:15px; color:#666;">Stay safe - NabuTech Team</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"NabuTech" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Logout Notification",
      html,
    });
    console.log(" Logout Email Sent to", email);
  } catch (err) {
    console.error(" sendLogoutEmail error:", err.message);
  }
};

// ===== Account Delete Notification =====
export const sendDeleteEmail = async (name, email, ip, userAgent) => {
  const time = new Date().toLocaleString();
  const html = `
    <div style="font-family: Arial; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px; background:#f9f9f9;">
      <h2>Hello ${name},</h2>
      <p>Your NabuTech account has been <strong>deleted</strong>.</p>
      <p><strong>IP:</strong> ${ip}</p>
      <p><strong>Device:</strong> ${userAgent}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p style="margin-top:15px; color:#666;">NabuTech Support Team</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"NabuTech" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: " Your Account is Deleted",
      html,
    });
    console.log(" Delete Email Sent to", email);
  } catch (err) {
    console.error(" sendDeleteEmail error:", err.message);
  }
};

// ===== OTP Email =====
export const sendOtpEmail = async (email, otp) => {
  const html = `
    <div style="font-family:Arial; max-width:400px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:10px; background:#fff;">
      <h3>Your OTP: <strong>${otp}</strong></h3>
      <p>This OTP expires in 10 minutes.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"NabuTech" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html,
    });
    console.log(" OTP Email Sent to", email);
  } catch (err) {
    console.error(" sendOtpEmail error:", err.message);
  }
};
