import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex flex-row items-center justify-end gap-2 p-2">
      <ModeToggle />
      <UserMenu />
    </div>
  );
}
