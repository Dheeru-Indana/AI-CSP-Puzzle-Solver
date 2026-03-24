import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { CryptArithmetic } from "./pages/CryptArithmetic";
import { MapColoring } from "./pages/MapColoring";
import { CustomCSP } from "./pages/CustomCSP";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/crypt-arithmetic",
    Component: CryptArithmetic,
  },
  {
    path: "/map-coloring",
    Component: MapColoring,
  },
  {
    path: "/custom-csp",
    Component: CustomCSP,
  },
]);
