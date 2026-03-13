import Image from "next/image";
import Link from "next/link";
import { HomeLobby } from "@/components/home-lobby";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-black/20 p-8 shadow-glow backdrop-blur sm:p-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative w-full max-w-[320px]">
            <Image
              src="/assets/logo-mykolka.png"
              alt="Логотип Миколкиної гри"
              width={920}
              height={1010}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="font-display text-4xl leading-tight text-stone-50 sm:text-5xl">
              Миколкина гра
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200/85">
              Створи кімнату, надішли посилання колєгам і грайте онлайн за тими самими
              правилами.
            </p>
          </div>
        </div>
      </section>

      <HomeLobby />

      <div className="pb-2 text-center">
        <Link
          href="/rules"
          className="text-xs uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-stone-300"
        >
          правила гри
        </Link>
      </div>
    </main>
  );
}
