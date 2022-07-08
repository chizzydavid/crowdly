import nodemailer from "nodemailer";

export async function sendEmail(to: string, html: string) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "",
        pass: "",
      },
    });
  
    let info = await transporter.sendMail({
      from: 'davidchizindu@mail.com>',
      to, 
      subject: "Change Password",
      html, 
    });
  
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.log("email sending error ", error);
  }
}


