import UserMenu from "./user-menu";

export default function Header() {
  return (
    <div className="sticky top-0 grid h-16 shrink-0 grid-cols-[1fr_auto] items-center bg-background px-3.5 sm:grid-cols-3">
      <div className="hidden sm:block" />
      <div className="flex select-none items-center justify-center">
        <h1 className="indent-[0.5em] font-bold font-mono text-2xl text-primary tracking-[0.5em] sm:indent-[1em] sm:tracking-[1em]">
          AMBIANCE
        </h1>
      </div>
      <div className="flex items-center justify-end">
        <UserMenu />
      </div>
    </div>
  );
}
