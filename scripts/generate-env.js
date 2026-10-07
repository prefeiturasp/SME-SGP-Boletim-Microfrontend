import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseEnv(content) {
  const env = {};
  const lines = content.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) return;

    const equalIndex = trimmedLine.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      env[key] = value;
    }
  });
  return env;
}

const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = parseEnv(envContent);

const envJsContent = `window.__ENV__ = {
  VITE_SGP_API: "${env.VITE_SGP_API || ""}",
  VITE_BOLETIM_VERSAO: "${env.VITE_BOLETIM_VERSAO || ""}"
};
`;

const publicDir = path.resolve(__dirname, "../public");
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.resolve(publicDir, "env.js"), envJsContent);
