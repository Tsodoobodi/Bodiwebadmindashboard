import PresentationTabs from "@/components/PresentationTabs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PresentationTabs />
      <div className="mt-4">{children}</div>
    </div>
  );
}