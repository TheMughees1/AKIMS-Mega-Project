import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./tests",fullyParallel:false,workers:1,timeout:90_000,
  expect:{timeout:15_000},
  reporter:[["list"],["html",{open:"never"}]],
  use:{baseURL:"http://localhost:3100",trace:"retain-on-failure",screenshot:"only-on-failure",viewport:{width:1440,height:1000},
    launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH||"/usr/bin/chromium",args:["--no-sandbox"]}
  },
  webServer:{command:"node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",url:"http://localhost:3100/api/health",reuseExistingServer:false,timeout:90_000}
});
