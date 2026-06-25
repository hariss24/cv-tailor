import PreviewPane from "@/components/editor/PreviewPane";
import EditorPane from "@/components/editor/EditorPane";
import TopBar from "@/components/layout/TopBar";
import MetaBar from "@/components/layout/MetaBar";
import ActionsBar from "@/components/layout/ActionsBar";
import DraftManager from "@/components/layout/DraftManager";

export default function Home() {
  return (
    <div className="wrap">
      <TopBar />

      <MetaBar />

      <div className="split">
        <section className="pane editor-pane">
          <EditorPane />
        </section>

        <section className="pane preview-pane">
          <PreviewPane />
        </section>
      </div>

      <ActionsBar />

      <DraftManager />
    </div>
  );
}
