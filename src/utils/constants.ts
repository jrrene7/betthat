import Facebook from "src/icons/Facebook";
import Following from "src/icons/Following";
import Google from "src/icons/Google";
import Home from "src/icons/Home";

export const meta = {
  title: "Bet That | Bet on anything",
  description:
    "Place your bets now. Create a free account today.",
};

export const PRIMARY_COLOR = "#ff3b5c";
export const SECONDARY_COLOR = "#18D0F9";
export const DEFAULT_COLOR = "#fff";

export const signInMethods = [
  {
    icons: Google,
    content: "Continue with Google",
    provider: "google",
  },
  {
    icons: Facebook,
    content: "Continue with Facebook",
    provider: "facebook",
  },
];

export const menus = [
  {
    name: "For You",
    href: "/",
    icons: Home,
  },
  {
    name: "Following",
    href: "/following",
    icons: Following,
  },
];
