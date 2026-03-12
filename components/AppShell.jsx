"use client";

import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";
import SecondaryNav from "@/components/SecondaryNav";
import { PageContainer } from "@/components/ui";

export default function AppShell({
  badge,
  children,
  containerStyle,
  pageClassName = "",
  padded = true,
  density = "default",
  showSecondaryNav,
  secondaryNavItems,
  secondaryNavTitle,
}) {
  const pathname = usePathname();
  const shouldShowSecondaryNav = typeof showSecondaryNav === "boolean" ? showSecondaryNav : pathname !== "/";

  return (
    <div className={`cp-shell cp-app-shell ${pageClassName}`.trim()}>
      <TopBar badge={badge} />
      {shouldShowSecondaryNav ? <SecondaryNav items={secondaryNavItems} title={secondaryNavTitle} /> : null}
      <PageContainer style={containerStyle} padded={padded} density={density}>
        {children}
      </PageContainer>
    </div>
  );
}
