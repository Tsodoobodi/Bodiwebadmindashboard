import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { name, dept, desc, time } = await req.json();

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // өөрийн gmail
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "tsodoo19@gmail.com",
      subject: "New Presentation Form",
      text: `
        Name: ${name}
        Хэлтэс: ${dept}
        Тайлбар: ${desc}
        Цаг: ${time}
      `,
    });

    return NextResponse.json({ message: "Email амжилттай илгээгдлээ." });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json({ error: "Мэйл илгээхэд алдаа гарлаа." }, { status: 500 });
  }
}
