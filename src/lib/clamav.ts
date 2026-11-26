import { createConnection } from "node:net";
import type { MalwareScanner } from "./malware";

// clamd INSTREAM returns a NUL-terminated verdict after the zero-length frame.
export function clamAvScanner(host: string, port: number): MalwareScanner {
  return {
    scan: ({ bytes }) =>
      new Promise((resolve) => {
        const socket = createConnection({ host, port });
        let response = "",
          settled = false;
        const finish = (status: "clean" | "infected" | "failed") => {
          if (settled) return;
          settled = true;
          clearTimeout(deadline);
          socket.destroy();
          resolve({ status, provider: "clamd" });
        };
        const deadline = setTimeout(() => finish("failed"), 15000);
        socket.on("error", () => finish("failed"));
        socket.on("close", () => finish("failed"));
        socket.on("connect", () => {
          socket.write("zINSTREAM\0");
          for (let offset = 0; offset < bytes.length; offset += 65536) {
            const chunk = bytes.subarray(offset, offset + 65536);
            const length = Buffer.alloc(4);
            length.writeUInt32BE(chunk.length);
            socket.write(length);
            socket.write(chunk);
          }
          socket.write(Buffer.alloc(4));
        });
        socket.on("data", (chunk) => {
          response += chunk.toString("utf8");
          if (response.length > 4096) return finish("failed");
          if (response.includes("\0")) {
            const verdict = response.split("\0")[0];
            finish(
              verdict === "stream: OK"
                ? "clean"
                : verdict.startsWith("stream: ") && verdict.endsWith(" FOUND")
                  ? "infected"
                  : "failed",
            );
          }
        });
      }),
  };
}
