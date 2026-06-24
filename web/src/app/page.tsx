import PreviewPane from "@/components/editor/PreviewPane";
import EditorPane from "@/components/editor/EditorPane";
import Toolbar from "@/components/editor/Toolbar";
import TopBar from "@/components/layout/TopBar";

export default function Home() {
  return (
    <div className="wrap">
      <TopBar />

      <Toolbar />

      <div className="split">
        <section className="pane editor-pane">
          <EditorPane />
        </section>

        <section className="pane preview-pane">
          <PreviewPane />
        </section>
      </div>
    </div>
  );
}
