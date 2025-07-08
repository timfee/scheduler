import { type NextConfig } from "next";

import "./env.config";
// Polyfill url.parse to avoid DEP0169 deprecation
import "./url-polyfill";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
