import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceProvider } from "@/lib/demo/workspace-store";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
