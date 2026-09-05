import { SessionClient } from "./session-client";

export default async function SessionPage(
  props: PageProps<"/sessions/[sessionId]">,
) {
  const { sessionId } = await props.params;
  return <SessionClient sessionId={sessionId} />;
}
