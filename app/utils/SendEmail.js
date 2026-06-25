const transporter = require("../config/emailConfig");

const otpModel = require("../models/OTPModel");

const SendEmail = async (req, user) => {
  // Generate a random 4-digit number
  const otp = Math.floor(1000 + Math.random() * 9000);

  // Save OTP in Database
  const saveotp = await new otpModel({ UserId: user._id, otp: otp }).save();
  console.log("otp", saveotp);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "OTP - Verify your account",
    text: "",
    html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table width="500px" style="background: #ffffff; padding: 20px; border-radius: 8px;">

              <tr>
                <td align="center">
                  <h2 style="color: #333;">Email Verification</h2>
                </td>
              </tr>

              <tr>
                <td>
                  <p>Dear <strong>${user.name}</strong>,</p>
                  <p>
                    Thank you for registering with us. Please use the OTP below to verify your email address:
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center">
                  <div style="
                    background-color: #a61616;
                    color: #ffffff;
                    padding: 15px;
                    font-size: 24px;
                    letter-spacing: 4px;
                    border-radius: 6px;
                    display: inline-block;
                  ">
                    ${otp}
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <p style="margin-top: 20px;">
                    This OTP is valid for <strong>5 minutes</strong>.
                  </p>

                  <p>
                    If you did not request this, please ignore this email.
                  </p>

                  <br/>

                  <p>Regards,<br/><strong>Your Team</strong></p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>`,
  });

  return otp;
};

module.exports = SendEmail;
