import Alert from "@/components/Alert";
import Navigation from "@/components/navigation";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Alert Section */}
      <div className="flex-none p-4">
        <Alert />
      </div>

      {/* Main Content Section */}
      <div className="flex-1 px-4">{children}</div>

      {/* Navigation Section - Fixed at bottom */}
      <div className="flex-1 h-20">
        <Navigation />
      </div>
    </div>
  );
}
