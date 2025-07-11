import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  return (
    <div className="flex flex-row items-center justify-end gap-2 p-2">
      <ModeToggle />
      <UserMenu />
    </div>
  );
}
