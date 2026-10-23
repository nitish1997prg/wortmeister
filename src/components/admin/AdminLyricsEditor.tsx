"use client";

import LyricsWorkspace, { type LyricsWorkspaceProps } from "@/components/lyrics/LyricsWorkspace";

export default function AdminLyricsEditor(props: Omit<LyricsWorkspaceProps, "editorEnabled">) {
  return <LyricsWorkspace {...props} editorEnabled />;
}
