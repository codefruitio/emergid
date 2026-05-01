import type { Viewport } from "next";
import WhiteBgEffect from "./white-bg-effect";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function EmergencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WhiteBgEffect />
      {children}
    </>
  );
}
