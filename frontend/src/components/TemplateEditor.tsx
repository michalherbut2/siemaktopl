import { MessageSquare } from "lucide-react";
import React, { useState } from "react";

const sampleValues = {
  target: "@Użytkownik",
  executor: "@Moderator",
  reason: "spam",
  timestamp: "<t:1733459911:R>",
  duration: "30 minut",
};

function renderPreview(
  template: string,
  values: Record<string, string>
): string {
  // return template.replace(/{(.*?)}/g, (_, key) => values[key] ?? `{${key}}`);
  // Replace {placeholders} → value
  let rendered = template.replace(/{(.*?)}/g, (_, key) => String(values[key] ?? `{${key}}`));

  // Timestamps: <t:unix:R> → relative string
  rendered = rendered.replace(/<t:(\d+):R>/g, (_, ts) => {
    const date = new Date(parseInt(ts) * 1000);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return "teraz";
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 60) return `za ${mins} min`;
    if (hours < 24) return `za ${hours} godz`;
    return `za ${days} dni`;
  });

  // Markdown-style replacements
  rendered = rendered
    .replace(/__([^_]+?)__/g, "<u>$1</u>")             // underline
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>") // bold
    .replace(/\*([^*]+?)\*/g, "<em>$1</em>")             // italic
    .replace(/~~(.+?)~~/g, "<s>$1</s>");                 // strikethrough

  return rendered;
}

interface TemplateEditorProps {
  value: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ value }) => {
  const preview = renderPreview(value, sampleValues);

  return (
    // <div>
    //   <label className="block text-sm text-gray-400 mb-1">Preview</label>
    //   {/* <div className="p-2 rounded border bg-gray-800 text-white border-gray-600 whitespace-pre-wrap">
    //     {preview}
        
    //   </div> */}
    //   <div
    //     className="p-2 rounded border bg-gray-800 text-white border-gray-600 whitespace-pre-wrap"
    //     dangerouslySetInnerHTML={{
    //       __html: renderPreview(value, sampleValues),
    //     }}
    //   />
    // </div>
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-700/30">
      <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        Template Preview
      </div>
      <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
        {/* {value} */}
           <div
        // className="p-2 rounded border bg-gray-800 text-white border-gray-600 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: renderPreview(value, sampleValues),
        }}
      />
      </div>
    </div>
  );
};

export default TemplateEditor;
