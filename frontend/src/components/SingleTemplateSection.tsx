// import { GuildConfig } from "../types";
// import TemplateEditor from "./TemplateEditor";
// import { useRef, useState } from "react";

// interface Channel {
//   id: string;
//   name: string;
//   type: number;
//   parentId: string;
//   position: string;
// }

// type SingleTemplateSectionProps = {
//   title: string;
//   enabled: boolean;
//   onToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   namePrefix: string;
//   values: {
//     channelId: string;
//     messageTemplate: string;
//   };
//   onChange: (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => void;
//   channels: Channel[];
// };

// export function SingleTemplateSection({
//   title,
//   enabled,
//   onToggle,
//   namePrefix,
//   values,
//   onChange,
//   channels,
// }: SingleTemplateSectionProps) {
//   const [showPreview, setShowPreview] = useState(false);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const buttons: {
//     label: string;
//     wrap: [string, string]; // tuple type
//     title: string;
//   }[] = [
//     { label: "B", wrap: ["**", "**"], title: "Bold" },
//     { label: "I", wrap: ["*", "*"], title: "Italic" },
//     { label: "U", wrap: ["__", "__"], title: "Underline" },
//     { label: "S", wrap: ["~~", "~~"], title: "Strikethrough" },
//     {
//       label: "{target}",
//       wrap: ["{target}", ""],
//       title: "Target placeholder",
//     },
//     {
//       label: "{executor}",
//       wrap: ["{executor}", ""],
//       title: "Executor placeholder",
//     },
//     {
//       label: "{reason}",
//       wrap: ["{reason}", ""],
//       title: "Reason placeholder",
//     },
//     {
//       label: "{timestamp}",
//       wrap: ["{timestamp}", ""],
//       title: "Timestamp placeholder",
//     },
//     {
//       label: "{duration}",
//       wrap: ["{duration}", ""],
//       title: "Duration placeholder",
//     },
//   ];

//   return (
//       <div className="p-2 rounded border bg-gray-800 text-white border-gray-600 whitespace-pre-wrap">

//     <fieldset>
//       <legend className="text-xl font-semibold text-gray-200 mb-2">
//         {title}
//       </legend>
//       <div className="space-y-4">
//         <label className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             name={`${namePrefix}Enabled`}
//             checked={enabled}
//             onChange={onToggle}
//             className="accent-indigo-500"
//           />
//           <span className="text-gray-300">Enabled</span>
//         </label>

//         <div>
//           <label className="block text-sm text-gray-400 mb-1">Channel ID</label>

//           <select
//             name={`${namePrefix}ChannelId`}
//             value={values.channelId || ""}
//             onChange={onChange}
//             className="w-full border border-gray-700 rounded-lg bg-gray-900 text-white px-3 py-2"
//           >
//             <option value="">None</option>
//             {channels
//               .filter(c => c.type === 0 || c.type === 5) // GUILD_TEXT or ANNOUNCEMENT
//               .map(c => (
//                 <option key={c.id} value={c.id}>
//                   #{c.name}
//                 </option>
//               ))}
//           </select>
//         </div>

//         <div className="flex gap-2 flex-wrap text-sm mb-1">
//           {buttons.map(({ label, wrap, title }) => (
//             <button
//               key={label}
//               type="button"
//               onClick={() => wrapSelection(textareaRef.current, wrap)}
//               title={title}
//               className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
//             >
//               {label}
//             </button>
//           ))}
//         </div>

//         <div>
//           <label className="block text-sm text-gray-400 mb-1">
//             Add Message Template
//           </label>
//           <textarea
//             ref={textareaRef}
//             name={`${namePrefix}MessageTemplate`}
//             value={values.messageTemplate}
//             onChange={onChange}
//             rows={3}
//             className="w-full border border-gray-700 rounded-lg bg-gray-900 text-white px-3 py-2"
//           />
//         </div>
//         {showPreview && <TemplateEditor value={values.messageTemplate} />}
//       </div>
//       </fieldset>
//         </div>
//   );
// }

// function wrapSelection(
//   textarea: HTMLTextAreaElement | null,
//   wrapper: [string, string],
//   fallback = "tekst"
// ) {
//   if (!textarea) return;

//   const start = textarea.selectionStart;
//   const end = textarea.selectionEnd;
//   const value = textarea.value;

//   const selectedText = value.substring(start, end) || fallback;

//   const newValue =
//     value.substring(0, start) +
//     wrapper[0] +
//     selectedText +
//     wrapper[1] +
//     value.substring(end);

//   textarea.value = newValue;

//   // Update cursor position
//   textarea.selectionStart = textarea.selectionEnd =
//     start + wrapper[0].length + selectedText.length + wrapper[1].length;

//   // Trigger input event for onChange to fire
//   textarea.dispatchEvent(new Event("input", { bubbles: true }));
// }

import {
  Bold,
  Clock,
  Hash,
  Italic,
  MessageSquare,
  Plus,
  Shield,
  Strikethrough,
  Timer,
  Underline,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRef, useState } from "react";
import { GuildConfig } from "../types";
import TemplateEditor from "./TemplateEditor";

interface Channel {
  id: string;
  name: string;
  type: number;
  parentId: string;
  position: string;
}

type SingleTemplateSectionProps = {
  title: string;
  enabled: boolean;
  onToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  namePrefix: string;
  values: {
    channelId: string;
    messageTemplate: string;
  };
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  channels: Channel[];
};

export function SingleTemplateSection({
  title,
  enabled,
  onToggle,
  namePrefix,
  values,
  onChange,
  channels,
}: SingleTemplateSectionProps) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const buttons: {
    label: string;
    wrap: [string, string];
    title: string;
    icon: React.ElementType;
  }[] = [
    { label: "B", wrap: ["**", "**"], title: "Bold", icon: Bold },
    { label: "I", wrap: ["*", "*"], title: "Italic", icon: Italic },
    { label: "U", wrap: ["__", "__"], title: "Underline", icon: Underline },
    {
      label: "S",
      wrap: ["~~", "~~"],
      title: "Strikethrough",
      icon: Strikethrough,
    },
    { label: "{target}", wrap: ["{target}", ""], title: "Target", icon: User },
    {
      label: "{executor}",
      wrap: ["{executor}", ""],
      title: "Executor",
      icon: Shield,
    },
    {
      label: "{reason}",
      wrap: ["{reason}", ""],
      title: "Reason",
      icon: MessageSquare,
    },
    {
      label: "{timestamp}",
      wrap: ["{timestamp}", ""],
      title: "Timestamp",
      icon: Clock,
    },
    {
      label: "{duration}",
      wrap: ["{duration}", ""],
      title: "Duration",
      icon: Timer,
    },
  ];

  const wrapSelection = (
    textarea: HTMLTextAreaElement | null,
    wrapper: [string, string],
    fallback = "tekst"
  ) => {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    const selectedText = value.substring(start, end) || fallback;

    const newValue =
      value.substring(0, start) +
      wrapper[0] +
      selectedText +
      wrapper[1] +
      value.substring(end);

    textarea.value = newValue;
    textarea.selectionStart = textarea.selectionEnd =
      start + wrapper[0].length + selectedText.length + wrapper[1].length;

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 backdrop-blur-sm">
              <Hash className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-sm text-slate-400">
                Configure your message template
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300">Enabled</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name={`${namePrefix}Enabled`}
                checked={enabled}
                onChange={onToggle}
                className="sr-only"
              />
              <div
                className={`w-12 h-6 rounded-full transition-all duration-300 ${
                  enabled
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25"
                    : "bg-slate-600"
                }`}
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 top-0.5 ${
                    enabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Channel Select */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Hash className="w-4 h-4 text-slate-400" />
            Channel
          </label>
          <div className="relative">
            <select
              name={`${namePrefix}ChannelId`}
              value={values.channelId || ""}
              onChange={onChange}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-800">
                Select a channel
              </option>
              {channels
                .filter(c => c.type === 0 || c.type === 5)
                .map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-800">
                    #{c.name}
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Formatting */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">
            Formatting Tools
          </label>
          <div className="flex gap-2 flex-wrap">
            {buttons.map(({ label, wrap, title, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => wrapSelection(textareaRef.current, wrap)}
                title={title}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-xs text-slate-300 transition-all hover:scale-105 active:scale-95 border border-slate-600/30"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Template */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Plus className="w-4 h-4 text-emerald-400" />
              Message Template
            </label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-xs text-slate-300 transition-colors"
            >
              {showPreview ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {showPreview ? "Hide" : "Preview"}
            </button>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              name={`${namePrefix}MessageTemplate`}
              value={values.messageTemplate}
              onChange={onChange}
              rows={4}
              placeholder="Enter your message template..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
              maxLength={2000}
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-500">
              {values.messageTemplate.length}/2000
            </div>
          </div>
          {showPreview && <TemplateEditor value={values.messageTemplate} />}
        </div>
      </div>
    </div>
  );
}
