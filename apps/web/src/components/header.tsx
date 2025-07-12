import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <div>
      <div className="fixed top-0 right-0 left-0 flex h-16 select-none items-center justify-center">
        <h1 className="indent-[1em] font-bold font-mono text-2xl text-primary tracking-[1em]">
          AMBIANCE
        </h1>
      </div>
      <div className="fixed top-0 right-0 flex h-16 flex-row items-center px-3.5">
        <ModeToggle />
        <UserMenu />
      </div>
    </div>
  );
}
