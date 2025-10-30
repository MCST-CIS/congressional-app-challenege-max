import * as React from "react";
import Image from "next/image";

function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <Image
      src="/logo.png"
      alt="ChronoIQ Logo"
      width={60}
      height={24}
      priority // Ensures the logo loads quickly
    />
  );
}

export default Logo;
