// Runs the AI model in a background thread so the page doesn't freeze while Buddy thinks.
// buddyEngine.ts starts this worker and sends it messages.
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm"

const handler = new WebWorkerMLCEngineHandler()

self.onmessage = (message: MessageEvent) => {
  handler.onmessage(message)
}
