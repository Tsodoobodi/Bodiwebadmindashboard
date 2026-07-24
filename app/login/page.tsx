"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, User, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("token", data.token);

        const check = await fetch(
          "https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net/api/protected",
          {
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          }
        );

        if (check.ok) {
          console.log("Protected API success:", await check.json());
        }

        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Нэвтрэхэд алдаа гарлаа");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Сервертэй холбогдоход алдаа гарлаа. Та дахин оролдоно уу.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className="
        w-full max-w-md
        overflow-hidden
        rounded-3xl
        border border-white/20
        bg-white/10
        shadow-[0_25px_80px_rgba(0,0,0,0.45)]
        backdrop-blur-2xl
        text-white
      "
    >
      {/* Top glow */}
      <div className="relative">
        <div className="absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        <CardHeader className="relative space-y-5 px-8 pt-10 pb-8">
          {/* Logo */}
          <div className="flex justify-center">
            
              <Image
                src="/images/logo.png"
                alt="Bodi Group Logo"
                width={75}
                height={75}
                priority
                className="object-contain"
              />
          </div>

          {/* Title */}
          <div className="text-center">
            <CardTitle className="text-3xl font-semibold tracking-tight text-white">
              Тавтай морилно уу
            </CardTitle>

            <p className="mt-3 text-sm leading-6 text-white/60">
              Удирдлагын системд нэвтрэхийн тулд
              <br />
              өөрийн эрхээр нэвтэрнэ үү.
            </p>
          </div>

          {/* Secure badge */}
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-white/60">
              Админ нэвтрэлт
            </span>
          </div>
        </CardHeader>
      </div>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 px-8">
          {/* Error */}
          {error && (
            <div className="
              rounded-xl
              border border-red-400/20
              bg-red-500/10
              px-4 py-3
              text-sm text-red-200
              backdrop-blur-sm
            ">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-white/80"
            >
              Хэрэглэгчийн нэр
            </Label>

            <div className="group relative">
              <User
                className="
                  absolute left-4 top-1/2
                  h-5 w-5
                  -translate-y-1/2
                  text-white/40
                  transition-colors
                  group-focus-within:text-white/80
                "
              />

              <Input
                id="username"
                type="text"
                placeholder="Хэрэглэгчийн нэрээ оруулна уу"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="
                  h-13
                  rounded-xl
                  border-white/15
                  bg-black/20
                  pl-12
                  text-white
                  placeholder:text-white/30
                  shadow-inner
                  backdrop-blur-md
                  transition-all
                  focus:border-white/30
                  focus:bg-black/30
                  focus:ring-2
                  focus:ring-white/10
                "
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-white/80"
            >
              Нууц үг
            </Label>

            <div className="group relative">
              <Lock
                className="
                  absolute left-4 top-1/2
                  h-5 w-5
                  -translate-y-1/2
                  text-white/40
                  transition-colors
                  group-focus-within:text-white/80
                "
              />

              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Нууц үгээ оруулна уу"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  h-13
                  rounded-xl
                  border-white/15
                  bg-black/20
                  pl-12
                  pr-12
                  text-white
                  placeholder:text-white/30
                  shadow-inner
                  backdrop-blur-md
                  transition-all
                  focus:border-white/30
                  focus:bg-black/30
                  focus:ring-2
                  focus:ring-white/10
                "
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                  absolute right-4 top-1/2
                  -translate-y-1/2
                  text-white/40
                  transition-colors
                  hover:text-white
                "
                aria-label={
                  showPassword
                    ? "Нууц үгийг нуух"
                    : "Нууц үгийг харуулах"
                }
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-8 pb-9 pt-7">
          <Button
            type="submit"
            disabled={isLoading}
            className="
              h-13
              w-full
              rounded-xl
              border border-white/20
              bg-[#0095DA]
              text-sm
              font-semibold
              text-white
              shadow-xl
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:bg-[#0095DA]/90
              hover:shadow-2xl
              disabled:cursor-not-allowed
              disabled:opacity-50
              cursor-pointer
            "
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span
                  className="
                    h-4 w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-black/20
                    border-t-black
                    cursor-pointer
                  "
                />
                Нэвтэрч байна...
              </span>
            ) : (
              "Системд нэвтрэх"
            )}
          </Button>
        </CardFooter>
      </form>

      {/* Bottom */}
      <div className="border-t border-white/10 bg-black/10 px-8 py-4 text-center">
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} Bodi Group. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </div>
    </Card>
  );
}