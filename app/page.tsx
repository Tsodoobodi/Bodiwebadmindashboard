import LoginForm from "./login/page";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/bg.jpg')",
        }}
      />
      {/* Login */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}