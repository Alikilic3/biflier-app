import Image from "next/image";
import Link from "next/link";
import { getBeheerder } from "@/lib/dal";
import HeaderNav from "@/app/components/HeaderNav";

export default async function Header() {
  const beheerder = await getBeheerder();
  const isAdmin = beheerder?.rol === "admin";

  return (
    <header className="h-16 shrink-0 border-b border-[#dfe3dd] bg-white">
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-5">
        <Link href="/" aria-label="BIF – naar de agenda" className="flex shrink-0 items-center">
          <Image
            src="/logo.svg"
            alt="BIF"
            width={188}
            height={57}
            priority
            className="h-[34px] w-auto"
          />
        </Link>

        <HeaderNav ingelogd={beheerder != null} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
