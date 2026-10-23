"use client";

import LyricsWorkspace, { type LyricsWorkspaceProps } from "@/components/lyrics/LyricsWorkspace";

export default function LyricsPanel(props: Omit<LyricsWorkspaceProps, "editorEnabled">) {
  return <LyricsWorkspace {...props} editorEnabled={false} />;
}
