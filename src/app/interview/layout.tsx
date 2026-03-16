export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-white" style={{ height: "100dvh" }}>
      {children}
    </div>
  );
}
